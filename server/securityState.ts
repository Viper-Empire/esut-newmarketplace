import { createHmac } from "node:crypto";
import { once } from "node:events";
import { connect as connectNet, type Socket } from "node:net";
import { connect as connectTls, type TLSSocket } from "node:tls";

type RedisResponse = string | number | null | RedisResponse[];
type PendingResponse = { resolve: (value: RedisResponse) => void; reject: (error: Error) => void };
export type SecurityLimitDecision = { limited: boolean; retryAt: Date | null; count: number; source: "redis" };

const namespace = "esut-marketplace:v1:security";
const hmacSecret = process.env.JWT_SECRET || process.env.REDIS_URL || "esut-marketplace-security-key";
let connection: RespRedisClient | null = null;
let unavailableUntil = 0;
let lastDegradationLogAt = 0;
let lastFailure = "";

const limitScript = `
  local lockTtl = redis.call('TTL', KEYS[2])
  if lockTtl > 0 then return {1, lockTtl, 0} end
  local count = redis.call('INCR', KEYS[1])
  if count == 1 then redis.call('EXPIRE', KEYS[1], ARGV[2]) end
  if count > tonumber(ARGV[1]) then
    redis.call('SET', KEYS[2], '1', 'EX', ARGV[3])
    return {1, tonumber(ARGV[3]), count}
  end
  return {0, 0, count}
`;

function encodeCommand(parts: string[]) {
  return `*${parts.length}\r\n${parts.map(part => `$${Buffer.byteLength(part)}\r\n${part}\r\n`).join("")}`;
}

function parseResponse(buffer: Buffer, offset = 0): { value: RedisResponse; next: number } | null {
  if (offset >= buffer.length) return null;
  const type = String.fromCharCode(buffer[offset]!);
  const lineEnd = buffer.indexOf("\r\n", offset);
  if (lineEnd === -1) return null;
  const payload = buffer.subarray(offset + 1, lineEnd).toString("utf8");
  const afterLine = lineEnd + 2;
  if (type === "+") return { value: payload, next: afterLine };
  if (type === "-") throw new Error("Redis command rejected.");
  if (type === ":") return { value: Number(payload), next: afterLine };
  if (type === "$") {
    const length = Number(payload);
    if (length === -1) return { value: null, next: afterLine };
    if (!Number.isInteger(length) || buffer.length < afterLine + length + 2) return null;
    return { value: buffer.subarray(afterLine, afterLine + length).toString("utf8"), next: afterLine + length + 2 };
  }
  if (type === "*") {
    const count = Number(payload);
    if (count === -1) return { value: null, next: afterLine };
    if (!Number.isInteger(count) || count < 0) throw new Error("Redis response was malformed.");
    const values: RedisResponse[] = [];
    let next = afterLine;
    for (let index = 0; index < count; index += 1) {
      const parsed = parseResponse(buffer, next);
      if (!parsed) return null;
      values.push(parsed.value);
      next = parsed.next;
    }
    return { value: values, next };
  }
  throw new Error("Redis response was malformed.");
}

class RespRedisClient {
  private socket: Socket | TLSSocket | null = null;
  private connecting: Promise<void> | null = null;
  private buffer = Buffer.alloc(0);
  private pending: PendingResponse[] = [];

  constructor(private readonly endpoint: URL) {}

  private async ensureConnected() {
    if (this.socket && !this.socket.destroyed) return;
    if (!this.connecting) {
      this.connecting = (async () => {
        const usesTls = this.endpoint.protocol === "rediss:" || this.endpoint.protocol === "redis+tls:";
        const port = Number(this.endpoint.port || (usesTls ? 6380 : 6379));
        const socket = usesTls ? connectTls({ host: this.endpoint.hostname, port, servername: this.endpoint.hostname, rejectUnauthorized: true }) : connectNet({ host: this.endpoint.hostname, port });
        const timer = setTimeout(() => socket.destroy(new Error("Redis connection timed out.")), 2_500);
        try { await once(socket, usesTls ? "secureConnect" : "connect"); } finally { clearTimeout(timer); }
        socket.on("data", chunk => this.handleData(Buffer.from(chunk)));
        socket.on("error", () => this.resetPending());
        socket.on("close", () => this.resetPending());
        this.socket = socket;
        const username = decodeURIComponent(this.endpoint.username || "default");
        const password = decodeURIComponent(this.endpoint.password);
        if (password) await this.command(["AUTH", username, password]);
      })().finally(() => { this.connecting = null; });
    }
    return this.connecting;
  }

  private resetPending() {
    this.socket = null;
    const error = new Error("Redis connection closed.");
    this.pending.splice(0).forEach(request => request.reject(error));
    this.buffer = Buffer.alloc(0);
  }

