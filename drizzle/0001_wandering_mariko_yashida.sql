CREATE TABLE `auditLogs` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`actorUserId` int,
	`action` varchar(120) NOT NULL,
	`targetType` varchar(80) NOT NULL,
	`targetId` varchar(80),
	`metadata` json,
	`requestId` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `auditLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `cartItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`cartId` int NOT NULL,
	`listingId` int NOT NULL,
	`quantity` int NOT NULL,
	`savedForLater` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cartItems_id` PRIMARY KEY(`id`),
	CONSTRAINT `cart_item_unique_idx` UNIQUE(`cartId`,`listingId`)
);
--> statement-breakpoint
CREATE TABLE `carts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`status` enum('ACTIVE','CONVERTED','ABANDONED') NOT NULL DEFAULT 'ACTIVE',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `carts_id` PRIMARY KEY(`id`),
	CONSTRAINT `carts_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`parentId` int,
	`name` varchar(120) NOT NULL,
	`slug` varchar(140) NOT NULL,
	`description` text,
	`icon` varchar(80),
	`imageUrl` text,
	`isFeatured` boolean NOT NULL DEFAULT false,
	`isActive` boolean NOT NULL DEFAULT true,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `categories_id` PRIMARY KEY(`id`),
	CONSTRAINT `categories_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `conversationParticipants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`conversationId` int NOT NULL,
	`userId` int NOT NULL,
	`lastReadAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `conversationParticipants_id` PRIMARY KEY(`id`),
	CONSTRAINT `conversation_participant_unique_idx` UNIQUE(`conversationId`,`userId`)
);
--> statement-breakpoint
CREATE TABLE `conversations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`listingId` int,
	`orderId` int,
	`offerId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `conversations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `disputes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`openedByUserId` int NOT NULL,
	`reason` varchar(180) NOT NULL,
	`details` text NOT NULL,
	`status` enum('OPEN','RESPONDED','INVESTIGATING','RESOLVED','CLOSED') NOT NULL DEFAULT 'OPEN',
	`resolution` text,
	`resolvedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `disputes_id` PRIMARY KEY(`id`),
	CONSTRAINT `disputes_orderId_unique` UNIQUE(`orderId`)
);
--> statement-breakpoint
CREATE TABLE `favorites` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`listingId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `favorites_id` PRIMARY KEY(`id`),
	CONSTRAINT `favorite_unique_idx` UNIQUE(`userId`,`listingId`)
);
--> statement-breakpoint
CREATE TABLE `inventory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`listingId` int NOT NULL,
	`quantity` int NOT NULL DEFAULT 0,
	`reservedQuantity` int NOT NULL DEFAULT 0,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `inventory_id` PRIMARY KEY(`id`),
	CONSTRAINT `inventory_listingId_unique` UNIQUE(`listingId`)
);
--> statement-breakpoint
CREATE TABLE `listingImages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`listingId` int NOT NULL,
	`storageKey` varchar(600) NOT NULL,
	`url` text NOT NULL,
	`altText` varchar(280),
	`width` int,
	`height` int,
	`sortOrder` int NOT NULL DEFAULT 0,
	`isPrimary` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `listingImages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `listings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`storeId` int NOT NULL,
	`categoryId` int NOT NULL,
	`title` varchar(240) NOT NULL,
	`slug` varchar(280) NOT NULL,
	`description` text NOT NULL,
	`specifications` json,
	`condition` enum('NEW','LIKE_NEW','USED_GOOD','USED_FAIR','REFURBISHED') NOT NULL,
	`priceKobo` int NOT NULL,
	`compareAtPriceKobo` int,
	`location` varchar(180) NOT NULL,
	`fulfillmentDetails` text,
	`status` enum('DRAFT','PENDING_REVIEW','ACTIVE','RESERVED','SOLD','ARCHIVED') NOT NULL DEFAULT 'DRAFT',
	`allowOffers` boolean NOT NULL DEFAULT true,
	`viewCount` int NOT NULL DEFAULT 0,
	`favoriteCount` int NOT NULL DEFAULT 0,
	`publishedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `listings_id` PRIMARY KEY(`id`),
	CONSTRAINT `listings_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `marketplaceSettings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`settingKey` varchar(120) NOT NULL,
	`value` json NOT NULL,
	`updatedBy` int,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `marketplaceSettings_id` PRIMARY KEY(`id`),
	CONSTRAINT `marketplaceSettings_settingKey_unique` UNIQUE(`settingKey`)
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`conversationId` int NOT NULL,
	`senderUserId` int NOT NULL,
	`body` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` varchar(80) NOT NULL,
	`title` varchar(180) NOT NULL,
	`message` text NOT NULL,
	`targetRoute` varchar(400),
	`isRead` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `offers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`listingId` int NOT NULL,
	`buyerUserId` int NOT NULL,
	`storeId` int NOT NULL,
	`amountKobo` int NOT NULL,
	`quantity` int NOT NULL DEFAULT 1,
	`status` enum('PENDING','COUNTERED','ACCEPTED','REJECTED','EXPIRED','CANCELLED') NOT NULL DEFAULT 'PENDING',
	`message` text,
	`expiresAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `offers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `orderItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`listingId` int NOT NULL,
	`titleSnapshot` varchar(240) NOT NULL,
	`imageUrlSnapshot` text,
	`unitPriceKobo` int NOT NULL,
	`quantity` int NOT NULL,
	`subtotalKobo` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `orderItems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `orderStatusHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`oldStatus` enum('PENDING','CONFIRMED','PROCESSING','READY_FOR_PICKUP','COMPLETED','CANCELLED','DISPUTED'),
	`newStatus` enum('PENDING','CONFIRMED','PROCESSING','READY_FOR_PICKUP','COMPLETED','CANCELLED','DISPUTED') NOT NULL,
	`actorUserId` int NOT NULL,
	`note` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `orderStatusHistory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`publicId` varchar(40) NOT NULL,
	`buyerUserId` int NOT NULL,
	`storeId` int NOT NULL,
	`status` enum('PENDING','CONFIRMED','PROCESSING','READY_FOR_PICKUP','COMPLETED','CANCELLED','DISPUTED') NOT NULL DEFAULT 'PENDING',
	`fulfillmentMethod` enum('CAMPUS_PICKUP') NOT NULL DEFAULT 'CAMPUS_PICKUP',
	`pickupNote` text,
	`paymentMethod` enum('CASH_ON_PICKUP') NOT NULL DEFAULT 'CASH_ON_PICKUP',
	`paymentStatus` enum('UNPAID','PENDING','PAID','REFUNDED') NOT NULL DEFAULT 'UNPAID',
	`subtotalKobo` int NOT NULL,
	`feesKobo` int NOT NULL DEFAULT 0,
	`totalKobo` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `orders_id` PRIMARY KEY(`id`),
	CONSTRAINT `orders_publicId_unique` UNIQUE(`publicId`)
);
--> statement-breakpoint
CREATE TABLE `profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`phone` varchar(32),
	`location` varchar(180),
	`avatarUrl` text,
	`bio` text,
	`verificationStatus` enum('UNVERIFIED','PENDING','APPROVED','REJECTED') NOT NULL DEFAULT 'UNVERIFIED',
	`verifiedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `profiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `profiles_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`reporterUserId` int NOT NULL,
	`targetType` enum('LISTING','STORE','USER','MESSAGE','REVIEW') NOT NULL,
	`targetId` int NOT NULL,
	`reason` varchar(180) NOT NULL,
	`details` text,
	`status` enum('OPEN','INVESTIGATING','RESOLVED','DISMISSED') NOT NULL DEFAULT 'OPEN',
	`resolvedBy` int,
	`resolutionNote` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `reports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reviews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`listingId` int NOT NULL,
	`storeId` int NOT NULL,
	`buyerUserId` int NOT NULL,
	`rating` int NOT NULL,
	`comment` text,
	`sellerResponse` text,
	`status` enum('PUBLISHED','REPORTED','REMOVED') NOT NULL DEFAULT 'PUBLISHED',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `reviews_id` PRIMARY KEY(`id`),
	CONSTRAINT `review_order_listing_unique_idx` UNIQUE(`orderId`,`listingId`)
);
--> statement-breakpoint
CREATE TABLE `sellerApplications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`proposedStoreName` varchar(160) NOT NULL,
	`description` text NOT NULL,
	`phone` varchar(32) NOT NULL,
	`location` varchar(180) NOT NULL,
	`status` enum('PENDING','APPROVED','REJECTED') NOT NULL DEFAULT 'PENDING',
	`reviewedBy` int,
	`reviewNote` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `sellerApplications_id` PRIMARY KEY(`id`),
	CONSTRAINT `sellerApplications_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `stores` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerUserId` int NOT NULL,
	`name` varchar(160) NOT NULL,
	`slug` varchar(180) NOT NULL,
	`description` text,
	`logoUrl` text,
	`bannerUrl` text,
	`location` varchar(180) NOT NULL,
	`contactPhone` varchar(32),
	`socialLinks` json,
	`status` enum('PENDING','ACTIVE','SUSPENDED','CLOSED') NOT NULL DEFAULT 'PENDING',
	`isVerified` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `stores_id` PRIMARY KEY(`id`),
	CONSTRAINT `stores_ownerUserId_unique` UNIQUE(`ownerUserId`),
	CONSTRAINT `stores_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `verificationRequests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`esutEmail` varchar(320),
	`registrationNumber` varchar(80),
	`documentUrl` text,
	`status` enum('PENDING','APPROVED','REJECTED') NOT NULL DEFAULT 'PENDING',
	`reviewedBy` int,
	`reviewNote` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `verificationRequests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('CUSTOMER','SELLER','MODERATOR','ADMIN','SUPER_ADMIN') NOT NULL DEFAULT 'CUSTOMER';--> statement-breakpoint
