CREATE TABLE `authRateLimits` (
	`id` int AUTO_INCREMENT NOT NULL,
	`rateKey` varchar(80) NOT NULL,
	`attempts` int NOT NULL DEFAULT 0,
	`windowStartedAt` timestamp NOT NULL DEFAULT (now()),
	`blockedUntil` timestamp,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `authRateLimits_id` PRIMARY KEY(`id`),
	CONSTRAINT `authRateLimits_rateKey_unique` UNIQUE(`rateKey`)
);