  private handleData(chunk: Buffer) {
    this.buffer = Buffer.concat([this.buffer, chunk]);
    while (this.pending.length) {
      let parsed: { value: RedisResponse; next: number } | null;
      try { parsed = parseResponse(this.buffer); } catch (error) { this.resetPending(); return; }
      if (!parsed) return;
      this.buffer = this.buffer.subarray(parsed.next);
      this.pending.shift()!.resolve(parsed.value);
    }
  }

  async command(parts: string[]) {
    await this.ensureConnected();
    if (!this.socket || this.socket.destroyed) throw new Error("Redis connection is unavailable.");
    return new Promise<RedisResponse>((resolve, reject) => {
      this.pending.push({ resolve, reject });
      this.socket!.write(encodeCommand(parts), error => {
        if (!error) return;
        const request = this.pending.pop();
        request?.reject(error);
      });
    });
  }

  close() { this.socket?.end(); this.socket = null; }
}

function logDegradation(error?: unknown) {
  const message = error instanceof Error ? error.message.toLowerCase() : "";
  lastFailure = message.includes("timeout") ? "CONNECTION_TIMEOUT" : message.includes("auth") ? "AUTHENTICATION_FAILED" : "CONNECTION_FAILED";
  if (Date.now() - lastDegradationLogAt < 60_000) return;
  lastDegradationLogAt = Date.now();
  console.warn("[SecurityState] Redis security state is unavailable; using conservative database fallback.");
}

export function securityIdentifier(scope: string, value: string) {
  return createHmac("sha256", hmacSecret).update(`${scope}\u0000${value}`).digest("base64url").slice(0, 48);
}

export function securityStateKeys(scope: string, identifier: string) {
  const digest = securityIdentifier(scope, identifier);
  return { attempts: `${namespace}:${scope}:attempts:${digest}`, lockout: `${namespace}:${scope}:lockout:${digest}` };
}

async function getClient(): Promise<RespRedisClient | null> {
  const testIsolation = Boolean(process.env.VITEST) && process.env.REDIS_SECURITY_TEST !== "1";
  if (testIsolation || !process.env.REDIS_URL || Date.now() < unavailableUntil) return null;
  if (!connection) {
    try {
      const endpoint = new URL(process.env.REDIS_URL);
      if (!endpoint.hostname) throw new Error("Redis endpoint is invalid.");
      connection = new RespRedisClient(endpoint);
      await connection.command(["PING"]);
    } catch (error) {
      connection?.close();
      connection = null;
      unavailableUntil = Date.now() + 60_000;
      logDegradation(error);
      return null;
    }
  }
  return connection;
}

export async function consumeSecurityLimit({ scope, identifier, limit, windowSeconds, lockSeconds }: { scope: string; identifier: string; limit: number; windowSeconds: number; lockSeconds: number }): Promise<SecurityLimitDecision | null> {
  const redis = await getClient();
  if (!redis) return null;
  try {
    const keys = securityStateKeys(scope, identifier);
    const raw = await redis.command(["EVAL", limitScript, "2", keys.attempts, keys.lockout, String(limit), String(windowSeconds), String(lockSeconds)]);
    if (!Array.isArray(raw) || raw.length !== 3) throw new Error("Redis limit result was malformed.");
    const [limited, retrySeconds, count] = raw.map(Number);
    return { limited: limited === 1, retryAt: retrySeconds > 0 ? new Date(Date.now() + retrySeconds * 1_000) : null, count, source: "redis" };
  } catch (error) {
    connection?.close(); connection = null; unavailableUntil = Date.now() + 60_000; logDegradation(error); return null;
  }
}

export async function getSecurityLockout({ scope, identifier }: { scope: string; identifier: string }): Promise<Date | null | undefined> {
  const redis = await getClient();
  if (!redis) return undefined;
  try {
    const ttl = Number(await redis.command(["TTL", securityStateKeys(scope, identifier).lockout]));
    return ttl > 0 ? new Date(Date.now() + ttl * 1_000) : null;
  } catch (error) {
    connection?.close(); connection = null; unavailableUntil = Date.now() + 60_000; logDegradation(error); return undefined;
  }
}

export async function clearSecurityLimit({ scope, identifier }: { scope: string; identifier: string }) {
  const redis = await getClient();
  if (!redis) return false;
  try { const keys = securityStateKeys(scope, identifier); await redis.command(["DEL", keys.attempts, keys.lockout]); return true; }
  catch (error) { connection?.close(); connection = null; unavailableUntil = Date.now() + 60_000; logDegradation(error); return false; }
}

export const securityStateStatus = () => ({ configured: Boolean(process.env.REDIS_URL), degraded: Boolean(process.env.REDIS_URL) && Date.now() < unavailableUntil, failureClass: lastFailure || null });
