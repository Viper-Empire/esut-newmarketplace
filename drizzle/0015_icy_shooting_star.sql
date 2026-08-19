ALTER TABLE `listingImages` ADD `mimeType` enum('image/jpeg','image/png','image/webp');--> statement-breakpoint
ALTER TABLE `listingImages` ADD `sizeBytes` int;