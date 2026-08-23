CREATE TABLE `searchAlerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`query` varchar(120) NOT NULL,
	`categorySlug` varchar(180),
	`minKobo` int,
	`maxKobo` int,
	`condition` varchar(24),
	`verified` boolean NOT NULL DEFAULT false,
	`status` enum('ACTIVE','CANCELLED') NOT NULL DEFAULT 'ACTIVE',
	`lastNotifiedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `searchAlerts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `search_alerts_user_status_idx` ON `searchAlerts` (`userId`,`status`,`createdAt`);--> statement-breakpoint
CREATE INDEX `search_alerts_active_idx` ON `searchAlerts` (`status`,`createdAt`);