ALTER TYPE "public"."status" ADD VALUE 'processing' BEFORE 'complete';--> statement-breakpoint
ALTER TYPE "public"."status" ADD VALUE 'failed' BEFORE 'complete';--> statement-breakpoint
ALTER TABLE "sample" ADD COLUMN "analysis_version" integer;--> statement-breakpoint
ALTER TABLE "sample" ADD COLUMN "analysed_at" timestamp;