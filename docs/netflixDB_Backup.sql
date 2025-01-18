--
-- PostgreSQL database dump
--

-- Dumped from database version 17.1
-- Dumped by pg_dump version 17.0

-- Started on 2025-01-16 16:44:36

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER DATABASE netflix OWNER TO postgres;

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 266 (class 1255 OID 16801)
-- Name: AddToWatchList(integer, integer); Type: PROCEDURE; Schema: public; Owner: postgres
--

CREATE PROCEDURE public."AddToWatchList"(IN p_profile_id integer, IN p_movie_id integer)
    LANGUAGE plpgsql
    AS $$
BEGIN
    INSERT INTO public."WatchList" (
        profile_id,
        movie_id
    )
    VALUES (
        p_profile_id,
        p_movie_id
    );

    RAISE NOTICE 'Movie with ID % successfully added to watch list for profile ID %.', p_movie_id, p_profile_id;
END;
$$;


ALTER PROCEDURE public."AddToWatchList"(IN p_profile_id integer, IN p_movie_id integer) OWNER TO postgres;

--
-- TOC entry 265 (class 1255 OID 16800)
-- Name: CreateProfile(integer, character varying, integer, character varying, boolean); Type: PROCEDURE; Schema: public; Owner: postgres
--

CREATE PROCEDURE public."CreateProfile"(IN p_user_id integer, IN p_name character varying, IN p_age integer, IN p_photo_path character varying, IN p_child_profile boolean, OUT v_profile_id integer)
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_profile_count INTEGER;
BEGIN
    -- Check the current number of profiles for the user
    SELECT COUNT(*) INTO v_profile_count
    FROM public."Profiles"
    WHERE user_id = p_user_id;

    IF v_profile_count >= 4 THEN
        RAISE EXCEPTION 'User with ID % already has the maximum number of profiles.', p_user_id;
    END IF;

    -- Insert the new profile
    INSERT INTO public."Profiles" (
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


ALTER PROCEDURE public."CreateProfile"(IN p_user_id integer, IN p_name character varying, IN p_age integer, IN p_photo_path character varying, IN p_child_profile boolean, OUT v_profile_id integer) OWNER TO postgres;

--
-- TOC entry 268 (class 1255 OID 16803)
-- Name: MarkAsWatched(integer, integer); Type: PROCEDURE; Schema: public; Owner: postgres
--

CREATE PROCEDURE public."MarkAsWatched"(IN p_profile_id integer, IN p_movie_id integer)
    LANGUAGE plpgsql
    AS $$
BEGIN
    DELETE FROM public."WatchList"
    WHERE profile_id = p_profile_id AND movie_id = p_movie_id;

    INSERT INTO public."WatchedMovies" (
        profile_id,
        movie_id,
        watched_on
    )
    VALUES (
        p_profile_id,
        p_movie_id,
        NOW()
    );

    RAISE NOTICE 'Movie with ID % successfully marked as watched for profile ID %.', p_movie_id, p_profile_id;
END;
$$;


ALTER PROCEDURE public."MarkAsWatched"(IN p_profile_id integer, IN p_movie_id integer) OWNER TO postgres;

--
-- TOC entry 263 (class 1255 OID 16798)
-- Name: RegisterUser(character varying, character varying, character varying); Type: PROCEDURE; Schema: public; Owner: postgres
--

CREATE PROCEDURE public."RegisterUser"(IN p_email character varying, IN p_password character varying, INOUT p_referral_code character varying, OUT v_user_id integer)
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_referral_id INTEGER;
BEGIN
    -- Check if referral code exists (optional step for referrals)
    IF p_referral_code IS NOT NULL THEN
        SELECT user_id INTO v_referral_id
        FROM public."Users"
        WHERE referral_code = p_referral_code;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Referral code % does not exist.', p_referral_code;
        END IF;
    END IF;

    -- Insert the new user into the Users table
    INSERT INTO public."Users" (
        email,
        password,
        failed_login_attempts,
        activation_status,
        trial_available,
        referral_id,
        referral_code
    )
    VALUES (
        p_email,
        p_password,
        0,
        false, -- Activation status set to false until email is validated externally
        true, -- Free trial enabled by default
        v_referral_id,
        p_referral_code
    )
    RETURNING user_id INTO v_user_id;
END;
$$;


ALTER PROCEDURE public."RegisterUser"(IN p_email character varying, IN p_password character varying, INOUT p_referral_code character varying, OUT v_user_id integer) OWNER TO postgres;

--
-- TOC entry 267 (class 1255 OID 16802)
-- Name: RemoveFromWatchList(integer, integer); Type: PROCEDURE; Schema: public; Owner: postgres
--

CREATE PROCEDURE public."RemoveFromWatchList"(IN p_profile_id integer, IN p_movie_id integer)
    LANGUAGE plpgsql
    AS $$
BEGIN
    DELETE FROM public."WatchList"
    WHERE profile_id = p_profile_id AND movie_id = p_movie_id;

    RAISE NOTICE 'Movie with ID % successfully removed from watch list for profile ID %.', p_movie_id, p_profile_id;
END;
$$;


ALTER PROCEDURE public."RemoveFromWatchList"(IN p_profile_id integer, IN p_movie_id integer) OWNER TO postgres;

--
-- TOC entry 264 (class 1255 OID 16799)
-- Name: ResetPassword(character varying, character varying); Type: PROCEDURE; Schema: public; Owner: postgres
--

CREATE PROCEDURE public."ResetPassword"(IN p_email character varying, IN p_new_password character varying)
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_user_id INTEGER;
BEGIN
    -- Find the user by email
    SELECT user_id INTO v_user_id
    FROM public."Users"
    WHERE email = p_email;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'User with email % does not exist.', p_email;
    END IF;

    -- Update the user's password
    UPDATE public."Users"
    SET password = p_new_password,
        failed_login_attempts = 0 -- Reset failed login attempts
    WHERE user_id = v_user_id;

    RAISE NOTICE 'Password successfully updated for user ID %.', v_user_id;
END;
$$;


ALTER PROCEDURE public."ResetPassword"(IN p_email character varying, IN p_new_password character varying) OWNER TO postgres;

--
-- TOC entry 277 (class 1255 OID 16854)
-- Name: apply_referral_discount(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.apply_referral_discount() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    PERFORM public."ApplyDiscount"(NEW.referral_id, NEW.user_id);
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.apply_referral_discount() OWNER TO postgres;

--
-- TOC entry 271 (class 1255 OID 16806)
-- Name: applydiscount(integer, integer); Type: PROCEDURE; Schema: public; Owner: postgres
--

CREATE PROCEDURE public.applydiscount(IN inviter_id integer, IN invitee_id integer)
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Apply discount by reducing subscription price for the inviter
    UPDATE Subscriptions
    SET price = price - 2.00
    WHERE user_id = inviter_id AND price > 2.00;

    -- Apply discount by reducing subscription price for the invitee
    UPDATE Subscriptions
    SET price = price - 2.00
    WHERE user_id = invitee_id AND price > 2.00;
END;
$$;


ALTER PROCEDURE public.applydiscount(IN inviter_id integer, IN invitee_id integer) OWNER TO postgres;

--
-- TOC entry 269 (class 1255 OID 16804)
-- Name: blockaccount(integer); Type: PROCEDURE; Schema: public; Owner: postgres
--

CREATE PROCEDURE public.blockaccount(IN user_id integer)
    LANGUAGE plpgsql
    AS $$
BEGIN
    UPDATE Users
    SET locked_until = NOW() + INTERVAL '15 minutes'
    WHERE user_id = user_id AND failed_login_attempts >= 3;
END;
$$;


ALTER PROCEDURE public.blockaccount(IN user_id integer) OWNER TO postgres;

--
-- TOC entry 274 (class 1255 OID 16848)
-- Name: expire_trial_period(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.expire_trial_period() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF NEW.price IS NOT NULL THEN
        UPDATE "Users"
        SET trial_available = FALSE
        WHERE user_id = NEW.user_id;
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.expire_trial_period() OWNER TO postgres;

--
-- TOC entry 273 (class 1255 OID 16846)
-- Name: lock_user_account(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.lock_user_account() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    PERFORM public."BlockAccount"(NEW.user_id);
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.lock_user_account() OWNER TO postgres;

--
-- TOC entry 282 (class 1255 OID 16856)
-- Name: remove_from_watchlist(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.remove_from_watchlist() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    PERFORM public."MarkAsWatched"(NEW.profile_id, NEW.media_id);
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.remove_from_watchlist() OWNER TO postgres;

--
-- TOC entry 275 (class 1255 OID 16850)
-- Name: update_viewing_history(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_viewing_history() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF EXISTS (SELECT 1 FROM "Watch History" WHERE profile_id = NEW.profile_id AND media_id = NEW.media_id) THEN
        UPDATE "Watch History"
        SET times_watched = times_watched + 1, time_stamp = NOW()
        WHERE profile_id = NEW.profile_id AND media_id = NEW.media_id;
        RETURN NULL;
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_viewing_history() OWNER TO postgres;

--
-- TOC entry 270 (class 1255 OID 16805)
-- Name: updatepreferences(integer, boolean, integer, text); Type: PROCEDURE; Schema: public; Owner: postgres
--

CREATE PROCEDURE public.updatepreferences(IN profile_id integer, IN prefers_series boolean, IN min_age integer, IN genre text)
    LANGUAGE plpgsql
    AS $$
BEGIN
    UPDATE Profiles
    SET prefers_series = prefers_series,
        min_age = min_age,
        genre = genre
    WHERE profile_id = profile_id;
END;
$$;


ALTER PROCEDURE public.updatepreferences(IN profile_id integer, IN prefers_series boolean, IN min_age integer, IN genre text) OWNER TO postgres;

--
-- TOC entry 272 (class 1255 OID 16807)
-- Name: updatesubscription(integer, text); Type: PROCEDURE; Schema: public; Owner: postgres
--

CREATE PROCEDURE public.updatesubscription(IN user_id integer, IN new_plan text)
    LANGUAGE plpgsql
    AS $$
BEGIN
    UPDATE Subscriptions
    SET plan = new_plan,
        updated_at = NOW()
    WHERE user_id = user_id;
END;
$$;


ALTER PROCEDURE public.updatesubscription(IN user_id integer, IN new_plan text) OWNER TO postgres;

--
-- TOC entry 276 (class 1255 OID 16852)
-- Name: validate_profile_age(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.validate_profile_age() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF NEW.child_profile AND NEW.age >= 18 THEN
        RAISE EXCEPTION 'Child profiles cannot have age 18 or higher';
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.validate_profile_age() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 242 (class 1259 OID 16638)
-- Name: Genre; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Genre" (
    genre_id integer NOT NULL,
    preferences_id integer NOT NULL,
    action boolean DEFAULT false,
    adventure boolean DEFAULT false,
    comedy boolean DEFAULT false,
    crime boolean DEFAULT false,
    drama boolean DEFAULT false,
    horror boolean DEFAULT false,
    romance boolean DEFAULT false,
    science_fiction boolean DEFAULT false
);


ALTER TABLE public."Genre" OWNER TO postgres;

--
-- TOC entry 240 (class 1259 OID 16636)
-- Name: Genre_genre_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Genre_genre_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Genre_genre_id_seq" OWNER TO postgres;

--
-- TOC entry 5061 (class 0 OID 0)
-- Dependencies: 240
-- Name: Genre_genre_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Genre_genre_id_seq" OWNED BY public."Genre".genre_id;


--
-- TOC entry 241 (class 1259 OID 16637)
-- Name: Genre_preferences_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Genre_preferences_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Genre_preferences_id_seq" OWNER TO postgres;

--
-- TOC entry 5062 (class 0 OID 0)
-- Dependencies: 241
-- Name: Genre_preferences_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Genre_preferences_id_seq" OWNED BY public."Genre".preferences_id;


--
-- TOC entry 233 (class 1259 OID 16605)
-- Name: Media; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Media" (
    media_id integer NOT NULL,
    season_id integer NOT NULL,
    episode_number integer DEFAULT 1,
    title character varying(255),
    duration time without time zone,
    release_date timestamp without time zone,
    available_qualities character varying(255)[]
);


ALTER TABLE public."Media" OWNER TO postgres;

--
-- TOC entry 231 (class 1259 OID 16603)
-- Name: Media_media_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Media_media_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Media_media_id_seq" OWNER TO postgres;

--
-- TOC entry 5063 (class 0 OID 0)
-- Dependencies: 231
-- Name: Media_media_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Media_media_id_seq" OWNED BY public."Media".media_id;


--
-- TOC entry 232 (class 1259 OID 16604)
-- Name: Media_season_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Media_season_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Media_season_id_seq" OWNER TO postgres;

--
-- TOC entry 5064 (class 0 OID 0)
-- Dependencies: 232
-- Name: Media_season_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Media_season_id_seq" OWNED BY public."Media".season_id;


--
-- TOC entry 239 (class 1259 OID 16626)
-- Name: Preferences; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Preferences" (
    preferences_id integer NOT NULL,
    profile_id integer NOT NULL,
    content_type character varying(255),
    viewing_classification character varying(255)[],
    minimum_age integer DEFAULT 0,
    CONSTRAINT fk_profile_id FOREIGN KEY (profile_id)
        REFERENCES public."Profiles" (profile_id)
        ON DELETE CASCADE
);


ALTER TABLE public."Preferences" OWNER TO postgres;

--
-- TOC entry 237 (class 1259 OID 16624)
-- Name: Preferences_preferences_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Preferences_preferences_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Preferences_preferences_id_seq" OWNER TO postgres;

--
-- TOC entry 5065 (class 0 OID 0)
-- Dependencies: 237
-- Name: Preferences_preferences_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Preferences_preferences_id_seq" OWNED BY public."Preferences".preferences_id;


--
-- TOC entry 238 (class 1259 OID 16625)
-- Name: Preferences_profile_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Preferences_profile_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Preferences_profile_id_seq" OWNER TO postgres;

--
-- TOC entry 5066 (class 0 OID 0)
-- Dependencies: 238
-- Name: Preferences_profile_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Preferences_profile_id_seq" OWNED BY public."Preferences".profile_id;


--
-- TOC entry 222 (class 1259 OID 16560)
-- Name: Profiles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Profiles" (
    profile_id integer NOT NULL,
    user_id integer NOT NULL,
    age integer DEFAULT 0,
    name character varying(255),
    photo_path character varying(255),
    child_profile boolean DEFAULT false,
    date_of_birth timestamp without time zone,
    language character varying,
    CONSTRAINT fk_user_id FOREIGN KEY (user_id)
        REFERENCES public."Users" (user_id)
        ON DELETE CASCADE
);


ALTER TABLE public."Profiles" OWNER TO postgres;

--
-- TOC entry 220 (class 1259 OID 16558)
-- Name: Profiles_profile_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Profiles_profile_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Profiles_profile_id_seq" OWNER TO postgres;

--
-- TOC entry 5067 (class 0 OID 0)
-- Dependencies: 220
-- Name: Profiles_profile_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Profiles_profile_id_seq" OWNED BY public."Profiles".profile_id;


--
-- TOC entry 221 (class 1259 OID 16559)
-- Name: Profiles_user_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Profiles_user_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Profiles_user_id_seq" OWNER TO postgres;

--
-- TOC entry 5068 (class 0 OID 0)
-- Dependencies: 221
-- Name: Profiles_user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Profiles_user_id_seq" OWNED BY public."Profiles".user_id;


--
-- TOC entry 230 (class 1259 OID 16595)
-- Name: Seasons; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Seasons" (
    season_id integer NOT NULL,
    series_id integer NOT NULL,
    season_number integer DEFAULT 1,
    release_date timestamp without time zone
);


ALTER TABLE public."Seasons" OWNER TO postgres;

--
-- TOC entry 228 (class 1259 OID 16593)
-- Name: Seasons_season_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Seasons_season_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Seasons_season_id_seq" OWNER TO postgres;

--
-- TOC entry 5069 (class 0 OID 0)
-- Dependencies: 228
-- Name: Seasons_season_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Seasons_season_id_seq" OWNED BY public."Seasons".season_id;


--
-- TOC entry 229 (class 1259 OID 16594)
-- Name: Seasons_series_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Seasons_series_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Seasons_series_id_seq" OWNER TO postgres;

--
-- TOC entry 5070 (class 0 OID 0)
-- Dependencies: 229
-- Name: Seasons_series_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Seasons_series_id_seq" OWNED BY public."Seasons".series_id;


--
-- TOC entry 227 (class 1259 OID 16584)
-- Name: Series; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Series" (
    series_id integer NOT NULL,
    title character varying(255),
    age_restriction integer DEFAULT 0,
    start_date timestamp without time zone,
    genre character varying(255)[],
    viewing_classification character varying(255)[]
);


ALTER TABLE public."Series" OWNER TO postgres;

--
-- TOC entry 226 (class 1259 OID 16583)
-- Name: Series_series_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Series_series_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Series_series_id_seq" OWNER TO postgres;

--
-- TOC entry 5071 (class 0 OID 0)
-- Dependencies: 226
-- Name: Series_series_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Series_series_id_seq" OWNED BY public."Series".series_id;


--
-- TOC entry 225 (class 1259 OID 16573)
-- Name: Subscriptions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Subscriptions" (
    subscription_id integer NOT NULL,
    user_id integer NOT NULL,
    price real DEFAULT 5.99,
    type character varying(255),
    description character varying(255),
    start_date timestamp without time zone,
    end_date timestamp without time zone
);


