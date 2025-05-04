-- Database triggers for Netflix API
-- These triggers automate database operations and ensure data integrity

-- 1. Automatic timestamp updates
-- This trigger automatically updates the 'updated_at' timestamp when a record is modified

CREATE OR REPLACE FUNCTION update_modified_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply timestamp trigger to Users table
CREATE TRIGGER update_users_timestamp
BEFORE UPDATE ON public."Users"
FOR EACH ROW
EXECUTE FUNCTION update_modified_timestamp();

-- Apply timestamp trigger to Subscriptions table
CREATE TRIGGER update_subscriptions_timestamp
BEFORE UPDATE ON public."Subscriptions"
FOR EACH ROW
EXECUTE FUNCTION update_modified_timestamp();

-- Apply timestamp trigger to Media table
CREATE TRIGGER update_media_timestamp
BEFORE UPDATE ON public."Media"
FOR EACH ROW
EXECUTE FUNCTION update_modified_timestamp();

-- 2. Audit logging for sensitive operations
-- This trigger logs all changes to the Users table for security and compliance

CREATE TABLE IF NOT EXISTS public."AuditLog" (
    log_id SERIAL PRIMARY KEY,
    table_name VARCHAR(50) NOT NULL,
    record_id INTEGER NOT NULL,
    action VARCHAR(10) NOT NULL,
    changed_by VARCHAR(50), -- Can be populated from application context if available
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    old_data JSONB,
    new_data JSONB
);

CREATE OR REPLACE FUNCTION log_user_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        INSERT INTO public."AuditLog" (table_name, record_id, action, old_data, new_data)
        VALUES ('Users', OLD.user_id, 'UPDATE', row_to_json(OLD)::jsonb, row_to_json(NEW)::jsonb);
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO public."AuditLog" (table_name, record_id, action, old_data)
        VALUES ('Users', OLD.user_id, 'DELETE', row_to_json(OLD)::jsonb);
    ELSIF TG_OP = 'INSERT' THEN
        INSERT INTO public."AuditLog" (table_name, record_id, action, new_data)
        VALUES ('Users', NEW.user_id, 'INSERT', row_to_json(NEW)::jsonb);
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON public."Users"
FOR EACH ROW EXECUTE FUNCTION log_user_changes();

-- 3. Subscription status validation trigger
-- Ensures subscription status transitions are valid

CREATE OR REPLACE FUNCTION validate_subscription_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Prevent changing from 'canceled' or 'expired' back to 'active'
    IF OLD.status IN ('canceled', 'expired') AND NEW.status = 'active' THEN
        RAISE EXCEPTION 'Cannot change subscription status from % to active. Create a new subscription instead.', OLD.status;
    END IF;
    
    -- If status is changing to expired, ensure end_date is set
    IF NEW.status = 'expired' AND NEW.end_date IS NULL THEN
        NEW.end_date := CURRENT_DATE;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER subscription_status_validation
BEFORE UPDATE ON public."Subscriptions"
FOR EACH ROW
EXECUTE FUNCTION validate_subscription_status();

-- 4. Referral discount trigger
-- Automatically applies discount when a user is referred

CREATE OR REPLACE FUNCTION apply_referral_discount()
RETURNS TRIGGER AS $$
BEGIN
    -- If this is a new user with a referral_id
    IF NEW.referral_id IS NOT NULL AND OLD.referral_id IS NULL THEN
        -- Apply discount to the new user
        NEW.has_discount := TRUE;
        
        -- Also update the referring user to have a discount
        UPDATE public."Users"
        SET has_discount = TRUE
        WHERE user_id = NEW.referral_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER apply_referral_discount_trigger
BEFORE UPDATE ON public."Users"
FOR EACH ROW
EXECUTE FUNCTION apply_referral_discount();

-- 5. Age-appropriate content validation trigger
-- Prevents child profiles from accessing adult content

CREATE OR REPLACE FUNCTION validate_watch_history_age_restriction()
RETURNS TRIGGER AS $$
DECLARE
    profile_age INTEGER;
    content_min_age INTEGER;
BEGIN
    -- Get the profile's age
    SELECT age INTO profile_age
    FROM public."Profiles"
    WHERE profile_id = NEW.profile_id;
    
    -- Get the content's minimum age
    SELECT vc.minimum_age INTO content_min_age
    FROM public."Media" m
    JOIN public."ViewingClassification" vc ON m.viewing_classification_id = vc.viewing_classification_id
    WHERE m.media_id = NEW.media_id;
    
    -- Check if the profile's age is less than the content's minimum age
    IF profile_age < content_min_age THEN
        RAISE EXCEPTION 'Age restriction violation: Profile age (%) is less than content minimum age (%)', profile_age, content_min_age;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER watch_history_age_restriction
BEFORE INSERT OR UPDATE ON public."WatchHistory"
FOR EACH ROW
EXECUTE FUNCTION validate_watch_history_age_restriction();

-- 6. Automatic profile count validation
-- Ensures users don't exceed their subscription profile limit

CREATE OR REPLACE FUNCTION validate_profile_count()
RETURNS TRIGGER AS $$
DECLARE
    profile_count INTEGER;
    max_profiles INTEGER;
    subscription_type VARCHAR;
BEGIN
    -- Get current profile count for this user
    SELECT COUNT(*) INTO profile_count
    FROM public."Profiles"
    WHERE user_id = NEW.user_id;
    
    -- Get user's subscription type
    SELECT s.type INTO subscription_type
    FROM public."Subscriptions" s
    WHERE s.user_id = NEW.user_id AND s.status = 'active'
    LIMIT 1;
    
    -- Set max profiles based on subscription type
    CASE subscription_type
        WHEN 'SD' THEN max_profiles := 1;
        WHEN 'HD' THEN max_profiles := 2;
        WHEN 'UHD' THEN max_profiles := 5;
        ELSE max_profiles := 1; -- Default
    END CASE;
    
    -- Check if adding this profile would exceed the limit
    IF profile_count >= max_profiles THEN
        RAISE EXCEPTION 'Profile limit reached: Your % subscription allows a maximum of % profiles', subscription_type, max_profiles;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profile_count_validation
BEFORE INSERT ON public."Profiles"
FOR EACH ROW
EXECUTE FUNCTION validate_profile_count();
