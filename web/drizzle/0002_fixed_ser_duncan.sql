CREATE TABLE "subscription" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"lemon_squeezy_id" text NOT NULL,
	"customer_id" text,
	"status" text NOT NULL,
	"plan" text NOT NULL,
	"variant_id" text,
	"customer_portal_url" text,
	"renews_at" timestamp,
	"ends_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "subscription_lemon_squeezy_id_unique" UNIQUE("lemon_squeezy_id")
);
--> statement-breakpoint
ALTER TABLE "subscription" ADD CONSTRAINT "subscription_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;