ALTER TABLE public."Subscriptions" OWNER TO postgres;

--
-- TOC entry 223 (class 1259 OID 16571)
-- Name: Subscriptions_subscription_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Subscriptions_subscription_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Subscriptions_subscription_id_seq" OWNER TO postgres;

--
-- TOC entry 5072 (class 0 OID 0)
-- Dependencies: 223
-- Name: Subscriptions_subscription_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Subscriptions_subscription_id_seq" OWNED BY public."Subscriptions".subscription_id;


--
-- TOC entry 224 (class 1259 OID 16572)
-- Name: Subscriptions_user_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Subscriptions_user_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Subscriptions_user_id_seq" OWNER TO postgres;

--
-- TOC entry 5073 (class 0 OID 0)
-- Dependencies: 224
-- Name: Subscriptions_user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Subscriptions_user_id_seq" OWNED BY public."Subscriptions".user_id;


--
-- TOC entry 236 (class 1259 OID 16617)
-- Name: Subtitles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Subtitles" (
    subtitles_id integer NOT NULL,
    media_id integer NOT NULL
);


ALTER TABLE public."Subtitles" OWNER TO postgres;

--
-- TOC entry 235 (class 1259 OID 16616)
-- Name: Subtitles_media_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Subtitles_media_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Subtitles_media_id_seq" OWNER TO postgres;

