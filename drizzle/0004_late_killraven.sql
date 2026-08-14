ALTER TABLE `profiles` ADD `accountType` enum('INDIVIDUAL','BUSINESS') DEFAULT 'INDIVIDUAL' NOT NULL;--> statement-breakpoint
ALTER TABLE `sellerApplications` ADD `sellerType` enum('INDIVIDUAL','BUSINESS') DEFAULT 'INDIVIDUAL' NOT NULL;--> statement-breakpoint
ALTER TABLE `verificationRequests` ADD `verificationType` enum('INDIVIDUAL_IDENTITY','BUSINESS_ENTITY') DEFAULT 'INDIVIDUAL_IDENTITY' NOT NULL;--> statement-breakpoint
ALTER TABLE `verificationRequests` ADD `businessName` varchar(180);--> statement-breakpoint
ALTER TABLE `verificationRequests` ADD `businessRegistrationNumber` varchar(120);--> statement-breakpoint
ALTER TABLE `verificationRequests` ADD `identityDocumentUrl` text;--> statement-breakpoint
ALTER TABLE `verificationRequests` ADD `businessDocumentUrl` text;