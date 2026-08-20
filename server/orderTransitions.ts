import { TRPCError } from "@trpc/server";
import { and, eq, gte, sql } from "drizzle-orm";
import { auditLogs, inventory, inventoryReservations, marketplaceEvents, notifications, orders, orderStatusHistory, pickupCoordinations, stores } from "../drizzle/schema";
import { assertAllowedOrderTransition, type OrderStatus } from "./orderLifecycle";
import { encryptPickupCode, generatePickupCode } from "./pickupCode";

const affectedRows = (result: unknown) => Number((result as { affectedRows?: number })?.affectedRows ?? (result as [{ affectedRows?: number }])?.[0]?.affectedRows ?? 0);

export async function applyOrderTransition(tx: any, order: any, nextStatus: OrderStatus, actorUserId: number | null, note?: string, expiry = false, pickupConfirmed = false) {
  try { assertAllowedOrderTransition(order.status as OrderStatus, nextStatus); } catch (error) { throw new TRPCError({ code: "BAD_REQUEST", message: error instanceof Error ? error.message : "Invalid order transition." }); }
  if (nextStatus === "COMPLETED" && !pickupConfirmed && !order.pickupCodeVerifiedAt) throw new TRPCError({ code: "BAD_REQUEST", message: "A buyer pickup confirmation code is required before completing this order." });
  const activeReservations = await tx.select().from(inventoryReservations).where(and(eq(inventoryReservations.orderId, order.id), eq(inventoryReservations.status, "ACTIVE")));
  if (nextStatus === "CANCELLED") {
    for (const reservation of activeReservations) {
      const updated = await tx.update(inventory).set({ reservedQuantity: sql`${inventory.reservedQuantity} - ${reservation.quantity}` }).where(and(eq(inventory.listingId, reservation.listingId), gte(inventory.reservedQuantity, reservation.quantity)));
      if (affectedRows(updated) !== 1) throw new TRPCError({ code: "CONFLICT", message: "Inventory reservation could not be released safely." });
      await tx.update(inventoryReservations).set({ status: expiry ? "EXPIRED" : "RELEASED" }).where(eq(inventoryReservations.id, reservation.id));
    }
  }
  if (nextStatus === "COMPLETED") {
    for (const reservation of activeReservations) {
      const updated = await tx.update(inventory).set({ quantity: sql`${inventory.quantity} - ${reservation.quantity}`, reservedQuantity: sql`${inventory.reservedQuantity} - ${reservation.quantity}` }).where(and(eq(inventory.listingId, reservation.listingId), gte(inventory.quantity, reservation.quantity), gte(inventory.reservedQuantity, reservation.quantity)));
      if (affectedRows(updated) !== 1) throw new TRPCError({ code: "CONFLICT", message: "Inventory commitment could not be completed safely." });
      await tx.update(inventoryReservations).set({ status: "COMMITTED" }).where(eq(inventoryReservations.id, reservation.id));
    }
  }
  const generatedPickupCode = nextStatus === "READY_FOR_PICKUP" && !order.pickupCodeCiphertext ? generatePickupCode() : null;
  await tx.update(orders).set({ status: nextStatus, paymentStatus: nextStatus === "COMPLETED" ? "PAID" : order.paymentStatus, ...(generatedPickupCode ? { pickupCodeCiphertext: encryptPickupCode(generatedPickupCode), pickupCodeIssuedAt: new Date(), pickupCodeFailedAttempts: 0 } : {}) }).where(eq(orders.id, order.id));
  if (nextStatus === "READY_FOR_PICKUP") await tx.insert(pickupCoordinations).values({ orderId: order.id, status: "NOT_STARTED" }).onDuplicateKeyUpdate({ set: { updatedAt: new Date() } });
  await tx.insert(orderStatusHistory).values({ orderId: order.id, oldStatus: order.status, newStatus: nextStatus, actorUserId, note: note ?? null });
  await tx.insert(auditLogs).values({ actorUserId, action: `ORDER_${nextStatus}`, targetType: "ORDER", targetId: String(order.id), metadata: { oldStatus: order.status, note: note ?? null, systemTriggered: actorUserId === null } });
  const storeRows = await tx.select().from(stores).where(eq(stores.id, order.storeId)).limit(1);
  const sellerId = storeRows[0]?.ownerUserId;
  await tx.insert(notifications).values({ userId: order.buyerUserId, type: "ORDER_STATUS", title: `Order ${nextStatus.toLowerCase().replaceAll("_", " ")}`, message: `Your order ${order.publicId} is now ${nextStatus.toLowerCase().replaceAll("_", " ")}.`, targetRoute: `/account/orders/${order.publicId}` });
  await tx.insert(marketplaceEvents).values({ userId: order.buyerUserId, eventType: "ORDER_STATUS_UPDATED", aggregateKey: `order:${order.id}`, targetRoute: `/account/orders/${order.publicId}` });
  if (sellerId && sellerId !== actorUserId) await tx.insert(notifications).values({ userId: sellerId, type: "ORDER_STATUS", title: `Order ${nextStatus.toLowerCase().replaceAll("_", " ")}`, message: `Order ${order.publicId} is now ${nextStatus.toLowerCase().replaceAll("_", " ")}.`, targetRoute: `/seller/orders/${order.publicId}` });
  if (sellerId && sellerId !== actorUserId) await tx.insert(marketplaceEvents).values({ userId: sellerId, eventType: "ORDER_STATUS_UPDATED", aggregateKey: `order:${order.id}`, targetRoute: `/seller/orders/${order.publicId}` });
}
