CREATE TABLE `accountSecurityEvents` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`userId` int,
	`authSessionId` bigint,
	`eventType` enum('LOGIN_SUCCEEDED','LOGIN_FAILED','ACCOUNT_LOCKED','SESSION_REVOKED','SESSIONS_REVOKED','PASSWORD_CHANGED','SUSPICIOUS_ACTIVITY','SECURITY_ALERT_SENT') NOT NULL,
	`deviceLabel` varchar(160),
	`ipFingerprint` varchar(64),
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `accountSecurityEvents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `authSessions` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`sessionHash` varchar(64) NOT NULL,
	`deviceLabel` varchar(160) NOT NULL,
	`browserFamily` varchar(80),
	`osFamily` varchar(80),
	`ipFingerprint` varchar(64),
	`status` enum('ACTIVE','REVOKED','EXPIRED') NOT NULL DEFAULT 'ACTIVE',
	`expiresAt` timestamp NOT NULL,
	`lastActiveAt` timestamp NOT NULL DEFAULT (now()),
	`revokedAt` timestamp,
	`revokeReason` varchar(120),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `authSessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `authSessions_sessionHash_unique` UNIQUE(`sessionHash`)
);
--> statement-breakpoint
CREATE INDEX `account_security_events_user_idx` ON `accountSecurityEvents` (`userId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `account_security_events_type_idx` ON `accountSecurityEvents` (`eventType`,`createdAt`);--> statement-breakpoint
CREATE INDEX `auth_sessions_user_status_idx` ON `authSessions` (`userId`,`status`,`lastActiveAt`);--> statement-breakpoint
CREATE INDEX `auth_sessions_expiry_idx` ON `authSessions` (`status`,`expiresAt`);