--
-- TOC entry 5074 (class 0 OID 0)
-- Dependencies: 235
-- Name: Subtitles_media_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Subtitles_media_id_seq" OWNED BY public."Subtitles".media_id;


--
-- TOC entry 234 (class 1259 OID 16615)
-- Name: Subtitles_subtitles_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Subtitles_subtitles_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Subtitles_subtitles_id_seq" OWNER TO postgres;

--
-- TOC entry 5075 (class 0 OID 0)
-- Dependencies: 234
-- Name: Subtitles_subtitles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Subtitles_subtitles_id_seq" OWNED BY public."Subtitles".subtitles_id;


--
-- TOC entry 219 (class 1259 OID 16543)
-- Name: Users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Users" (
    user_id integer NOT NULL,
    email character varying(255) NOT NULL,
    password character varying(255) NOT NULL,
    failed_login_attempts integer DEFAULT 0,
    activation_status boolean DEFAULT true,
    locked_until timestamp with time zone,
    referral_id integer NOT NULL,
    referral_code character varying(50),
    has_disconnected boolean DEFAULT false,
    trial_available boolean DEFAULT true
);


ALTER TABLE public."Users" OWNER TO postgres;

--
-- TOC entry 218 (class 1259 OID 16542)
-- Name: Users_referral_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Users_referral_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Users_referral_id_seq" OWNER TO postgres;

