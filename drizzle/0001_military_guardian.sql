PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_subscriptions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`owner_contact` text DEFAULT '' NOT NULL,
	`total_price_cents` integer,
	`share_cents` integer NOT NULL,
	`cycle` text NOT NULL,
	`next_due_date` text NOT NULL,
	`note` text DEFAULT '' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_subscriptions`("id", "name", "owner_contact", "total_price_cents", "share_cents", "cycle", "next_due_date", "note", "created_at") SELECT "id", "name", "owner_contact", "total_price_cents", "share_cents", "cycle", "next_due_date", "note", "created_at" FROM `subscriptions`;--> statement-breakpoint
DROP TABLE `subscriptions`;--> statement-breakpoint
ALTER TABLE `__new_subscriptions` RENAME TO `subscriptions`;--> statement-breakpoint
PRAGMA foreign_keys=ON;