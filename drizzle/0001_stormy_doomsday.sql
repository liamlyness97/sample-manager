CREATE TYPE "public"."status" AS ENUM('pending', 'complete');--> statement-breakpoint
ALTER TABLE "sample" ADD COLUMN "sampleBpm" integer;--> statement-breakpoint
ALTER TABLE "sample" ADD COLUMN "duration" integer;--> statement-breakpoint
ALTER TABLE "sample" ADD COLUMN "sampleRate" integer;--> statement-breakpoint
ALTER TABLE "sample" ADD COLUMN "status" "status" DEFAULT 'pending' NOT NULL;