import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const subscriptions = sqliteTable("subscriptions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  ownerContact: text("owner_contact").notNull().default(""),
  totalPriceCents: integer("total_price_cents"),
  shareCents: integer("share_cents").notNull(),
  cycle: text("cycle", { enum: ["monthly", "quarterly", "yearly"] }).notNull(),
  nextDueDate: text("next_due_date").notNull(),
  note: text("note").notNull().default(""),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const payments = sqliteTable("payments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  subscriptionId: integer("subscription_id")
    .notNull()
    .references(() => subscriptions.id, { onDelete: "cascade" }),
  periodDueDate: text("period_due_date").notNull(),
  amountCents: integer("amount_cents").notNull(),
  status: text("status", { enum: ["paid", "unpaid"] })
    .notNull()
    .default("unpaid"),
  paidAt: text("paid_at"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});