--
-- TOC entry 5076 (class 0 OID 0)
-- Dependencies: 218
-- Name: Users_referral_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Users_referral_id_seq" OWNED BY public."Users".referral_id;


--
-- TOC entry 217 (class 1259 OID 16541)
-- Name: Users_user_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Users_user_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Users_user_id_seq" OWNER TO postgres;

--
-- TOC entry 5077 (class 0 OID 0)
-- Dependencies: 217
-- Name: Users_user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Users_user_id_seq" OWNED BY public."Users".user_id;


--
-- TOC entry 245 (class 1259 OID 16655)
-- Name: Viewing Classification; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Viewing Classification" (
    viewing_classification_id integer NOT NULL,
    preferences_id integer NOT NULL,
    "6years" boolean DEFAULT false,
    "9years" boolean DEFAULT false,
    "12years" boolean DEFAULT false,
    "16years" boolean DEFAULT false,
    over_18years boolean DEFAULT false,
    violence boolean DEFAULT false,
    sex boolean DEFAULT false,
    terror boolean DEFAULT false,
    descrimination boolean DEFAULT false,
    drug_abuse boolean DEFAULT false,
    alcohol_abuse boolean DEFAULT false,
    coarse_language boolean DEFAULT false
);


ALTER TABLE public."Viewing Classification" OWNER TO postgres;

--
-- TOC entry 244 (class 1259 OID 16654)
-- Name: Viewing Classification_preferences_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Viewing Classification_preferences_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Viewing Classification_preferences_id_seq" OWNER TO postgres;

--
-- TOC entry 5078 (class 0 OID 0)
-- Dependencies: 244
-- Name: Viewing Classification_preferences_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Viewing Classification_preferences_id_seq" OWNED BY public."Viewing Classification".preferences_id;


