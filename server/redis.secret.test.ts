import { connect as connectNet } from "node:net";
import { connect as connectTls } from "node:tls";
import { once } from "node:events";
import { describe, expect, it } from "vitest";

const encodeRedisCommand = (parts: string[]) => `*${parts.length}\r\n${parts.map(part => `$${Buffer.byteLength(part)}\r\n${part}\r\n`).join("")}`;

async function pingConfiguredRedis() {
  const configuredUrl = process.env.REDIS_URL;
  if (!configuredUrl) throw new Error("REDIS_URL is not configured.");
  const parsed = new URL(configuredUrl);
  const port = Number(parsed.port || (parsed.protocol === "rediss:" ? 6380 : 6379));
  const socket = parsed.protocol === "rediss:"
    ? connectTls({ host: parsed.hostname, port, servername: parsed.hostname, rejectUnauthorized: true })
    : connectNet({ host: parsed.hostname, port });
  const timer = setTimeout(() => socket.destroy(new Error("Redis health check timed out.")), 8_000);
  try {
    await once(socket, parsed.protocol === "rediss:" ? "secureConnect" : "connect");
    const username = decodeURIComponent(parsed.username || "default");
    const password = decodeURIComponent(parsed.password);
    const response = await new Promise<string>((resolve, reject) => {
      let buffer = "";
      socket.on("data", chunk => {
        buffer += chunk.toString("utf8");
        if (buffer.includes("PONG") || buffer.startsWith("-")) resolve(buffer);
      });
      socket.once("error", reject);
      socket.write(`${encodeRedisCommand(["AUTH", username, password])}${encodeRedisCommand(["PING"])}`);
    });
    if (response.startsWith("-")) throw new Error("Redis authentication or health check failed.");
    return response;
  } finally {
    clearTimeout(timer);
    socket.end();
  }
}

describe("configured Redis security store", () => {
  it("authenticates and answers a server-only PING without exposing credentials", async () => {
    await expect(pingConfiguredRedis()).resolves.toContain("PONG");
  }, 12_000);
});
