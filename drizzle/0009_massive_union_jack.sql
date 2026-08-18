CREATE TABLE `sellerApplicationAttempts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sellerApplicationId` int NOT NULL,
	`applicantUserId` int NOT NULL,
	`attemptNumber` int NOT NULL,
	`sellerType` enum('INDIVIDUAL','BUSINESS') NOT NULL,
	`proposedStoreName` varchar(160) NOT NULL,
	`description` text NOT NULL,
	`phone` varchar(32) NOT NULL,
	`location` varchar(180) NOT NULL,
	`status` enum('PENDING','APPROVED','REJECTED') NOT NULL DEFAULT 'PENDING',
	`reviewerUserId` int,
	`reviewNote` text,
	`submittedAt` timestamp NOT NULL DEFAULT (now()),
	`reviewedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sellerApplicationAttempts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sellerVerificationAttempts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`verificationRequestId` int NOT NULL,
	`applicantUserId` int NOT NULL,
	`attemptNumber` int NOT NULL,
	`verificationType` enum('INDIVIDUAL_IDENTITY','BUSINESS_ENTITY') NOT NULL,
	`status` enum('PENDING','APPROVED','REJECTED') NOT NULL DEFAULT 'PENDING',
	`reviewerUserId` int,
	`reviewNote` text,
	`submittedAt` timestamp NOT NULL DEFAULT (now()),
	`reviewedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sellerVerificationAttempts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `seller_application_attempt_applicant_idx` ON `sellerApplicationAttempts` (`applicantUserId`,`submittedAt`);--> statement-breakpoint
CREATE INDEX `seller_application_attempt_request_idx` ON `sellerApplicationAttempts` (`sellerApplicationId`,`attemptNumber`);--> statement-breakpoint
CREATE INDEX `seller_verification_attempt_applicant_idx` ON `sellerVerificationAttempts` (`applicantUserId`,`submittedAt`);--> statement-breakpoint
CREATE INDEX `seller_verification_attempt_request_idx` ON `sellerVerificationAttempts` (`verificationRequestId`,`attemptNumber`);