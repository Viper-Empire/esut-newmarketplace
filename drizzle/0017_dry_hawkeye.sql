CREATE TABLE `caseActivity` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`disputeId` int,
	`reportId` int,
	`actorUserId` int,
	`action` varchar(100) NOT NULL,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `caseActivity_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `caseEvidence` (
	`id` int AUTO_INCREMENT NOT NULL,
	`disputeId` int,
	`reportId` int,
	`submittedByUserId` int NOT NULL,
	`storageKey` varchar(600) NOT NULL,
	`mimeType` enum('image/jpeg','image/png','image/webp','video/mp4','video/webm') NOT NULL,
	`sizeBytes` int NOT NULL,
	`width` int,
	`height` int,
	`visibility` enum('CASE_PARTICIPANTS','MODERATION_ONLY') NOT NULL DEFAULT 'MODERATION_ONLY',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `caseEvidence_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `marketplaceEvents` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`eventType` varchar(80) NOT NULL,
	`aggregateKey` varchar(160) NOT NULL,
	`targetRoute` varchar(400),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `marketplaceEvents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reviewMedia` (
	`id` int AUTO_INCREMENT NOT NULL,
	`reviewId` int NOT NULL,
	`uploaderUserId` int NOT NULL,
	`storageKey` varchar(600) NOT NULL,
	`mimeType` enum('image/jpeg','image/png','image/webp') NOT NULL,
	`sizeBytes` int NOT NULL,
	`width` int,
	`height` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `reviewMedia_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `profiles` ADD `avatarStorageKey` varchar(600);--> statement-breakpoint
ALTER TABLE `profiles` ADD `avatarMimeType` enum('image/jpeg','image/png','image/webp');--> statement-breakpoint
ALTER TABLE `profiles` ADD `avatarSizeBytes` int;--> statement-breakpoint
ALTER TABLE `profiles` ADD `isAvatarPublic` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `stores` ADD `storefrontConfig` json;--> statement-breakpoint
CREATE INDEX `case_activity_dispute_idx` ON `caseActivity` (`disputeId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `case_activity_report_idx` ON `caseActivity` (`reportId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `case_evidence_dispute_idx` ON `caseEvidence` (`disputeId`);--> statement-breakpoint
CREATE INDEX `case_evidence_report_idx` ON `caseEvidence` (`reportId`);--> statement-breakpoint
CREATE INDEX `case_evidence_submitter_idx` ON `caseEvidence` (`submittedByUserId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `marketplace_events_user_idx` ON `marketplaceEvents` (`userId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `marketplace_events_aggregate_idx` ON `marketplaceEvents` (`userId`,`aggregateKey`,`createdAt`);--> statement-breakpoint
CREATE INDEX `review_media_review_idx` ON `reviewMedia` (`reviewId`);