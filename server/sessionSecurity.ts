import { and, desc, eq, gt, inArray, lt } from "drizzle-orm";
import type { Request } from "express";
import { accountSecurityEvents, authSessions } from "../drizzle/schema";
import { getDb } from "./db";
import { createOpaqueToken, hashOpaqueToken } from "./localAuth";
import { securityIdentifier } from "./securityState";

type SecurityEventType = "LOGIN_SUCCEEDED" | "LOGIN_FAILED" | "ACCOUNT_LOCKED" | "SESSION_REVOKED" | "SESSIONS_REVOKED" | "PASSWORD_CHANGED" | "SUSPICIOUS_ACTIVITY" | "SECURITY_ALERT_SENT";

const getDbOrThrow = async () => {
  const db = await getDb();
  if (!db) throw new Error("Marketplace database is unavailable.");
  return db;
};

const userAgentDetails = (value: string | undefined) => {
  const userAgent = value?.slice(0, 500) ?? "";
  const browserFamily = /edg\//i.test(userAgent) ? "Microsoft Edge" : /chrome\//i.test(userAgent) ? "Chrome" : /firefox\//i.test(userAgent) ? "Firefox" : /safari\//i.test(userAgent) ? "Safari" : "Unknown browser";
  const osFamily = /android/i.test(userAgent) ? "Android" : /iphone|ipad|ipod/i.test(userAgent) ? "iOS" : /windows/i.test(userAgent) ? "Windows" : /mac os/i.test(userAgent) ? "macOS" : /linux/i.test(userAgent) ? "Linux" : "Unknown OS";
  return { browserFamily, osFamily, deviceLabel: `${browserFamily} on ${osFamily}` };
};

export const sessionRequestMetadata = (request: Pick<Request, "headers" | "ip">) => {
  const forwarded = request.headers["x-forwarded-for"];
  const clientIp = typeof forwarded === "string" ? forwarded.split(",")[0]?.trim() : request.ip;
  const agent = typeof request.headers["user-agent"] === "string" ? request.headers["user-agent"] : undefined;
  return { ...userAgentDetails(agent), ipFingerprint: clientIp ? securityIdentifier("session-ip", clientIp) : null };
};

type SessionMetadata = { deviceLabel: string | null; browserFamily: string | null; osFamily: string | null; ipFingerprint: string | null };

export const sessionMetadataNeedsRefresh = (current: SessionMetadata, next: ReturnType<typeof sessionRequestMetadata>) => current.deviceLabel !== next.deviceLabel || current.browserFamily !== next.browserFamily || current.osFamily !== next.osFamily || current.ipFingerprint !== next.ipFingerprint;

export async function recordAccountSecurityEvent({ userId, authSessionId, eventType, request, metadata = {} }: { userId: number | null; authSessionId?: number | null; eventType: SecurityEventType; request?: Pick<Request, "headers" | "ip">; metadata?: Record<string, string | number | boolean | null> }) {
  const db = await getDbOrThrow();
  const requestMetadata = request ? sessionRequestMetadata(request) : null;
  await db.insert(accountSecurityEvents).values({ userId, authSessionId: authSessionId ?? null, eventType, deviceLabel: requestMetadata?.deviceLabel ?? null, ipFingerprint: requestMetadata?.ipFingerprint ?? null, metadata });
}

export async function createTrackedSession({ userId, request, expiresInMs }: { userId: number; request: Pick<Request, "headers" | "ip">; expiresInMs: number }) {
  const db = await getDbOrThrow();
  const sessionId = createOpaqueToken();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + expiresInMs);
  const metadata = sessionRequestMetadata(request);
  const inserted = await db.insert(authSessions).values({ userId, sessionHash: hashOpaqueToken(sessionId), ...metadata, status: "ACTIVE", expiresAt, lastActiveAt: now });
  const authSessionId = Number(inserted[0].insertId);
  await recordAccountSecurityEvent({ userId, authSessionId, eventType: "LOGIN_SUCCEEDED", request, metadata: { source: "session_issued" } });
  return { sessionId, expiresAt, authSessionId };
}

export async function getActiveTrackedSession({ userId, sessionId, request }: { userId: number; sessionId: string | undefined; request?: Pick<Request, "headers" | "ip"> }) {
  if (!sessionId) return null;
  const db = await getDbOrThrow();
  const now = new Date();
  const row = (await db.select().from(authSessions).where(and(eq(authSessions.userId, userId), eq(authSessions.sessionHash, hashOpaqueToken(sessionId)), eq(authSessions.status, "ACTIVE"), gt(authSessions.expiresAt, now))).limit(1))[0];
  if (!row) return null;
  const requestMetadata = request ? sessionRequestMetadata(request) : null;
  const shouldRefreshMetadata = requestMetadata ? sessionMetadataNeedsRefresh(row, requestMetadata) : false;
  if (shouldRefreshMetadata || row.lastActiveAt.getTime() < now.getTime() - 5 * 60 * 1_000) {
    await db.update(authSessions).set({
      ...(requestMetadata ?? {}),
      lastActiveAt: now,
    }).where(eq(authSessions.id, row.id));
  }
  return row;
}

