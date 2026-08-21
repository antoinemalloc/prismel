CREATE TABLE `tags` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`color` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tags_name_unique` ON `tags` (`name`);
--> statement-breakpoint
CREATE TABLE `alias_tags` (
	`alias_id` text NOT NULL,
	`tag_id` integer NOT NULL,
	PRIMARY KEY (`alias_id`, `tag_id`),
	FOREIGN KEY (`alias_id`) REFERENCES `aliases`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `alias_tags_tag_id_idx` ON `alias_tags` (`tag_id`);
