import {
  bigint,
  boolean,
  decimal,
  index,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

export const marketplaceRoles = ["CUSTOMER", "SELLER", "MODERATOR", "ADMIN", "SUPER_ADMIN"] as const;
export const storeStatuses = ["PENDING", "ACTIVE", "SUSPENDED", "CLOSED"] as const;
export const listingStatuses = ["DRAFT", "PENDING_REVIEW", "ACTIVE", "RESERVED", "SOLD", "ARCHIVED"] as const;
export const listingConditions = ["NEW", "LIKE_NEW", "USED_GOOD", "USED_FAIR", "REFURBISHED"] as const;
export const orderStatuses = ["PENDING", "CONFIRMED", "PROCESSING", "READY_FOR_PICKUP", "COMPLETED", "CANCELLED", "DISPUTED"] as const;
export const offerStatuses = ["PENDING", "COUNTERED", "ACCEPTED", "REJECTED", "EXPIRED", "CANCELLED"] as const;
export const reviewStatuses = ["PUBLISHED", "REPORTED", "REMOVED"] as const;

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  passwordHash: varchar("passwordHash", { length: 255 }),
  emailVerifiedAt: timestamp("emailVerifiedAt"),
  failedLoginCount: int("failedLoginCount").default(0).notNull(),
  lockedUntil: timestamp("lockedUntil"),
  role: mysqlEnum("role", marketplaceRoles).default("CUSTOMER").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
}, (table) => [uniqueIndex("users_email_unique_idx").on(table.email)]);