ALTER TABLE `users` ADD `isActive` boolean DEFAULT true NOT NULL;--> statement-breakpoint
CREATE INDEX `audit_target_idx` ON `auditLogs` (`targetType`,`targetId`);--> statement-breakpoint
CREATE INDEX `audit_actor_idx` ON `auditLogs` (`actorUserId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `cart_items_cart_idx` ON `cartItems` (`cartId`);--> statement-breakpoint
CREATE INDEX `conversation_user_idx` ON `conversationParticipants` (`userId`);--> statement-breakpoint
CREATE INDEX `favorites_listing_idx` ON `favorites` (`listingId`);--> statement-breakpoint
CREATE INDEX `listing_images_idx` ON `listingImages` (`listingId`,`sortOrder`);--> statement-breakpoint
CREATE INDEX `listings_catalog_idx` ON `listings` (`status`,`categoryId`);--> statement-breakpoint
CREATE INDEX `listings_store_idx` ON `listings` (`storeId`);--> statement-breakpoint
CREATE INDEX `listings_price_idx` ON `listings` (`priceKobo`);--> statement-breakpoint
CREATE INDEX `messages_conversation_idx` ON `messages` (`conversationId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `notifications_user_idx` ON `notifications` (`userId`,`isRead`,`createdAt`);--> statement-breakpoint
CREATE INDEX `offers_buyer_idx` ON `offers` (`buyerUserId`,`status`);--> statement-breakpoint
CREATE INDEX `offers_store_idx` ON `offers` (`storeId`,`status`);--> statement-breakpoint
CREATE INDEX `order_items_order_idx` ON `orderItems` (`orderId`);--> statement-breakpoint
CREATE INDEX `orders_buyer_idx` ON `orders` (`buyerUserId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `orders_store_idx` ON `orders` (`storeId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `reviews_store_idx` ON `reviews` (`storeId`,`status`);--> statement-breakpoint
CREATE INDEX `stores_status_idx` ON `stores` (`status`);--> statement-breakpoint
CREATE INDEX `verification_user_idx` ON `verificationRequests` (`userId`);--> statement-breakpoint
CREATE INDEX `verification_status_idx` ON `verificationRequests` (`status`);
--> statement-breakpoint
ALTER TABLE `profiles` ADD CONSTRAINT `profiles_user_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`);--> statement-breakpoint
ALTER TABLE `sellerApplications` ADD CONSTRAINT `seller_app_user_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`);--> statement-breakpoint
ALTER TABLE `sellerApplications` ADD CONSTRAINT `seller_app_reviewer_fk` FOREIGN KEY (`reviewedBy`) REFERENCES `users`(`id`);--> statement-breakpoint
ALTER TABLE `stores` ADD CONSTRAINT `stores_owner_fk` FOREIGN KEY (`ownerUserId`) REFERENCES `users`(`id`);--> statement-breakpoint
ALTER TABLE `verificationRequests` ADD CONSTRAINT `verification_user_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`);--> statement-breakpoint
ALTER TABLE `verificationRequests` ADD CONSTRAINT `verification_reviewer_fk` FOREIGN KEY (`reviewedBy`) REFERENCES `users`(`id`);--> statement-breakpoint
ALTER TABLE `categories` ADD CONSTRAINT `categories_parent_fk` FOREIGN KEY (`parentId`) REFERENCES `categories`(`id`);--> statement-breakpoint
ALTER TABLE `listings` ADD CONSTRAINT `listings_store_fk` FOREIGN KEY (`storeId`) REFERENCES `stores`(`id`);--> statement-breakpoint
ALTER TABLE `listings` ADD CONSTRAINT `listings_category_fk` FOREIGN KEY (`categoryId`) REFERENCES `categories`(`id`);--> statement-breakpoint
ALTER TABLE `listingImages` ADD CONSTRAINT `listing_images_listing_fk` FOREIGN KEY (`listingId`) REFERENCES `listings`(`id`) ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE `inventory` ADD CONSTRAINT `inventory_listing_fk` FOREIGN KEY (`listingId`) REFERENCES `listings`(`id`) ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE `favorites` ADD CONSTRAINT `favorites_user_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`);--> statement-breakpoint
ALTER TABLE `favorites` ADD CONSTRAINT `favorites_listing_fk` FOREIGN KEY (`listingId`) REFERENCES `listings`(`id`);--> statement-breakpoint
ALTER TABLE `carts` ADD CONSTRAINT `carts_user_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`);--> statement-breakpoint
ALTER TABLE `cartItems` ADD CONSTRAINT `cart_items_cart_fk` FOREIGN KEY (`cartId`) REFERENCES `carts`(`id`) ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE `cartItems` ADD CONSTRAINT `cart_items_listing_fk` FOREIGN KEY (`listingId`) REFERENCES `listings`(`id`);--> statement-breakpoint
ALTER TABLE `orders` ADD CONSTRAINT `orders_buyer_fk` FOREIGN KEY (`buyerUserId`) REFERENCES `users`(`id`);--> statement-breakpoint
ALTER TABLE `orders` ADD CONSTRAINT `orders_store_fk` FOREIGN KEY (`storeId`) REFERENCES `stores`(`id`);--> statement-breakpoint
ALTER TABLE `orderItems` ADD CONSTRAINT `order_items_order_fk` FOREIGN KEY (`orderId`) REFERENCES `orders`(`id`) ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE `orderItems` ADD CONSTRAINT `order_items_listing_fk` FOREIGN KEY (`listingId`) REFERENCES `listings`(`id`);--> statement-breakpoint
ALTER TABLE `orderStatusHistory` ADD CONSTRAINT `order_history_order_fk` FOREIGN KEY (`orderId`) REFERENCES `orders`(`id`) ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE `orderStatusHistory` ADD CONSTRAINT `order_history_actor_fk` FOREIGN KEY (`actorUserId`) REFERENCES `users`(`id`);--> statement-breakpoint
ALTER TABLE `offers` ADD CONSTRAINT `offers_listing_fk` FOREIGN KEY (`listingId`) REFERENCES `listings`(`id`);--> statement-breakpoint
ALTER TABLE `offers` ADD CONSTRAINT `offers_buyer_fk` FOREIGN KEY (`buyerUserId`) REFERENCES `users`(`id`);--> statement-breakpoint
ALTER TABLE `offers` ADD CONSTRAINT `offers_store_fk` FOREIGN KEY (`storeId`) REFERENCES `stores`(`id`);--> statement-breakpoint
ALTER TABLE `conversations` ADD CONSTRAINT `conversations_listing_fk` FOREIGN KEY (`listingId`) REFERENCES `listings`(`id`);--> statement-breakpoint
ALTER TABLE `conversations` ADD CONSTRAINT `conversations_order_fk` FOREIGN KEY (`orderId`) REFERENCES `orders`(`id`);--> statement-breakpoint
ALTER TABLE `conversations` ADD CONSTRAINT `conversations_offer_fk` FOREIGN KEY (`offerId`) REFERENCES `offers`(`id`);--> statement-breakpoint
ALTER TABLE `conversationParticipants` ADD CONSTRAINT `conversation_participants_conversation_fk` FOREIGN KEY (`conversationId`) REFERENCES `conversations`(`id`) ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE `conversationParticipants` ADD CONSTRAINT `conversation_participants_user_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`);--> statement-breakpoint
ALTER TABLE `messages` ADD CONSTRAINT `messages_conversation_fk` FOREIGN KEY (`conversationId`) REFERENCES `conversations`(`id`) ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE `messages` ADD CONSTRAINT `messages_sender_fk` FOREIGN KEY (`senderUserId`) REFERENCES `users`(`id`);--> statement-breakpoint
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_user_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE `reviews` ADD CONSTRAINT `reviews_order_fk` FOREIGN KEY (`orderId`) REFERENCES `orders`(`id`);--> statement-breakpoint
ALTER TABLE `reviews` ADD CONSTRAINT `reviews_listing_fk` FOREIGN KEY (`listingId`) REFERENCES `listings`(`id`);--> statement-breakpoint
ALTER TABLE `reviews` ADD CONSTRAINT `reviews_store_fk` FOREIGN KEY (`storeId`) REFERENCES `stores`(`id`);--> statement-breakpoint
ALTER TABLE `reviews` ADD CONSTRAINT `reviews_buyer_fk` FOREIGN KEY (`buyerUserId`) REFERENCES `users`(`id`);--> statement-breakpoint
ALTER TABLE `reports` ADD CONSTRAINT `reports_reporter_fk` FOREIGN KEY (`reporterUserId`) REFERENCES `users`(`id`);--> statement-breakpoint
ALTER TABLE `reports` ADD CONSTRAINT `reports_resolver_fk` FOREIGN KEY (`resolvedBy`) REFERENCES `users`(`id`);--> statement-breakpoint
ALTER TABLE `disputes` ADD CONSTRAINT `disputes_order_fk` FOREIGN KEY (`orderId`) REFERENCES `orders`(`id`);--> statement-breakpoint
ALTER TABLE `disputes` ADD CONSTRAINT `disputes_opener_fk` FOREIGN KEY (`openedByUserId`) REFERENCES `users`(`id`);--> statement-breakpoint
ALTER TABLE `disputes` ADD CONSTRAINT `disputes_resolver_fk` FOREIGN KEY (`resolvedBy`) REFERENCES `users`(`id`);--> statement-breakpoint
ALTER TABLE `auditLogs` ADD CONSTRAINT `audit_actor_fk` FOREIGN KEY (`actorUserId`) REFERENCES `users`(`id`);--> statement-breakpoint
ALTER TABLE `marketplaceSettings` ADD CONSTRAINT `settings_updater_fk` FOREIGN KEY (`updatedBy`) REFERENCES `users`(`id`);