--
-- TOC entry 243 (class 1259 OID 16653)
-- Name: Viewing Classification_viewing_classification_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Viewing Classification_viewing_classification_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Viewing Classification_viewing_classification_id_seq" OWNER TO postgres;

--
-- TOC entry 5079 (class 0 OID 0)
-- Dependencies: 243
-- Name: Viewing Classification_viewing_classification_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Viewing Classification_viewing_classification_id_seq" OWNED BY public."Viewing Classification".viewing_classification_id;


--
-- TOC entry 249 (class 1259 OID 16677)
-- Name: Watch History; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Watch History" (
    history_id integer NOT NULL,
    profile_id integer NOT NULL,
    media_id integer NOT NULL,
    resume_to time without time zone,
    times_watched integer DEFAULT 1,
    time_stamp timestamp without time zone,
    viewing_status character varying(255)
);


ALTER TABLE public."Watch History" OWNER TO postgres;

--
-- TOC entry 246 (class 1259 OID 16674)
-- Name: Watch History_history_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Watch History_history_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Watch History_history_id_seq" OWNER TO postgres;

--
-- TOC entry 5080 (class 0 OID 0)
-- Dependencies: 246
-- Name: Watch History_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Watch History_history_id_seq" OWNED BY public."Watch History".history_id;


--
-- TOC entry 248 (class 1259 OID 16676)
-- Name: Watch History_media_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Watch History_media_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Watch History_media_id_seq" OWNER TO postgres;

--
-- TOC entry 5081 (class 0 OID 0)
-- Dependencies: 248
-- Name: Watch History_media_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Watch History_media_id_seq" OWNED BY public."Watch History".media_id;


--
-- TOC entry 247 (class 1259 OID 16675)
-- Name: Watch History_profile_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Watch History_profile_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Watch History_profile_id_seq" OWNER TO postgres;

--
-- TOC entry 5082 (class 0 OID 0)
-- Dependencies: 247
-- Name: Watch History_profile_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Watch History_profile_id_seq" OWNED BY public."Watch History".profile_id;


--
-- TOC entry 253 (class 1259 OID 16689)
-- Name: WatchLists; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."WatchLists" (
    list_id integer NOT NULL,
    profile_id integer NOT NULL,
    media_id integer NOT NULL,
    viewing_status character varying(255)
);


ALTER TABLE public."WatchLists" OWNER TO postgres;

--
-- TOC entry 250 (class 1259 OID 16686)
-- Name: WatchLists_list_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."WatchLists_list_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."WatchLists_list_id_seq" OWNER TO postgres;

--
-- TOC entry 5083 (class 0 OID 0)
-- Dependencies: 250
-- Name: WatchLists_list_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."WatchLists_list_id_seq" OWNED BY public."WatchLists".list_id;


--
-- TOC entry 252 (class 1259 OID 16688)
-- Name: WatchLists_media_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."WatchLists_media_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."WatchLists_media_id_seq" OWNER TO postgres;

--
-- TOC entry 5084 (class 0 OID 0)
-- Dependencies: 252
-- Name: WatchLists_media_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."WatchLists_media_id_seq" OWNED BY public."WatchLists".media_id;


--
-- TOC entry 251 (class 1259 OID 16687)
-- Name: WatchLists_profile_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."WatchLists_profile_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."WatchLists_profile_id_seq" OWNER TO postgres;

--
-- TOC entry 5085 (class 0 OID 0)
-- Dependencies: 251
-- Name: WatchLists_profile_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."WatchLists_profile_id_seq" OWNED BY public."WatchLists".profile_id;


--
-- TOC entry 257 (class 1259 OID 16820)
-- Name: genre_details; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.genre_details AS
 SELECT preferences_id,
    action,
    adventure,
    comedy,
    crime,
    drama,
    horror,
    romance,
    science_fiction
   FROM public."Genre" g;


ALTER VIEW public.genre_details OWNER TO postgres;

--
-- TOC entry 261 (class 1259 OID 16836)
-- Name: media_details; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.media_details AS
 SELECT m.media_id,
    m.season_id,
    m.episode_number,
    m.title AS media_title,
    m.duration AS media_duration,
    m.release_date AS media_release_date,
    m.available_qualities AS media_qualities,
    s.title AS series_title,
    ss.season_number
   FROM ((public."Media" m
     LEFT JOIN public."Seasons" ss ON ((m.season_id = ss.season_id)))
     LEFT JOIN public."Series" s ON ((ss.series_id = s.series_id)));


ALTER VIEW public.media_details OWNER TO postgres;

--
-- TOC entry 255 (class 1259 OID 16812)
-- Name: profile_details; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.profile_details AS
 SELECT p.profile_id,
    p.user_id,
    p.name AS profile_name,
    p.age,
    p.photo_path,
    p.child_profile,
    p.language,
    p.date_of_birth,
    pr.content_type AS preference_content_type,
    pr.minimum_age AS preference_minimum_age,
    pr.viewing_classification AS preference_viewing_classifications
   FROM (public."Profiles" p
     LEFT JOIN public."Preferences" pr ON ((p.profile_id = pr.profile_id)));


ALTER VIEW public.profile_details OWNER TO postgres;

--
-- TOC entry 260 (class 1259 OID 16832)
-- Name: series_and_seasons; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.series_and_seasons AS
 SELECT s.series_id,
    s.title AS series_title,
    s.age_restriction,
    s.start_date AS series_start_date,
    s.genre AS series_genres,
    s.viewing_classification AS series_viewing_classifications,
    ss.season_id,
    ss.season_number,
    ss.release_date AS season_release_date
   FROM (public."Series" s
     LEFT JOIN public."Seasons" ss ON ((s.series_id = ss.series_id)));


