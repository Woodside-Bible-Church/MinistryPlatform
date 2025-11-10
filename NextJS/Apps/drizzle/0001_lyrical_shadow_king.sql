ALTER TABLE "widget_fields" ADD COLUMN "data_source_type" varchar(20);--> statement-breakpoint
ALTER TABLE "widget_fields" ADD COLUMN "data_source_config" jsonb;--> statement-breakpoint
ALTER TABLE "widget_fields" ADD COLUMN "data_param_mapping" varchar(100);