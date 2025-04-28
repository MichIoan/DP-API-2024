-- Additional stored procedures with transaction support

-- Procedure to update user subscription with transaction support
CREATE OR REPLACE PROCEDURE public."UpdateUserSubscription"(
    IN p_user_id INTEGER,
    IN p_subscription_type VARCHAR,
    IN p_price NUMERIC(10,2)
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_old_subscription_id INTEGER;
BEGIN
    -- Start transaction
    BEGIN
        -- Check if user exists
        IF NOT EXISTS (SELECT 1 FROM public."Users" WHERE user_id = p_user_id) THEN
            RAISE EXCEPTION 'User with ID % does not exist', p_user_id;
        END IF;
        
        -- Find existing active subscription
        SELECT subscription_id INTO v_old_subscription_id
        FROM public."Subscriptions"
        WHERE user_id = p_user_id AND status = 'active';
        
        -- If there's an active subscription, mark it as canceled
        IF v_old_subscription_id IS NOT NULL THEN
            UPDATE public."Subscriptions"
            SET status = 'canceled', end_date = CURRENT_DATE
            WHERE subscription_id = v_old_subscription_id;
        END IF;
        
        -- Create new subscription
        INSERT INTO public."Subscriptions" (
            user_id,
            type,
            status,
            start_date,
            end_date,
            price,
            description
        )
        VALUES (
            p_user_id,
            p_subscription_type,
            'active',
            CURRENT_DATE,
            (CURRENT_DATE + INTERVAL '1 month'),
            p_price,
            'Subscription ' || p_subscription_type
        );
        
        -- Commit transaction
        COMMIT;
        
        RAISE NOTICE 'Subscription updated successfully for user ID %', p_user_id;
    EXCEPTION
        WHEN OTHERS THEN
            -- Rollback transaction on error
            ROLLBACK;
            RAISE;
    END;
END;
$$;

-- Procedure to create a user profile with preferences
CREATE OR REPLACE PROCEDURE public."CreateProfileWithPreferences"(
    IN p_user_id INTEGER,
    IN p_name VARCHAR,
    IN p_age INTEGER,
    IN p_photo_path VARCHAR,
    IN p_child_profile BOOLEAN,
    IN p_language VARCHAR,
    IN p_viewing_classifications INTEGER[],
    OUT v_profile_id INTEGER
)
LANGUAGE plpgsql
AS $$
BEGIN
    -- Start transaction
    BEGIN
        -- Call existing CreateProfile procedure
        CALL public."CreateProfile"(
            p_user_id,
            p_name,
            p_age,
            p_photo_path,
            p_child_profile,
            v_profile_id
        );
        
        -- Update language preference
        UPDATE public."Profiles"
        SET language = p_language
        WHERE profile_id = v_profile_id;
        
        -- Add viewing classifications if provided
        IF p_viewing_classifications IS NOT NULL AND array_length(p_viewing_classifications, 1) > 0 THEN
            FOR i IN 1..array_length(p_viewing_classifications, 1) LOOP
                INSERT INTO public."ProfileVClassification_Junction" (
                    profile_id,
                    viewing_classification_id
                )
                VALUES (
                    v_profile_id,
                    p_viewing_classifications[i]
                );
            END LOOP;
        END IF;
        
        -- Commit transaction
        COMMIT;
        
        RAISE NOTICE 'Profile created with ID % and preferences set', v_profile_id;
    EXCEPTION
        WHEN OTHERS THEN
            -- Rollback transaction on error
            ROLLBACK;
            RAISE;
    END;
END;
$$;

-- Procedure to get recommended content based on watch history
CREATE OR REPLACE FUNCTION public."GetRecommendedContent"(
    IN p_profile_id INTEGER,
    IN p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
    media_id INTEGER,
    title VARCHAR,
    description TEXT,
    release_date DATE,
    duration INTEGER,
    similarity NUMERIC
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH watched_genres AS (
        SELECT 
            g.genre_id,
            COUNT(*) AS watch_count
        FROM 
            public."WatchHistory" wh
        JOIN 
            public."Media" m ON wh.media_id = m.media_id
        JOIN 
            public."MediaGenres" mg ON m.media_id = mg.media_id
        JOIN 
            public."Genre" g ON mg.genre_id = g.genre_id
        WHERE 
            wh.profile_id = p_profile_id
        GROUP BY 
            g.genre_id
    ),
    profile_age_limit AS (
        SELECT 
            p.age
        FROM 
            public."Profiles" p
        WHERE 
            p.profile_id = p_profile_id
    ),
    unwatched_media AS (
        SELECT 
            m.media_id
        FROM 
            public."Media" m
        WHERE 
            NOT EXISTS (
                SELECT 1 
                FROM public."WatchHistory" wh 
                WHERE wh.media_id = m.media_id AND wh.profile_id = p_profile_id
            )
    )
    SELECT 
        m.media_id,
        m.title,
        m.description,
        m.release_date,
        m.duration,
        SUM(COALESCE(wg.watch_count, 0)) AS similarity
    FROM 
        public."Media" m
    JOIN 
        unwatched_media um ON m.media_id = um.media_id
    JOIN 
        public."MediaGenres" mg ON m.media_id = mg.media_id
    JOIN 
        public."ViewingClassification" vc ON m.viewing_classification_id = vc.viewing_classification_id
    LEFT JOIN 
        watched_genres wg ON mg.genre_id = wg.genre_id
    JOIN 
        profile_age_limit pal ON pal.age >= vc.minimum_age
    GROUP BY 
        m.media_id, m.title, m.description, m.release_date, m.duration
    ORDER BY 
        similarity DESC, m.release_date DESC
    LIMIT p_limit;
END;
$$;

-- Grant appropriate permissions
GRANT EXECUTE ON PROCEDURE public."UpdateUserSubscription"(INTEGER, VARCHAR, NUMERIC) TO senior, api;
GRANT EXECUTE ON PROCEDURE public."CreateProfileWithPreferences"(INTEGER, VARCHAR, INTEGER, VARCHAR, BOOLEAN, VARCHAR, INTEGER[], INTEGER) TO senior, api;
GRANT EXECUTE ON FUNCTION public."GetRecommendedContent"(INTEGER, INTEGER) TO senior, medior, api;