ALTER VIEW public.series_and_seasons OWNER TO postgres;

--
-- TOC entry 262 (class 1259 OID 16841)
-- Name: subscription_referral_stats; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.subscription_referral_stats AS
 SELECT u.user_id,
    u.email,
    u.referral_code,
    count(r.user_id) AS referred_users_count,
    s.type AS subscription_type,
    s.price AS subscription_price
   FROM ((public."Users" u
     LEFT JOIN public."Users" r ON ((u.user_id = r.referral_id)))
     LEFT JOIN public."Subscriptions" s ON ((u.user_id = s.user_id)))
  GROUP BY u.user_id, u.email, u.referral_code, s.type, s.price;


ALTER VIEW public.subscription_referral_stats OWNER TO postgres;

--
-- TOC entry 254 (class 1259 OID 16808)
-- Name: user_details; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.user_details AS
 SELECT u.user_id,
    u.email,
    u.failed_login_attempts,
    u.activation_status,
    u.locked_until,
    u.referral_code,
    s.type AS subscription_type,
    s.price AS subscription_price,
    s.start_date AS subscription_start,
    s.end_date AS subscription_end
   FROM (public."Users" u
     LEFT JOIN public."Subscriptions" s ON ((u.user_id = s.user_id)));


ALTER VIEW public.user_details OWNER TO postgres;

--
-- TOC entry 256 (class 1259 OID 16816)
-- Name: viewing_classifications; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.viewing_classifications AS
 SELECT preferences_id,
    "6years" AS under_6,
    "9years" AS under_9,
    "12years" AS under_12,
    "16years" AS under_16,
    over_18years AS over_18,
    violence,
    sex,
    terror,
    descrimination,
    drug_abuse,
    alcohol_abuse,
    coarse_language
   FROM public."Viewing Classification" vc;


ALTER VIEW public.viewing_classifications OWNER TO postgres;

--
-- TOC entry 258 (class 1259 OID 16824)
-- Name: watch_history_details; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.watch_history_details AS
 SELECT wh.history_id,
    wh.profile_id,
    wh.media_id,
    wh.resume_to AS resume_position,
    wh.times_watched,
    wh.time_stamp,
    wh.viewing_status,
    m.title AS media_title,
    m.duration AS media_duration
   FROM (public."Watch History" wh
     LEFT JOIN public."Media" m ON ((wh.media_id = m.media_id)));


ALTER VIEW public.watch_history_details OWNER TO postgres;

--
-- TOC entry 259 (class 1259 OID 16828)
-- Name: watch_list_details; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.watch_list_details AS
 SELECT wl.list_id,
    wl.profile_id,
    wl.media_id,
    wl.viewing_status,
    m.title AS media_title,
    m.duration AS media_duration
   FROM (public."WatchLists" wl
     LEFT JOIN public."Media" m ON ((wl.media_id = m.media_id)));


ALTER VIEW public.watch_list_details OWNER TO postgres;

--
-- TOC entry 4787 (class 2604 OID 16641)
-- Name: Genre genre_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Genre" ALTER COLUMN genre_id SET DEFAULT nextval('public."Genre_genre_id_seq"'::regclass);


--
-- TOC entry 4788 (class 2604 OID 16642)
-- Name: Genre preferences_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Genre" ALTER COLUMN preferences_id SET DEFAULT nextval('public."Genre_preferences_id_seq"'::regclass);


--
-- TOC entry 4779 (class 2604 OID 16608)
-- Name: Media media_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Media" ALTER COLUMN media_id SET DEFAULT nextval('public."Media_media_id_seq"'::regclass);


--
-- TOC entry 4780 (class 2604 OID 16609)
-- Name: Media season_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Media" ALTER COLUMN season_id SET DEFAULT nextval('public."Media_season_id_seq"'::regclass);


--
-- TOC entry 4784 (class 2604 OID 16629)
-- Name: Preferences preferences_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Preferences" ALTER COLUMN preferences_id SET DEFAULT nextval('public."Preferences_preferences_id_seq"'::regclass);


--
-- TOC entry 4785 (class 2604 OID 16630)
-- Name: Preferences profile_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Preferences" ALTER COLUMN profile_id SET DEFAULT nextval('public."Preferences_profile_id_seq"'::regclass);


--
-- TOC entry 4767 (class 2604 OID 16563)
-- Name: Profiles profile_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Profiles" ALTER COLUMN profile_id SET DEFAULT nextval('public."Profiles_profile_id_seq"'::regclass);


--
-- TOC entry 4768 (class 2604 OID 16564)
-- Name: Profiles user_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Profiles" ALTER COLUMN user_id SET DEFAULT nextval('public."Profiles_user_id_seq"'::regclass);


--
-- TOC entry 4776 (class 2604 OID 16598)
-- Name: Seasons season_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Seasons" ALTER COLUMN season_id SET DEFAULT nextval('public."Seasons_season_id_seq"'::regclass);


--
-- TOC entry 4777 (class 2604 OID 16599)
-- Name: Seasons series_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Seasons" ALTER COLUMN series_id SET DEFAULT nextval('public."Seasons_series_id_seq"'::regclass);


--
-- TOC entry 4774 (class 2604 OID 16587)
-- Name: Series series_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Series" ALTER COLUMN series_id SET DEFAULT nextval('public."Series_series_id_seq"'::regclass);


--
-- TOC entry 4771 (class 2604 OID 16576)
-- Name: Subscriptions subscription_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Subscriptions" ALTER COLUMN subscription_id SET DEFAULT nextval('public."Subscriptions_subscription_id_seq"'::regclass);