export async function revokeTrackedSession({ userId, sessionId, reason, request }: { userId: number; sessionId: string; reason: string; request?: Pick<Request, "headers" | "ip"> }) {
  const db = await getDbOrThrow();
  const row = (await db.select().from(authSessions).where(and(eq(authSessions.userId, userId), eq(authSessions.sessionHash, hashOpaqueToken(sessionId)), eq(authSessions.status, "ACTIVE"))).limit(1))[0];
  if (!row) return false;
  await db.update(authSessions).set({ status: "REVOKED", revokedAt: new Date(), revokeReason: reason }).where(eq(authSessions.id, row.id));
  await recordAccountSecurityEvent({ userId, authSessionId: row.id, eventType: "SESSION_REVOKED", request, metadata: { reason } });
  return true;
}

export async function revokeTrackedSessionById({ userId, authSessionId, currentSessionId, reason, request }: { userId: number; authSessionId: number; currentSessionId: string; reason: string; request?: Pick<Request, "headers" | "ip"> }) {
  const db = await getDbOrThrow();
  const row = (await db.select().from(authSessions).where(and(eq(authSessions.id, authSessionId), eq(authSessions.userId, userId), eq(authSessions.status, "ACTIVE"))).limit(1))[0];
  if (!row || row.sessionHash === hashOpaqueToken(currentSessionId)) return false;
  await db.update(authSessions).set({ status: "REVOKED", revokedAt: new Date(), revokeReason: reason }).where(eq(authSessions.id, row.id));
  await recordAccountSecurityEvent({ userId, authSessionId: row.id, eventType: "SESSION_REVOKED", request, metadata: { reason } });
  return true;
}

export async function revokeOtherTrackedSessions({ userId, currentSessionId, reason, request }: { userId: number; currentSessionId: string; reason: string; request?: Pick<Request, "headers" | "ip"> }) {
  const db = await getDbOrThrow();
  const rows = await db.select({ id: authSessions.id }).from(authSessions).where(and(eq(authSessions.userId, userId), eq(authSessions.status, "ACTIVE"), lt(authSessions.createdAt, new Date(Date.now() + 1))));
  const currentHash = hashOpaqueToken(currentSessionId);
  const current = (await db.select({ id: authSessions.id }).from(authSessions).where(and(eq(authSessions.userId, userId), eq(authSessions.sessionHash, currentHash), eq(authSessions.status, "ACTIVE"))).limit(1))[0];
  const revokeIds = rows.map(row => row.id).filter(id => id !== current?.id);
  if (revokeIds.length) await db.update(authSessions).set({ status: "REVOKED", revokedAt: new Date(), revokeReason: reason }).where(inArray(authSessions.id, revokeIds));
  await recordAccountSecurityEvent({ userId, authSessionId: current?.id ?? null, eventType: "SESSIONS_REVOKED", request, metadata: { count: revokeIds.length, reason } });
  return revokeIds.length;
}

export async function listAccountSecurity({ userId, currentSessionId }: { userId: number; currentSessionId?: string }) {
  const db = await getDbOrThrow();
  const now = new Date();
  await db.update(authSessions).set({ status: "EXPIRED" }).where(and(eq(authSessions.userId, userId), eq(authSessions.status, "ACTIVE"), lt(authSessions.expiresAt, now)));
  const [sessions, events] = await Promise.all([
    db.select().from(authSessions).where(eq(authSessions.userId, userId)).orderBy(desc(authSessions.lastActiveAt)).limit(20),
    db.select().from(accountSecurityEvents).where(eq(accountSecurityEvents.userId, userId)).orderBy(desc(accountSecurityEvents.createdAt)).limit(50),
  ]);
  const currentHash = currentSessionId ? hashOpaqueToken(currentSessionId) : null;
  return { sessions: sessions.map(session => ({ id: session.id, deviceLabel: session.deviceLabel, browserFamily: session.browserFamily, osFamily: session.osFamily, status: session.status, createdAt: session.createdAt, lastActiveAt: session.lastActiveAt, expiresAt: session.expiresAt, revokedAt: session.revokedAt, revokeReason: session.revokeReason, isCurrent: currentHash === session.sessionHash })), events: events.map(event => ({ id: event.id, eventType: event.eventType, deviceLabel: event.deviceLabel, metadata: event.metadata, createdAt: event.createdAt })) };
}
