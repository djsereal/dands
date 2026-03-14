import { pgTable, text, timestamp, boolean, integer } from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";
import { user } from "./auth-schema.js";

export const couples = pgTable("couples", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  partner1_id: text("partner1_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  partner2_id: text("partner2_id").references(() => user.id, { onDelete: "cascade" }),
  invite_code: text("invite_code").notNull().unique(),
  anniversary_date: text("anniversary_date").notNull(),
  theme_color: text("theme_color").default("#FF6B9D").notNull(),
  theme_font: text("theme_font").default("Nunito").notNull(),
  created_at: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const memories = pgTable("memories", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  couple_id: text("couple_id")
    .notNull()
    .references(() => couples.id, { onDelete: "cascade" }),
  uploaded_by: text("uploaded_by")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  image_url: text("image_url").notNull(),
  prompt: text("prompt").notNull(),
  caption: text("caption"),
  created_at: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const vents = pgTable("vents", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  couple_id: text("couple_id")
    .notNull()
    .references(() => couples.id, { onDelete: "cascade" }),
  author_id: text("author_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  is_private: boolean("is_private").default(false).notNull(),
  created_at: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const moods = pgTable("moods", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  couple_id: text("couple_id")
    .notNull()
    .references(() => couples.id, { onDelete: "cascade" }),
  user_id: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  mood: text("mood", {
    enum: ["happy", "loved", "anxious", "sad", "angry", "grateful", "excited", "tired"],
  }).notNull(),
  note: text("note"),
  logged_at: timestamp("logged_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const todos = pgTable("todos", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  couple_id: text("couple_id")
    .notNull()
    .references(() => couples.id, { onDelete: "cascade" }),
  created_by: text("created_by")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  assigned_to: text("assigned_to").references(() => user.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  is_completed: boolean("is_completed").default(false).notNull(),
  due_date: text("due_date"),
  created_at: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const activities = pgTable("activities", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  couple_id: text("couple_id")
    .notNull()
    .references(() => couples.id, { onDelete: "cascade" }),
  logged_by: text("logged_by")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  activity_date: text("activity_date").notNull(),
  created_at: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const goals = pgTable("goals", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  couple_id: text("couple_id")
    .notNull()
    .references(() => couples.id, { onDelete: "cascade" }),
  created_by: text("created_by")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  target_date: text("target_date"),
  is_completed: boolean("is_completed").default(false).notNull(),
  created_at: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const journal_entries = pgTable("journal_entries", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  couple_id: text("couple_id")
    .notNull()
    .references(() => couples.id, { onDelete: "cascade" }),
  author_id: text("author_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  entry_type: text("entry_type", {
    enum: ["reflection", "gratitude", "hard_time", "good_time"],
  }).notNull(),
  created_at: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const relationship_tips = pgTable("relationship_tips", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  title: text("title").notNull(),
  content: text("content").notNull(),
  source_url: text("source_url"),
  category: text("category", {
    enum: ["communication", "intimacy", "trust", "fun", "growth"],
  }).notNull(),
  created_at: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const intimacy_logs = pgTable("intimacy_logs", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  couple_id: text("couple_id")
    .notNull()
    .references(() => couples.id, { onDelete: "cascade" }),
  logged_by: text("logged_by")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  satisfaction_rating: integer("satisfaction_rating").notNull(),
  note: text("note"),
  logged_at: timestamp("logged_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const fantasies = pgTable("fantasies", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  couple_id: text("couple_id")
    .notNull()
    .references(() => couples.id, { onDelete: "cascade" }),
  shared_by: text("shared_by")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  is_anonymous: boolean("is_anonymous").default(false).notNull(),
  created_at: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});