--
-- TOC entry 4772 (class 2604 OID 16577)
-- Name: Subscriptions user_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Subscriptions" ALTER COLUMN user_id SET DEFAULT nextval('public."Subscriptions_user_id_seq"'::regclass);


--
-- TOC entry 4782 (class 2604 OID 16620)
-- Name: Subtitles subtitles_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Subtitles" ALTER COLUMN subtitles_id SET DEFAULT nextval('public."Subtitles_subtitles_id_seq"'::regclass);


--
-- TOC entry 4783 (class 2604 OID 16621)
-- Name: Subtitles media_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Subtitles" ALTER COLUMN media_id SET DEFAULT nextval('public."Subtitles_media_id_seq"'::regclass);


--
-- TOC entry 4761 (class 2604 OID 16546)
-- Name: Users user_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users" ALTER COLUMN user_id SET DEFAULT nextval('public."Users_user_id_seq"'::regclass);


--
-- TOC entry 4764 (class 2604 OID 16549)
-- Name: Users referral_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users" ALTER COLUMN referral_id SET DEFAULT nextval('public."Users_referral_id_seq"'::regclass);


--
-- TOC entry 4797 (class 2604 OID 16658)
-- Name: Viewing Classification viewing_classification_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Viewing Classification" ALTER COLUMN viewing_classification_id SET DEFAULT nextval('public."Viewing Classification_viewing_classification_id_seq"'::regclass);


--
-- TOC entry 4798 (class 2604 OID 16659)
-- Name: Viewing Classification preferences_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Viewing Classification" ALTER COLUMN preferences_id SET DEFAULT nextval('public."Viewing Classification_preferences_id_seq"'::regclass);


--
-- TOC entry 4811 (class 2604 OID 16680)
-- Name: Watch History history_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Watch History" ALTER COLUMN history_id SET DEFAULT nextval('public."Watch History_history_id_seq"'::regclass);


--
-- TOC entry 4812 (class 2604 OID 16681)
-- Name: Watch History profile_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Watch History" ALTER COLUMN profile_id SET DEFAULT nextval('public."Watch History_profile_id_seq"'::regclass);


--
-- TOC entry 4813 (class 2604 OID 16682)
-- Name: Watch History media_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Watch History" ALTER COLUMN media_id SET DEFAULT nextval('public."Watch History_media_id_seq"'::regclass);


--
-- TOC entry 4815 (class 2604 OID 16692)
-- Name: WatchLists list_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."WatchLists" ALTER COLUMN list_id SET DEFAULT nextval('public."WatchLists_list_id_seq"'::regclass);


--
-- TOC entry 4816 (class 2604 OID 16693)
-- Name: WatchLists profile_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."WatchLists" ALTER COLUMN profile_id SET DEFAULT nextval('public."WatchLists_profile_id_seq"'::regclass);


--
-- TOC entry 4817 (class 2604 OID 16694)
-- Name: WatchLists media_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."WatchLists" ALTER COLUMN media_id SET DEFAULT nextval('public."WatchLists_media_id_seq"'::regclass);


--
-- TOC entry 4837 (class 2606 OID 16652)
-- Name: Genre Genre_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Genre"
    ADD CONSTRAINT "Genre_pkey" PRIMARY KEY (genre_id);


--
-- TOC entry 4835 (class 2606 OID 16635)
-- Name: Preferences Preferences_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Preferences"
    ADD CONSTRAINT "Preferences_pkey" PRIMARY KEY (preferences_id);


--
-- TOC entry 4823 (class 2606 OID 16570)
-- Name: Profiles Profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Profiles"
    ADD CONSTRAINT "Profiles_pkey" PRIMARY KEY (profile_id);


--
-- TOC entry 4829 (class 2606 OID 16602)
-- Name: Seasons Seasons_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Seasons"
    ADD CONSTRAINT "Seasons_pkey" PRIMARY KEY (season_id);


--
-- TOC entry 4827 (class 2606 OID 16592)
-- Name: Series Series_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Series"
    ADD CONSTRAINT "Series_pkey" PRIMARY KEY (series_id);


--
-- TOC entry 4825 (class 2606 OID 16582)
-- Name: Subscriptions Subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Subscriptions"
    ADD CONSTRAINT "Subscriptions_pkey" PRIMARY KEY (subscription_id);


--
-- TOC entry 4833 (class 2606 OID 16623)
-- Name: Subtitles Subtitles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Subtitles"
    ADD CONSTRAINT "Subtitles_pkey" PRIMARY KEY (subtitles_id);


--
-- TOC entry 4839 (class 2606 OID 16673)
-- Name: Viewing Classification Viewing Classification_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Viewing Classification"
    ADD CONSTRAINT "Viewing Classification_pkey" PRIMARY KEY (viewing_classification_id);


--
-- TOC entry 4841 (class 2606 OID 16685)
-- Name: Watch History Watch History_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Watch History"
    ADD CONSTRAINT "Watch History_pkey" PRIMARY KEY (history_id);


--
-- TOC entry 4843 (class 2606 OID 16696)
-- Name: WatchLists WatchLists_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."WatchLists"
    ADD CONSTRAINT "WatchLists_pkey" PRIMARY KEY (list_id);


--
-- TOC entry 4819 (class 2606 OID 16557)
-- Name: Users email; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT email UNIQUE (email);


--
-- TOC entry 4831 (class 2606 OID 16614)
-- Name: Media media; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Media"
    ADD CONSTRAINT media PRIMARY KEY (media_id);


--
-- TOC entry 4821 (class 2606 OID 16555)
-- Name: Users user; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "user" PRIMARY KEY (user_id);


