ALTER TABLE "Lead"
    ALTER COLUMN "email" SET NOT NULL,
    ALTER COLUMN "source" SET NOT NULL,
    ADD CONSTRAINT "Lead_name_nonempty_check"
        CHECK (length(btrim("name")) > 0),
    ADD CONSTRAINT "Lead_email_normalized_check"
        CHECK (length(btrim("email")) > 0 AND "email" = lower(btrim("email"))),
    ADD CONSTRAINT "Lead_source_allowed_check"
        CHECK ("source" IN ('WEBSITE', 'REFERRAL', 'LINKEDIN', 'FIVERR', 'UPWORK', 'SOCIAL_MEDIA', 'COLD_OUTREACH', 'OTHER')),
    ADD CONSTRAINT "Lead_currency_allowed_check"
        CHECK ("currency" IN ('USD', 'EUR', 'GBP', 'CAD', 'AUD')),
    ADD CONSTRAINT "Lead_estimatedValue_nonnegative_check"
        CHECK ("estimatedValue" IS NULL OR "estimatedValue" >= 0);

ALTER TABLE "Client"
    ALTER COLUMN "updatedAt" DROP DEFAULT;
