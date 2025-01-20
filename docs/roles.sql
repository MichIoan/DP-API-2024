CREATE ROLE api LOGIN PASSWORD 'api_password'; 
CREATE ROLE junior LOGIN PASSWORD 'junior_password';
CREATE ROLE medior LOGIN PASSWORD 'medior_password';
CREATE ROLE senior LOGIN PASSWORD 'senior_password';

-- Senior role permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO senior;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO senior;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO senior;

-- Medior role permissions

GRANT junior TO medior;

GRANT SELECT, INSERT, UPDATE, DELETE ON public."Subscriptions" TO medior;
GRANT SELECT, INSERT, UPDATE, DELETE ON public."Media" TO medior;
GRANT SELECT, INSERT, UPDATE, DELETE ON public."Users" TO medior;

-- Junior role permissions
GRANT SELECT ON public."Profiles", public."WatchHistory", public."WatchLists" TO junior;

GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO junior;

-- API role permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public."Users" TO api;
GRANT SELECT, INSERT, UPDATE, DELETE ON public."Profiles" TO api;
GRANT SELECT, INSERT, UPDATE, DELETE ON public."WatchHistory" TO api;
GRANT SELECT, INSERT, UPDATE, DELETE ON public."WatchLists" TO api;
GRANT SELECT, INSERT, UPDATE, DELETE ON public."Subscriptions" TO api;
GRANT SELECT, INSERT, UPDATE, DELETE ON public."ViewingClassification" TO api;
GRANT SELECT, INSERT, UPDATE, DELETE ON public."Media" TO api;
GRANT SELECT, INSERT, UPDATE, DELETE ON public."Seasons" TO api;
GRANT SELECT, INSERT, UPDATE, DELETE ON public."Series" TO api;
GRANT SELECT, INSERT, UPDATE, DELETE ON public."Subtitles" TO api;
GRANT SELECT, INSERT, UPDATE, DELETE ON public."Qualities" TO api;
GRANT SELECT, INSERT, UPDATE, DELETE ON public."Genre" TO api;

GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO api;

