CREATE TABLE `conversationTypingStates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`conversationId` int NOT NULL,
	`userId` int NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `conversationTypingStates_id` PRIMARY KEY(`id`),
	CONSTRAINT `conversation_typing_user_idx` UNIQUE(`conversationId`,`userId`)
);
--> statement-breakpoint
CREATE INDEX `conversation_typing_expiry_idx` ON `conversationTypingStates` (`conversationId`,`expiresAt`);