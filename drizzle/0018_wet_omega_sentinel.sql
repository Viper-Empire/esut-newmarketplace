CREATE TABLE `operationalEvents` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`eventType` enum('CLIENT_ERROR','API_ERROR','ASSET_FAILURE','UPLOAD_FAILURE','WEB_VITAL') NOT NULL,
	`severity` enum('INFO','WARNING','ERROR') NOT NULL DEFAULT 'INFO',
	`route` varchar(180) NOT NULL,
	`metricName` varchar(80),
	`metricValue` int,
	`statusCode` int,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `operationalEvents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `operational_events_type_idx` ON `operationalEvents` (`eventType`,`createdAt`);--> statement-breakpoint
CREATE INDEX `operational_events_severity_idx` ON `operationalEvents` (`severity`,`createdAt`);