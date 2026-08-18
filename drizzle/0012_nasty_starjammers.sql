CREATE TABLE `productReminders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`listingId` int NOT NULL,
	`storeId` int,
	`reminderType` enum('TOMORROW','THREE_DAYS','ONE_WEEK','CUSTOM') NOT NULL,
	`scheduledFor` timestamp NOT NULL,
	`note` varchar(500),
	`status` enum('ACTIVE','TRIGGERED','CANCELLED','UNAVAILABLE') NOT NULL DEFAULT 'ACTIVE',
	`notificationSentAt` timestamp,
	`triggeredAt` timestamp,
	`cancelledAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `productReminders_id` PRIMARY KEY(`id`),
	CONSTRAINT `product_reminder_user_listing_unique_idx` UNIQUE(`userId`,`listingId`)
);
--> statement-breakpoint
ALTER TABLE `reviews` ADD `title` varchar(180);--> statement-breakpoint
CREATE INDEX `product_reminder_user_status_schedule_idx` ON `productReminders` (`userId`,`status`,`scheduledFor`);--> statement-breakpoint
CREATE INDEX `product_reminder_due_idx` ON `productReminders` (`status`,`scheduledFor`);--> statement-breakpoint
CREATE INDEX `product_reminder_listing_idx` ON `productReminders` (`listingId`);