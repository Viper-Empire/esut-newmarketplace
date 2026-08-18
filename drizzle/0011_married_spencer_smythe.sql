CREATE TABLE `listingVideoEvidence` (
	`id` int AUTO_INCREMENT NOT NULL,
	`listingId` int NOT NULL,
	`storageKey` varchar(600) NOT NULL,
	`mimeType` enum('video/mp4','video/webm') NOT NULL,
	`sizeBytes` int NOT NULL,
	`status` enum('PENDING','APPROVED','REJECTED') NOT NULL DEFAULT 'PENDING',
	`reviewedBy` int,
	`reviewedAt` timestamp,
	`reviewNote` text,
	`uploadedAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `listingVideoEvidence_id` PRIMARY KEY(`id`),
	CONSTRAINT `listingVideoEvidence_listingId_unique` UNIQUE(`listingId`)
);
--> statement-breakpoint
CREATE INDEX `listing_video_status_idx` ON `listingVideoEvidence` (`status`,`uploadedAt`);