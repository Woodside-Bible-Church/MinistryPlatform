CREATE TABLE "app_permissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"application_id" integer NOT NULL,
	"user_email" varchar(255),
	"role_id" integer,
	"can_view" boolean DEFAULT true,
	"can_edit" boolean DEFAULT false,
	"can_delete" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "applications" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"key" varchar(50) NOT NULL,
	"description" text,
	"route" varchar(255) NOT NULL,
	"icon" varchar(50),
	"sort_order" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"requires_auth" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "applications_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "widget_fields" (
	"id" serial PRIMARY KEY NOT NULL,
	"widget_id" integer NOT NULL,
	"field_key" varchar(50) NOT NULL,
	"label" varchar(100) NOT NULL,
	"field_type" varchar(20) NOT NULL,
	"placeholder" varchar(255),
	"help_text" text,
	"default_value" text,
	"options" jsonb,
	"is_required" boolean DEFAULT false,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "widgets" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"key" varchar(50) NOT NULL,
	"description" text,
	"script_url" varchar(500) NOT NULL,
	"container_element_id" varchar(100) NOT NULL,
	"global_name" varchar(100),
	"preview_url" varchar(500),
	"is_active" boolean DEFAULT true,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "widgets_key_unique" UNIQUE("key")
);
--> statement-breakpoint
ALTER TABLE "app_permissions" ADD CONSTRAINT "app_permissions_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "widget_fields" ADD CONSTRAINT "widget_fields_widget_id_widgets_id_fk" FOREIGN KEY ("widget_id") REFERENCES "public"."widgets"("id") ON DELETE cascade ON UPDATE no action;