ALTER TABLE `searchAlerts` ADD `notifyInApp` boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `searchAlerts` ADD `notifyEmail` boolean DEFAULT false NOT NULL;