export const authTokens = mysqlTable("authTokens", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  tokenHash: varchar("tokenHash", { length: 64 }).notNull().unique(),
  purpose: mysqlEnum("purpose", ["EMAIL_VERIFY", "PASSWORD_RESET"]).notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  consumedAt: timestamp("consumedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [index("auth_tokens_user_purpose_idx").on(table.userId, table.purpose, table.expiresAt)]);

export const authRateLimits = mysqlTable("authRateLimits", {
  id: int("id").autoincrement().primaryKey(),
  rateKey: varchar("rateKey", { length: 80 }).notNull().unique(),
  attempts: int("attempts").default(0).notNull(),
  windowStartedAt: timestamp("windowStartedAt").defaultNow().notNull(),
  blockedUntil: timestamp("blockedUntil"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const profiles = mysqlTable("profiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  phone: varchar("phone", { length: 32 }),
  location: varchar("location", { length: 180 }),
  avatarUrl: text("avatarUrl"),
  bio: text("bio"),
  accountType: mysqlEnum("accountType", ["INDIVIDUAL", "BUSINESS"]).default("INDIVIDUAL").notNull(),
  verificationStatus: mysqlEnum("verificationStatus", ["UNVERIFIED", "PENDING", "APPROVED", "REJECTED"]).default("UNVERIFIED").notNull(),
  verifiedAt: timestamp("verifiedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const sellerApplications = mysqlTable("sellerApplications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  proposedStoreName: varchar("proposedStoreName", { length: 160 }).notNull(),
  description: text("description").notNull(),
  phone: varchar("phone", { length: 32 }).notNull(),
  location: varchar("location", { length: 180 }).notNull(),
  sellerType: mysqlEnum("sellerType", ["INDIVIDUAL", "BUSINESS"]).default("INDIVIDUAL").notNull(),
  status: mysqlEnum("status", ["PENDING", "APPROVED", "REJECTED"]).default("PENDING").notNull(),
  reviewedBy: int("reviewedBy"),
  reviewNote: text("reviewNote"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const stores = mysqlTable("stores", {
  id: int("id").autoincrement().primaryKey(),
  ownerUserId: int("ownerUserId").notNull().unique(),
  name: varchar("name", { length: 160 }).notNull(),
  slug: varchar("slug", { length: 180 }).notNull().unique(),
  description: text("description"),
  logoUrl: text("logoUrl"),
  bannerUrl: text("bannerUrl"),
  location: varchar("location", { length: 180 }).notNull(),
  contactPhone: varchar("contactPhone", { length: 32 }),
  socialLinks: json("socialLinks"),
  status: mysqlEnum("status", storeStatuses).default("PENDING").notNull(),
  isVerified: boolean("isVerified").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [index("stores_status_idx").on(table.status)]);

export const verificationRequests = mysqlTable("verificationRequests", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  esutEmail: varchar("esutEmail", { length: 320 }),
  registrationNumber: varchar("registrationNumber", { length: 80 }),
  documentUrl: text("documentUrl"),
  verificationType: mysqlEnum("verificationType", ["INDIVIDUAL_IDENTITY", "BUSINESS_ENTITY"]).default("INDIVIDUAL_IDENTITY").notNull(),
  businessName: varchar("businessName", { length: 180 }),
  businessRegistrationNumber: varchar("businessRegistrationNumber", { length: 120 }),
  identityDocumentUrl: text("identityDocumentUrl"),
  businessDocumentUrl: text("businessDocumentUrl"),
  status: mysqlEnum("status", ["PENDING", "APPROVED", "REJECTED"]).default("PENDING").notNull(),
  reviewedBy: int("reviewedBy"),
  reviewNote: text("reviewNote"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [index("verification_user_idx").on(table.userId), index("verification_status_idx").on(table.status)]);

export const categories = mysqlTable("categories", {
  id: int("id").autoincrement().primaryKey(),
  parentId: int("parentId"),
  name: varchar("name", { length: 120 }).notNull(),
  slug: varchar("slug", { length: 140 }).notNull().unique(),
  description: text("description"),
  icon: varchar("icon", { length: 80 }),
  imageUrl: text("imageUrl"),
  isFeatured: boolean("isFeatured").default(false).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const listings = mysqlTable("listings", {
  id: int("id").autoincrement().primaryKey(),
  storeId: int("storeId").notNull(),
  categoryId: int("categoryId").notNull(),
  title: varchar("title", { length: 240 }).notNull(),
  slug: varchar("slug", { length: 280 }).notNull().unique(),
  description: text("description").notNull(),
  specifications: json("specifications"),
  condition: mysqlEnum("condition", listingConditions).notNull(),
  priceKobo: int("priceKobo").notNull(),
  compareAtPriceKobo: int("compareAtPriceKobo"),
  location: varchar("location", { length: 180 }).notNull(),
  fulfillmentDetails: text("fulfillmentDetails"),
  status: mysqlEnum("status", listingStatuses).default("DRAFT").notNull(),
  allowOffers: boolean("allowOffers").default(true).notNull(),
  viewCount: int("viewCount").default(0).notNull(),
  favoriteCount: int("favoriteCount").default(0).notNull(),
  publishedAt: timestamp("publishedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  index("listings_catalog_idx").on(table.status, table.categoryId),
  index("listings_store_idx").on(table.storeId),
  index("listings_price_idx").on(table.priceKobo),
]);

export const listingImages = mysqlTable("listingImages", {
  id: int("id").autoincrement().primaryKey(),
  listingId: int("listingId").notNull(),
  storageKey: varchar("storageKey", { length: 600 }).notNull(),
  url: text("url").notNull(),
  altText: varchar("altText", { length: 280 }),
  width: int("width"),
  height: int("height"),
  sortOrder: int("sortOrder").default(0).notNull(),
  isPrimary: boolean("isPrimary").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [index("listing_images_idx").on(table.listingId, table.sortOrder)]);

export const inventory = mysqlTable("inventory", {
  id: int("id").autoincrement().primaryKey(),
  listingId: int("listingId").notNull().unique(),
  quantity: int("quantity").default(0).notNull(),
  reservedQuantity: int("reservedQuantity").default(0).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const orderBatches = mysqlTable("orderBatches", {
  id: int("id").autoincrement().primaryKey(),
  publicId: varchar("publicId", { length: 40 }).notNull().unique(),
  buyerUserId: int("buyerUserId").notNull(),
  idempotencyKey: varchar("idempotencyKey", { length: 80 }).notNull(),
  status: mysqlEnum("status", ["ACTIVE", "COMPLETED", "CANCELLED"]).default("ACTIVE").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [uniqueIndex("order_batch_buyer_key_unique_idx").on(table.buyerUserId, table.idempotencyKey), index("order_batch_buyer_idx").on(table.buyerUserId, table.createdAt)]);

export const inventoryReservations = mysqlTable("inventoryReservations", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull(),
  listingId: int("listingId").notNull(),
  quantity: int("quantity").notNull(),
  status: mysqlEnum("status", ["ACTIVE", "COMMITTED", "RELEASED", "EXPIRED"]).default("ACTIVE").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [index("inventory_reservation_order_idx").on(table.orderId), index("inventory_reservation_expiry_idx").on(table.status, table.expiresAt), uniqueIndex("inventory_reservation_order_listing_unique_idx").on(table.orderId, table.listingId)]);

export const favorites = mysqlTable("favorites", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  listingId: int("listingId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [uniqueIndex("favorite_unique_idx").on(table.userId, table.listingId), index("favorites_listing_idx").on(table.listingId)]);

export const carts = mysqlTable("carts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  status: mysqlEnum("status", ["ACTIVE", "CONVERTED", "ABANDONED"]).default("ACTIVE").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const cartItems = mysqlTable("cartItems", {
  id: int("id").autoincrement().primaryKey(),
  cartId: int("cartId").notNull(),
  listingId: int("listingId").notNull(),
  quantity: int("quantity").notNull(),
  savedForLater: boolean("savedForLater").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [uniqueIndex("cart_item_unique_idx").on(table.cartId, table.listingId), index("cart_items_cart_idx").on(table.cartId)]);

export const orders = mysqlTable("orders", {
  id: int("id").autoincrement().primaryKey(),
  publicId: varchar("publicId", { length: 40 }).notNull().unique(),
  orderBatchId: int("orderBatchId"),
  buyerUserId: int("buyerUserId").notNull(),
  storeId: int("storeId").notNull(),
  status: mysqlEnum("status", orderStatuses).default("PENDING").notNull(),
  fulfillmentMethod: mysqlEnum("fulfillmentMethod", ["CAMPUS_PICKUP"]).default("CAMPUS_PICKUP").notNull(),
  pickupNote: text("pickupNote"),
  paymentMethod: mysqlEnum("paymentMethod", ["CASH_ON_PICKUP"]).default("CASH_ON_PICKUP").notNull(),
  paymentStatus: mysqlEnum("paymentStatus", ["UNPAID", "PENDING", "PAID", "REFUNDED"]).default("UNPAID").notNull(),
  subtotalKobo: int("subtotalKobo").notNull(),
  feesKobo: int("feesKobo").default(0).notNull(),
  totalKobo: int("totalKobo").notNull(),
  reservationExpiresAt: timestamp("reservationExpiresAt"),
  pickupCodeCiphertext: text("pickupCodeCiphertext"),
  pickupCodeIssuedAt: timestamp("pickupCodeIssuedAt"),
  pickupCodeVerifiedAt: timestamp("pickupCodeVerifiedAt"),
  pickupCodeFailedAttempts: int("pickupCodeFailedAttempts").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [index("orders_buyer_idx").on(table.buyerUserId, table.createdAt), index("orders_store_idx").on(table.storeId, table.createdAt), index("orders_batch_idx").on(table.orderBatchId)]);

export const orderItems = mysqlTable("orderItems", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull(),
  listingId: int("listingId").notNull(),
  titleSnapshot: varchar("titleSnapshot", { length: 240 }).notNull(),
  imageUrlSnapshot: text("imageUrlSnapshot"),
  unitPriceKobo: int("unitPriceKobo").notNull(),
  quantity: int("quantity").notNull(),
  subtotalKobo: int("subtotalKobo").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [index("order_items_order_idx").on(table.orderId)]);

export const orderStatusHistory = mysqlTable("orderStatusHistory", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull(),
  oldStatus: mysqlEnum("oldStatus", orderStatuses),
  newStatus: mysqlEnum("newStatus", orderStatuses).notNull(),
  actorUserId: int("actorUserId").notNull(),
  note: text("note"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const offers = mysqlTable("offers", {
  id: int("id").autoincrement().primaryKey(),
  listingId: int("listingId").notNull(),
  buyerUserId: int("buyerUserId").notNull(),
  storeId: int("storeId").notNull(),
  amountKobo: int("amountKobo").notNull(),
  quantity: int("quantity").default(1).notNull(),
  status: mysqlEnum("status", offerStatuses).default("PENDING").notNull(),
  message: text("message"),
  expiresAt: timestamp("expiresAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [index("offers_buyer_idx").on(table.buyerUserId, table.status), index("offers_store_idx").on(table.storeId, table.status)]);

export const conversations = mysqlTable("conversations", {
  id: int("id").autoincrement().primaryKey(),
  listingId: int("listingId"),
  orderId: int("orderId"),
  offerId: int("offerId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const conversationParticipants = mysqlTable("conversationParticipants", {
  id: int("id").autoincrement().primaryKey(),
  conversationId: int("conversationId").notNull(),
  userId: int("userId").notNull(),
  lastReadAt: timestamp("lastReadAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [uniqueIndex("conversation_participant_unique_idx").on(table.conversationId, table.userId), index("conversation_user_idx").on(table.userId)]);

export const messages = mysqlTable("messages", {
  id: int("id").autoincrement().primaryKey(),
  conversationId: int("conversationId").notNull(),
  senderUserId: int("senderUserId").notNull(),
  body: text("body").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [index("messages_conversation_idx").on(table.conversationId, table.createdAt)]);

export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  type: varchar("type", { length: 80 }).notNull(),
  title: varchar("title", { length: 180 }).notNull(),
  message: text("message").notNull(),
  targetRoute: varchar("targetRoute", { length: 400 }),
  isRead: boolean("isRead").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [index("notifications_user_idx").on(table.userId, table.isRead, table.createdAt)]);

export const reviews = mysqlTable("reviews", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull(),
  listingId: int("listingId").notNull(),
  storeId: int("storeId").notNull(),
  buyerUserId: int("buyerUserId").notNull(),
  rating: int("rating").notNull(),
  comment: text("comment"),
  sellerResponse: text("sellerResponse"),
  status: mysqlEnum("status", reviewStatuses).default("PUBLISHED").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [uniqueIndex("review_order_listing_unique_idx").on(table.orderId, table.listingId), index("reviews_store_idx").on(table.storeId, table.status)]);

export const reports = mysqlTable("reports", {
  id: int("id").autoincrement().primaryKey(),
  reporterUserId: int("reporterUserId").notNull(),
  targetType: mysqlEnum("targetType", ["LISTING", "STORE", "USER", "MESSAGE", "REVIEW"]).notNull(),
  targetId: int("targetId").notNull(),
  reason: varchar("reason", { length: 180 }).notNull(),
  details: text("details"),
  status: mysqlEnum("status", ["OPEN", "INVESTIGATING", "RESOLVED", "DISMISSED"]).default("OPEN").notNull(),
  resolvedBy: int("resolvedBy"),
  resolutionNote: text("resolutionNote"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const disputes = mysqlTable("disputes", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull().unique(),
  openedByUserId: int("openedByUserId").notNull(),
  reason: varchar("reason", { length: 180 }).notNull(),
  details: text("details").notNull(),
  status: mysqlEnum("status", ["OPEN", "RESPONDED", "INVESTIGATING", "RESOLVED", "CLOSED"]).default("OPEN").notNull(),
  resolution: text("resolution"),
  resolvedBy: int("resolvedBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const auditLogs = mysqlTable("auditLogs", {
  id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
  actorUserId: int("actorUserId"),
  action: varchar("action", { length: 120 }).notNull(),
  targetType: varchar("targetType", { length: 80 }).notNull(),
  targetId: varchar("targetId", { length: 80 }),
  metadata: json("metadata"),
  requestId: varchar("requestId", { length: 100 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [index("audit_target_idx").on(table.targetType, table.targetId), index("audit_actor_idx").on(table.actorUserId, table.createdAt)]);

export const marketplaceSettings = mysqlTable("marketplaceSettings", {
  id: int("id").autoincrement().primaryKey(),
  settingKey: varchar("settingKey", { length: 120 }).notNull().unique(),
  value: json("value").notNull(),
  updatedBy: int("updatedBy"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
