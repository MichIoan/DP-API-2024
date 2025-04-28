-- Additional views for different access levels

-- View for user profiles with limited personal information (for Junior role)
CREATE OR REPLACE VIEW public.safe_user_profiles AS
SELECT 
    p.profile_id,
    p.name,
    p.age,
    p.photo_path,
    p.child_profile,
    p.language,
    u.email
FROM 
    public."Profiles" p
JOIN 
    public."Users" u ON p.user_id = u.user_id
WHERE 
    u.activation_status = 'active';

-- View for subscription details (for Medior role)
CREATE OR REPLACE VIEW public.subscription_details AS
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
    public."Subscriptions" s
JOIN 
    public."Users" u ON s.user_id = u.user_id;

-- View for media content with appropriate age restrictions (for content filtering)
CREATE OR REPLACE VIEW public.age_appropriate_content AS
SELECT 
    m.media_id,
    m.title,
    m.description,
    m.release_date,
    m.duration,
    vc.minimum_age,
    vc.description AS rating_description
FROM 
    public."Media" m
JOIN 
    public."ViewingClassification" vc ON m.viewing_classification_id = vc.viewing_classification_id;

-- View for analytics on most watched content (for Senior role)
CREATE OR REPLACE VIEW public.content_analytics AS
SELECT 
    m.media_id,
    m.title,
    COUNT(wh.history_id) AS total_views,
    AVG(wh.times_watched) AS avg_times_watched,
    COUNT(DISTINCT wh.profile_id) AS unique_viewers
FROM 
    public."Media" m
LEFT JOIN 
    public."WatchHistory" wh ON m.media_id = wh.media_id
GROUP BY 
    m.media_id, m.title
ORDER BY 
    total_views DESC;

-- Grant appropriate permissions
GRANT SELECT ON public.safe_user_profiles TO junior;
GRANT SELECT ON public.subscription_details TO medior;
GRANT SELECT ON public.age_appropriate_content TO junior, medior, api;
GRANT SELECT ON public.content_analytics TO senior;
