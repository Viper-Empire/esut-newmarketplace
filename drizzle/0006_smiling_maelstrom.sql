ALTER TABLE `orders` ADD `pickupCodeCiphertext` text;--> statement-breakpoint
ALTER TABLE `orders` ADD `pickupCodeIssuedAt` timestamp;--> statement-breakpoint
ALTER TABLE `orders` ADD `pickupCodeVerifiedAt` timestamp;--> statement-breakpoint
ALTER TABLE `orders` ADD `pickupCodeFailedAttempts` int DEFAULT 0 NOT NULL;