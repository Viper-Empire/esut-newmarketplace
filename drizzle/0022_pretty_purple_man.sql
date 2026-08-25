CREATE TABLE `mediaAssets` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`ownerUserId` int,
	`entityType` enum('LISTING','PROFILE','STORE','BRAND') NOT NULL,
	`entityId` varchar(80) NOT NULL,
	`purpose` enum('PRODUCT_IMAGE','AVATAR','STORE_ARTWORK','BRAND_ARTWORK') NOT NULL,
	`provider` enum('CLOUDINARY','MANUS_S3') NOT NULL,
	`storageZone` enum('PUBLIC','PRIVATE') NOT NULL,
	`storageKey` varchar(600) NOT NULL,
	`publicId` varchar(512),
	`url` text,
	`originalUrl` text,
	`mimeType` enum('image/jpeg','image/png','image/webp'),
	`sizeBytes` int,
	`width` int,
	`height` int,
	`transformationProfile` varchar(80),
	`status` enum('PENDING','APPROVED','REJECTED','ARCHIVED','DELETED') NOT NULL DEFAULT 'PENDING',
	`approvedAt` timestamp,
	`archivedAt` timestamp,
	`deletedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `mediaAssets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `media_assets_entity_idx` ON `mediaAssets` (`entityType`,`entityId`,`purpose`);--> statement-breakpoint
CREATE INDEX `media_assets_owner_status_idx` ON `mediaAssets` (`ownerUserId`,`status`);--> statement-breakpoint
CREATE INDEX `media_assets_provider_key_idx` ON `mediaAssets` (`provider`,`storageKey`);