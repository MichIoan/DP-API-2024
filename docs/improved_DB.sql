-- Improved Netflix Database Schema
-- This schema aligns with the OOP model structure and follows modern database design principles

-- Drop existing tables if they exist (for clean installation)
-- In production, you would want to migrate data instead

-- User-related tables
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    activation_status VARCHAR(20) NOT NULL DEFAULT 'not_activated' CHECK (activation_status IN ('not_activated', 'active', 'suspended', 'locked')),
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP,
    referral_id INTEGER REFERENCES users(user_id),
    referral_code VARCHAR(20) UNIQUE,
    has_discount BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE profiles (
    profile_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    age INTEGER,
    photo_path VARCHAR(255),
    child_profile BOOLEAN DEFAULT FALSE,
    date_of_birth DATE,
    language VARCHAR(10) DEFAULT 'en',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE subscriptions (
    subscription_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    type VARCHAR(10) NOT NULL CHECK (type IN ('SD', 'HD', 'UHD')),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'expired', 'trial')),
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE,
    price DECIMAL(10,2) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Content-related tables
CREATE TABLE series (
    series_id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    age_restriction INTEGER NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    description TEXT,
    rating DECIMAL(3,1) CHECK (rating >= 0 AND rating <= 10),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE seasons (
    season_id SERIAL PRIMARY KEY,
    series_id INTEGER NOT NULL REFERENCES series(series_id) ON DELETE CASCADE,
    season_number INTEGER NOT NULL,
    release_date DATE,
    episode_count INTEGER DEFAULT 0,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE media (
    media_id SERIAL PRIMARY KEY,
    season_id INTEGER NOT NULL REFERENCES seasons(season_id) ON DELETE CASCADE,
    episode_number INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    duration TIME NOT NULL,
    release_date DATE,
    description TEXT,
    classification VARCHAR(10) DEFAULT 'PG13' CHECK (classification IN ('G', 'PG', 'PG13', 'R', 'NC17')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE subtitles (
    subtitles_id SERIAL PRIMARY KEY,
    media_id INTEGER NOT NULL REFERENCES media(media_id) ON DELETE CASCADE,
    language VARCHAR(10) NOT NULL,
    file_path VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE genres (
    genre_id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT
);

-- Junction table for media and genres (many-to-many)
CREATE TABLE media_genres (
    media_genre_id SERIAL PRIMARY KEY,
    media_id INTEGER NOT NULL REFERENCES media(media_id) ON DELETE CASCADE,
    genre_id INTEGER NOT NULL REFERENCES genres(genre_id) ON DELETE CASCADE,
    UNIQUE(media_id, genre_id)
);

-- User activity tables
CREATE TABLE watch_history (
    history_id SERIAL PRIMARY KEY,
    profile_id INTEGER NOT NULL REFERENCES profiles(profile_id) ON DELETE CASCADE,
    media_id INTEGER NOT NULL REFERENCES media(media_id) ON DELETE CASCADE,
    resume_to TIME,
    times_watched INTEGER DEFAULT 1,
    time_stamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    viewing_status VARCHAR(20) DEFAULT 'started' CHECK (viewing_status IN ('started', 'in_progress', 'completed', 'abandoned')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE watch_lists (
    list_id SERIAL PRIMARY KEY,
    profile_id INTEGER NOT NULL REFERENCES profiles(profile_id) ON DELETE CASCADE,
    media_id INTEGER NOT NULL REFERENCES media(media_id) ON DELETE CASCADE,
    viewing_status VARCHAR(20) DEFAULT 'started' CHECK (viewing_status IN ('started', 'in_progress', 'completed', 'abandoned')),
    date_added TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    priority INTEGER DEFAULT 0 CHECK (priority >= 0 AND priority <= 10),
    UNIQUE(profile_id, media_id)
);

-- Create indexes for performance
CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_media_title ON media(title);
CREATE INDEX idx_seasons_series_id ON seasons(series_id);
CREATE INDEX idx_media_season_id ON media(season_id);
CREATE INDEX idx_watch_history_profile_id ON watch_history(profile_id);
CREATE INDEX idx_watch_history_media_id ON watch_history(media_id);
CREATE INDEX idx_watch_lists_profile_id ON watch_lists(profile_id);
CREATE INDEX idx_watch_lists_media_id ON watch_lists(media_id);

-- Views for different access levels and reporting
CREATE VIEW safe_user_profiles AS
SELECT 
    p.profile_id,
    p.name,
    p.age,
    p.photo_path,
    p.child_profile,
    p.language,
    u.email
FROM 
    profiles p
JOIN 
    users u ON p.user_id = u.user_id
WHERE 
    u.activation_status = 'active';

CREATE VIEW subscription_details AS
SELECT 
    s.subscription_id,
    s.user_id,
    s.type,
    s.status,
    s.start_date,
    s.end_date,
    s.price,
    u.email,
    u.has_discount
FROM 
    subscriptions s
JOIN 
    users u ON s.user_id = u.user_id;

CREATE VIEW age_appropriate_content AS
SELECT 
    m.media_id,
    m.title,
    m.duration,
    m.release_date,
    m.classification,
    s.series_id,
    se.season_number,
    se.series_id
FROM 
    media m
JOIN 
    seasons se ON m.season_id = se.season_id
JOIN 
    series s ON se.series_id = s.series_id
WHERE 
    s.age_restriction <= 13;

CREATE VIEW watch_history_details AS
SELECT 
    wh.history_id,
    wh.profile_id,
    wh.media_id,
    wh.resume_to AS resume_position,
    wh.times_watched,
    wh.time_stamp,
    wh.viewing_status,
    m.title AS media_title,
    m.duration AS media_duration
FROM 
    watch_history wh
LEFT JOIN 
    media m ON wh.media_id = m.media_id;

CREATE VIEW watch_list_details AS
SELECT 
    wl.list_id,
    wl.profile_id,
    wl.media_id,
    wl.viewing_status,
    wl.priority,
    m.title AS media_title,
    m.duration AS media_duration
FROM 
    watch_lists wl
LEFT JOIN 
    media m ON wl.media_id = m.media_id;

CREATE VIEW content_analytics AS
SELECT 
    m.media_id,
    m.title,
    COUNT(wh.history_id) AS view_count,
    AVG(CASE WHEN wh.viewing_status = 'completed' THEN 1 ELSE 0 END) AS completion_rate
FROM 
    media m
LEFT JOIN 
    watch_history wh ON m.media_id = wh.media_id
GROUP BY 
    m.media_id, m.title
ORDER BY 
    view_count DESC;

-- Stored procedures with transaction support
CREATE OR REPLACE PROCEDURE add_to_watch_list(
    IN p_profile_id INTEGER,
    IN p_media_id INTEGER
)
LANGUAGE plpgsql
AS $$
BEGIN
    -- Check if already in watch list
    IF EXISTS (SELECT 1 FROM watch_lists WHERE profile_id = p_profile_id AND media_id = p_media_id) THEN
        RAISE NOTICE 'Media already in watch list for this profile';
        RETURN;
    END IF;

    -- Add to watch list
    INSERT INTO watch_lists (
        profile_id,
        media_id
    )
    VALUES (
        p_profile_id,
        p_media_id
    );

    RAISE NOTICE 'Media with ID % successfully added to watch list for profile ID %.', p_media_id, p_profile_id;
END;
$$;

CREATE OR REPLACE PROCEDURE create_profile(
    IN p_user_id INTEGER,
    IN p_name VARCHAR,
    IN p_age INTEGER,
    IN p_photo_path VARCHAR,
    IN p_child_profile BOOLEAN,
    OUT v_profile_id INTEGER
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_profile_count INTEGER;
BEGIN
    -- Check the current number of profiles for the user
    SELECT COUNT(*) INTO v_profile_count
    FROM profiles
    WHERE user_id = p_user_id;

    IF v_profile_count >= 4 THEN
        RAISE EXCEPTION 'User with ID % already has the maximum number of profiles.', p_user_id;
    END IF;

    -- Insert the new profile
    INSERT INTO profiles (
        user_id,
        name,
        age,
        photo_path,
        child_profile
    )
    VALUES (
        p_user_id,
        p_name,
        p_age,
        p_photo_path,
        p_child_profile
    )
    RETURNING profile_id INTO v_profile_id;

    RAISE NOTICE 'Profile successfully created with ID % for user ID %.', v_profile_id, p_user_id;
END;
$$;

CREATE OR REPLACE PROCEDURE mark_as_watched(
    IN p_profile_id INTEGER,
    IN p_media_id INTEGER
)
LANGUAGE plpgsql
AS $$
BEGIN
    -- Start transaction
    BEGIN
        -- Remove from watch list if present
        DELETE FROM watch_lists
        WHERE profile_id = p_profile_id AND media_id = p_media_id;
        
        -- Add to watch history or update if already exists
        IF EXISTS (SELECT 1 FROM watch_history WHERE profile_id = p_profile_id AND media_id = p_media_id) THEN
            UPDATE watch_history
            SET times_watched = times_watched + 1, 
                time_stamp = CURRENT_TIMESTAMP,
                viewing_status = 'completed'
            WHERE profile_id = p_profile_id AND media_id = p_media_id;
        ELSE
            INSERT INTO watch_history (
                profile_id,
                media_id,
                viewing_status
            )
            VALUES (
                p_profile_id,
                p_media_id,
                'completed'
            );
        END IF;
        
        RAISE NOTICE 'Media with ID % marked as watched for profile ID %.', p_media_id, p_profile_id;
    EXCEPTION
        WHEN OTHERS THEN
            ROLLBACK;
            RAISE;
    END;
END;
$$;

CREATE OR REPLACE PROCEDURE update_user_subscription(
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
        IF NOT EXISTS (SELECT 1 FROM users WHERE user_id = p_user_id) THEN
            RAISE EXCEPTION 'User with ID % does not exist', p_user_id;
        END IF;
        
        -- Find existing active subscription
        SELECT subscription_id INTO v_old_subscription_id
        FROM subscriptions
        WHERE user_id = p_user_id AND status = 'active';
        
        -- If there's an active subscription, mark it as canceled
        IF v_old_subscription_id IS NOT NULL THEN
            UPDATE subscriptions
            SET status = 'canceled', end_date = CURRENT_DATE, updated_at = CURRENT_TIMESTAMP
            WHERE subscription_id = v_old_subscription_id;
        END IF;
        
        -- Create new subscription
        INSERT INTO subscriptions (
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
            CURRENT_DATE + INTERVAL '1 month',
            p_price,
            'Subscription created on ' || CURRENT_DATE
        );
        
        RAISE NOTICE 'Subscription updated for user ID %.', p_user_id;
    EXCEPTION
        WHEN OTHERS THEN
            ROLLBACK;
            RAISE;
    END;
END;
$$;

CREATE OR REPLACE PROCEDURE create_profile_with_preferences(
    IN p_user_id INTEGER,
    IN p_name VARCHAR,
    IN p_age INTEGER,
    IN p_language VARCHAR,
    IN p_preferred_genres INTEGER[],
    OUT v_profile_id INTEGER
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_genre_id INTEGER;
BEGIN
    -- Start transaction
    BEGIN
        -- Create the profile
        CALL create_profile(p_user_id, p_name, p_age, NULL, p_age < 13, v_profile_id);
        
        -- Update language preference
        UPDATE profiles
        SET language = p_language
        WHERE profile_id = v_profile_id;
        
        -- Add genre preferences (would require additional table in real implementation)
        -- This is just a placeholder for the concept
        RAISE NOTICE 'Profile created with ID % and preferences set.', v_profile_id;
    EXCEPTION
        WHEN OTHERS THEN
            ROLLBACK;
            RAISE;
    END;
END;
$$;

CREATE OR REPLACE FUNCTION get_recommended_content(
    p_profile_id INTEGER,
    p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
    media_id INTEGER,
    title VARCHAR,
    duration TIME,
    classification VARCHAR,
    match_score NUMERIC
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH watched_genres AS (
        SELECT 
            g.genre_id,
            COUNT(*) as watch_count
        FROM 
            watch_history wh
        JOIN 
            media m ON wh.media_id = m.media_id
        JOIN 
            media_genres mg ON m.media_id = mg.media_id
        JOIN 
            genres g ON mg.genre_id = g.genre_id
        WHERE 
            wh.profile_id = p_profile_id
        GROUP BY 
            g.genre_id
    ),
    unwatched_media AS (
        SELECT 
            m.media_id,
            m.title,
            m.duration,
            m.classification
        FROM 
            media m
        WHERE 
            NOT EXISTS (
                SELECT 1 
                FROM watch_history wh 
                WHERE wh.profile_id = p_profile_id AND wh.media_id = m.media_id
            )
    )
    SELECT 
        um.media_id,
        um.title,
        um.duration,
        um.classification,
        SUM(COALESCE(wg.watch_count, 0)) as match_score
    FROM 
        unwatched_media um
    JOIN 
        media_genres mg ON um.media_id = mg.media_id
    LEFT JOIN 
        watched_genres wg ON mg.genre_id = wg.genre_id
    GROUP BY 
        um.media_id, um.title, um.duration, um.classification
    ORDER BY 
        match_score DESC, um.media_id
    LIMIT p_limit;
END;
$$;

-- Create roles
CREATE ROLE api LOGIN PASSWORD 'api_password';
CREATE ROLE junior LOGIN PASSWORD 'junior_password';
CREATE ROLE medior LOGIN PASSWORD 'medior_password';
CREATE ROLE senior LOGIN PASSWORD 'senior_password';

-- Grant permissions to roles
GRANT SELECT ON safe_user_profiles TO junior;
GRANT SELECT ON age_appropriate_content TO junior;

GRANT SELECT ON safe_user_profiles TO medior;
GRANT SELECT ON age_appropriate_content TO medior;
GRANT SELECT ON subscription_details TO medior;
GRANT SELECT ON watch_history_details TO medior;
GRANT SELECT ON watch_list_details TO medior;

GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO senior;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO senior;
GRANT EXECUTE ON ALL PROCEDURES IN SCHEMA public TO senior;

GRANT SELECT ON safe_user_profiles TO api;
GRANT SELECT ON age_appropriate_content TO api;
GRANT SELECT ON subscription_details TO api;
GRANT SELECT ON watch_history_details TO api;
GRANT SELECT ON watch_list_details TO api;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO api;
GRANT EXECUTE ON ALL PROCEDURES IN SCHEMA public TO api;
