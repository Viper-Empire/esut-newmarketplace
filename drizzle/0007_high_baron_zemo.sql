CREATE TABLE `pickupCoordinations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`status` enum('NOT_STARTED','SELLER_INSTRUCTIONS_SET','BUYER_ACKNOWLEDGED','MEETING_AGREED','BUYER_NO_SHOW','SELLER_NO_SHOW','CODE_LOCKED','ESCALATED','CLOSED') NOT NULL DEFAULT 'NOT_STARTED',
	`pickupLocation` varchar(240),
	`pickupInstructions` text,
	`proposedWindowStart` timestamp,
	`proposedWindowEnd` timestamp,
	`buyerAcknowledgedAt` timestamp,
	`sellerInstructionsUpdatedAt` timestamp,
	`lastContactAt` timestamp,
	`exceptionReason` varchar(80),
	`closedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pickupCoordinations_id` PRIMARY KEY(`id`),
	CONSTRAINT `pickupCoordinations_orderId_unique` UNIQUE(`orderId`)
);
--> statement-breakpoint
CREATE INDEX `pickup_coordination_status_idx` ON `pickupCoordinations` (`status`,`updatedAt`);