--
-- TOC entry 4857 (class 2620 OID 16847)
-- Name: Users failed_login_trigger; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER failed_login_trigger BEFORE UPDATE ON public."Users" FOR EACH ROW WHEN (((old.failed_login_attempts < 3) AND (new.failed_login_attempts >= 3))) EXECUTE FUNCTION public.lock_user_account();


--
-- TOC entry 4859 (class 2620 OID 16853)
-- Name: Profiles profile_age_validation_trigger; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER profile_age_validation_trigger BEFORE INSERT OR UPDATE ON public."Profiles" FOR EACH ROW EXECUTE FUNCTION public.validate_profile_age();


--
-- TOC entry 4858 (class 2620 OID 16855)
-- Name: Users referral_discount_trigger; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER referral_discount_trigger AFTER INSERT ON public."Users" FOR EACH ROW EXECUTE FUNCTION public.apply_referral_discount();


--
-- TOC entry 4860 (class 2620 OID 16849)
-- Name: Subscriptions trial_expiry_trigger; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trial_expiry_trigger AFTER INSERT OR UPDATE ON public."Subscriptions" FOR EACH ROW EXECUTE FUNCTION public.expire_trial_period();


--
-- TOC entry 4861 (class 2620 OID 16851)
-- Name: Watch History viewing_history_trigger; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER viewing_history_trigger BEFORE INSERT ON public."Watch History" FOR EACH ROW EXECUTE FUNCTION public.update_viewing_history();


--
-- TOC entry 4862 (class 2620 OID 16857)
-- Name: WatchLists watchlist_removal_trigger; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER watchlist_removal_trigger AFTER UPDATE ON public."WatchLists" FOR EACH ROW WHEN (((new.viewing_status)::text = 'complete'::text)) EXECUTE FUNCTION public.remove_from_watchlist();


--
-- TOC entry 4849 (class 2606 OID 16722)
-- Name: Subtitles media; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Subtitles"
    ADD CONSTRAINT media FOREIGN KEY (media_id) REFERENCES public."Media"(media_id) NOT VALID;


--
-- TOC entry 4853 (class 2606 OID 16747)
-- Name: Watch History media; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Watch History"
    ADD CONSTRAINT media FOREIGN KEY (media_id) REFERENCES public."Media"(media_id) NOT VALID;


--
-- TOC entry 4855 (class 2606 OID 16757)
-- Name: WatchLists media; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."WatchLists"
    ADD CONSTRAINT media FOREIGN KEY (media_id) REFERENCES public."Media"(media_id) NOT VALID;


--
-- TOC entry 4851 (class 2606 OID 16732)
-- Name: Genre preferences; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Genre"
    ADD CONSTRAINT preferences FOREIGN KEY (preferences_id) REFERENCES public."Preferences"(preferences_id) NOT VALID;


--
-- TOC entry 4852 (class 2606 OID 16737)
-- Name: Viewing Classification preferences; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Viewing Classification"
    ADD CONSTRAINT preferences FOREIGN KEY (preferences_id) REFERENCES public."Preferences"(preferences_id) NOT VALID;


--
-- TOC entry 4850 (class 2606 OID 16727)
-- Name: Preferences profile; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Preferences"
    ADD CONSTRAINT profile FOREIGN KEY (profile_id) REFERENCES public."Profiles"(profile_id) NOT VALID;


--
-- TOC entry 4854 (class 2606 OID 16742)
-- Name: Watch History profile; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Watch History"
    ADD CONSTRAINT profile FOREIGN KEY (profile_id) REFERENCES public."Profiles"(profile_id) NOT VALID;


--
-- TOC entry 4856 (class 2606 OID 16752)
-- Name: WatchLists profile; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."WatchLists"
    ADD CONSTRAINT profile FOREIGN KEY (profile_id) REFERENCES public."Profiles"(profile_id) NOT VALID;


--
-- TOC entry 4844 (class 2606 OID 16697)
-- Name: Users referral; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT referral FOREIGN KEY (referral_id) REFERENCES public."Users"(user_id) NOT VALID;


--
-- TOC entry 4848 (class 2606 OID 16717)
-- Name: Media season; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Media"
    ADD CONSTRAINT season FOREIGN KEY (season_id) REFERENCES public."Seasons"(season_id) NOT VALID;


--
-- TOC entry 4847 (class 2606 OID 16712)
-- Name: Seasons series; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Seasons"
    ADD CONSTRAINT series FOREIGN KEY (series_id) REFERENCES public."Series"(series_id) NOT VALID;


--
-- TOC entry 4845 (class 2606 OID 16702)
-- Name: Profiles user; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Profiles"
    ADD CONSTRAINT "user" FOREIGN KEY (user_id) REFERENCES public."Users"(user_id) NOT VALID;


--
-- TOC entry 4846 (class 2606 OID 16707)
-- Name: Subscriptions user; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Subscriptions"
    ADD CONSTRAINT "user" FOREIGN KEY (user_id) REFERENCES public."Users"(user_id) NOT VALID;


--
-- TOC entry 5060 (class 0 OID 0)
-- Dependencies: 5059
-- Name: DATABASE netflix; Type: ACL; Schema: -; Owner: postgres
--


-- Grants the users connection to the database, but they are not created in this script so this breaks for now. To be updated.
-- GRANT CONNECT ON DATABASE netflix TO juniors_group;
-- GRANT CONNECT ON DATABASE netflix TO mediors_group;
-- GRANT CONNECT ON DATABASE netflix TO seniors_group;


-- Completed on 2025-01-16 16:44:36

--
-- PostgreSQL database dump complete
--

