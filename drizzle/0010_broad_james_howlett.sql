CREATE TABLE `adminReversibleActions` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`actionType` enum('USER_ACTIVE','STORE_STATUS','LISTING_STATUS','REPORT_STATUS','REVIEW_STATUS') NOT NULL,
	`targetType` varchar(80) NOT NULL,
	`targetId` varchar(80) NOT NULL,
	`actorUserId` int NOT NULL,
	`beforeState` json NOT NULL,
	`afterState` json NOT NULL,
	`status` enum('ACTIVE','UNDONE','REDONE','SUPERSEDED') NOT NULL DEFAULT 'ACTIVE',
	`revision` int NOT NULL DEFAULT 0,
	`undoneByUserId` int,
	`undoneAt` timestamp,
	`redoByUserId` int,
	`redoneAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `adminReversibleActions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `admin_reversible_target_idx` ON `adminReversibleActions` (`targetType`,`targetId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `admin_reversible_status_idx` ON `adminReversibleActions` (`status`,`createdAt`);--> statement-breakpoint
CREATE INDEX `admin_reversible_actor_idx` ON `adminReversibleActions` (`actorUserId`,`createdAt`);