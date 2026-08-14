CREATE TABLE `inventoryReservations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`listingId` int NOT NULL,
	`quantity` int NOT NULL,
	`status` enum('ACTIVE','COMMITTED','RELEASED','EXPIRED') NOT NULL DEFAULT 'ACTIVE',
	`expiresAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `inventoryReservations_id` PRIMARY KEY(`id`),
	CONSTRAINT `inventory_reservation_order_listing_unique_idx` UNIQUE(`orderId`,`listingId`)
);
--> statement-breakpoint
CREATE TABLE `orderBatches` (
	`id` int AUTO_INCREMENT NOT NULL,
	`publicId` varchar(40) NOT NULL,
	`buyerUserId` int NOT NULL,
	`idempotencyKey` varchar(80) NOT NULL,
	`status` enum('ACTIVE','COMPLETED','CANCELLED') NOT NULL DEFAULT 'ACTIVE',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `orderBatches_id` PRIMARY KEY(`id`),
	CONSTRAINT `orderBatches_publicId_unique` UNIQUE(`publicId`),
	CONSTRAINT `order_batch_buyer_key_unique_idx` UNIQUE(`buyerUserId`,`idempotencyKey`)
);
--> statement-breakpoint
ALTER TABLE `orders` ADD `orderBatchId` int;--> statement-breakpoint
ALTER TABLE `orders` ADD `reservationExpiresAt` timestamp;--> statement-breakpoint
CREATE INDEX `inventory_reservation_order_idx` ON `inventoryReservations` (`orderId`);--> statement-breakpoint
CREATE INDEX `inventory_reservation_expiry_idx` ON `inventoryReservations` (`status`,`expiresAt`);--> statement-breakpoint
CREATE INDEX `order_batch_buyer_idx` ON `orderBatches` (`buyerUserId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `orders_batch_idx` ON `orders` (`orderBatchId`);