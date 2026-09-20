ALTER TABLE "sample" ADD COLUMN "last_played_at" timestamp;--> statement-breakpoint
ALTER TABLE "sample" ADD COLUMN "play_count" integer DEFAULT 0 NOT NULL;