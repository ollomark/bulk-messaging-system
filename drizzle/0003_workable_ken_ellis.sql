CREATE TABLE `creditTransfers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`fromUserId` int NOT NULL,
	`toUserId` int NOT NULL,
	`smsAmount` int NOT NULL DEFAULT 0,
	`emailAmount` int NOT NULL DEFAULT 0,
	`note` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `creditTransfers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `numberImports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`groupId` int NOT NULL,
	`fileName` varchar(255) NOT NULL,
	`totalNumbers` int NOT NULL DEFAULT 0,
	`duplicatesRemoved` int NOT NULL DEFAULT 0,
	`successfulImports` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `numberImports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','admin','master','dealer') NOT NULL DEFAULT 'user';--> statement-breakpoint
ALTER TABLE `users` ADD `parentId` int;