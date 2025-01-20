--
-- PostgreSQL database dump
--

-- Dumped from database version 17.2
-- Dumped by pg_dump version 17.2

-- Started on 2025-01-20 01:02:57

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
-- TOC entry 264 (class 1255 OID 17558)
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
-- TOC entry 265 (class 1255 OID 17559)
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
-- TOC entry 268 (class 1255 OID 17560)
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
-- TOC entry 283 (class 1255 OID 17561)
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
-- TOC entry 284 (class 1255 OID 17562)
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
-- TOC entry 285 (class 1255 OID 17563)
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
-- TOC entry 281 (class 1255 OID 17564)
-- Name: apply_referral_discount(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.apply_referral_discount() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF NEW.user_id IS NOT NULL THEN
        DECLARE
            referrer_user_id INTEGER;
        BEGIN
            SELECT referral_id INTO referrer_user_id FROM "Users" WHERE user_id = NEW.user_id;

            IF referrer_user_id IS NOT NULL THEN
                PERFORM applydiscount(referrer_user_id, NEW.user_id);
            END IF;
        END;
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.apply_referral_discount() OWNER TO postgres;

--
-- TOC entry 288 (class 1255 OID 17565)
-- Name: applydiscount(integer, integer); Type: PROCEDURE; Schema: public; Owner: postgres
--

CREATE PROCEDURE public.applydiscount(IN inviter_id integer, IN invitee_id integer)
    LANGUAGE plpgsql
    AS $$
BEGIN
    UPDATE "Users"
    SET has_discount = true
    WHERE user_id = inviter_id;

    UPDATE "Users"
    SET has_discount = true
    WHERE user_id = invitee_id;
END;
$$;


ALTER PROCEDURE public.applydiscount(IN inviter_id integer, IN invitee_id integer) OWNER TO postgres;

--
-- TOC entry 286 (class 1255 OID 17566)
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
-- TOC entry 289 (class 1255 OID 17567)
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
-- TOC entry 290 (class 1255 OID 17568)
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
-- TOC entry 266 (class 1255 OID 17569)
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
-- TOC entry 267 (class 1255 OID 17570)
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
-- TOC entry 287 (class 1255 OID 17571)
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
-- TOC entry 269 (class 1255 OID 17572)
-- Name: updatesubscription(integer, text); Type: PROCEDURE; Schema: public; Owner: postgres
--

CREATE PROCEDURE public.updatesubscription(IN user_id integer, IN new_plan text)
    LANGUAGE plpgsql
    AS $$
DECLARE
    current_date DATE := NOW();
    user_subscription RECORD;
BEGIN
    SELECT * INTO user_subscription FROM "Subscriptions" WHERE user_id = user_id AND end_date > current_date LIMIT 1;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'User does not have an active subscription.';
    END IF;

    UPDATE "Subscriptions"
    SET type = new_plan
    WHERE user_id = user_id;

    UPDATE "Subscriptions"
    SET start_date = current_date, end_date = current_date + INTERVAL '30 days'
    WHERE user_id = user_id;
END;
$$;


ALTER PROCEDURE public.updatesubscription(IN user_id integer, IN new_plan text) OWNER TO postgres;

--
-- TOC entry 270 (class 1255 OID 17573)
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
-- TOC entry 217 (class 1259 OID 17574)
-- Name: Genre; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Genre" (
    genre_id integer NOT NULL,
    title character varying(255)
);


ALTER TABLE public."Genre" OWNER TO postgres;

--
-- TOC entry 218 (class 1259 OID 17577)
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
-- TOC entry 5067 (class 0 OID 0)
-- Dependencies: 218
-- Name: Genre_genre_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Genre_genre_id_seq" OWNED BY public."Genre".genre_id;


--
-- TOC entry 219 (class 1259 OID 17579)
-- Name: Media; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Media" (
    media_id integer NOT NULL,
    season_id integer NOT NULL,
    episode_number integer DEFAULT 1,
    title character varying(255),
    duration time without time zone,
    release_date timestamp without time zone
);


ALTER TABLE public."Media" OWNER TO postgres;

--
-- TOC entry 220 (class 1259 OID 17583)
-- Name: MediaGenres_Junction; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."MediaGenres_Junction" (
    media_id integer NOT NULL,
    genre_id integer NOT NULL
);


ALTER TABLE public."MediaGenres_Junction" OWNER TO postgres;

--
-- TOC entry 221 (class 1259 OID 17586)
-- Name: MediaQualities_Junction; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."MediaQualities_Junction" (
    media_id integer NOT NULL,
    quality_id integer NOT NULL
);


ALTER TABLE public."MediaQualities_Junction" OWNER TO postgres;

--
-- TOC entry 222 (class 1259 OID 17589)
-- Name: MediaVClassification_Junction; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."MediaVClassification_Junction" (
    media_id integer NOT NULL,
    vc_id integer NOT NULL
);


ALTER TABLE public."MediaVClassification_Junction" OWNER TO postgres;

--
-- TOC entry 223 (class 1259 OID 17592)
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
-- TOC entry 5073 (class 0 OID 0)
-- Dependencies: 223
-- Name: Media_media_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Media_media_id_seq" OWNED BY public."Media".media_id;


--
-- TOC entry 224 (class 1259 OID 17593)
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
-- TOC entry 5075 (class 0 OID 0)
-- Dependencies: 224
-- Name: Media_season_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Media_season_id_seq" OWNED BY public."Media".season_id;


--
-- TOC entry 225 (class 1259 OID 17594)
-- Name: ProfileGenres_Junction; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."ProfileGenres_Junction" (
    profile_id integer NOT NULL,
    genre_id integer NOT NULL
);


ALTER TABLE public."ProfileGenres_Junction" OWNER TO postgres;

--
-- TOC entry 226 (class 1259 OID 17597)
-- Name: ProfileVClassification_Junction; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."ProfileVClassification_Junction" (
    profile_id integer NOT NULL,
    vc_id integer NOT NULL
);


ALTER TABLE public."ProfileVClassification_Junction" OWNER TO postgres;

--
-- TOC entry 227 (class 1259 OID 17600)
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
    language character varying
);


ALTER TABLE public."Profiles" OWNER TO postgres;

--
-- TOC entry 228 (class 1259 OID 17607)
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
-- TOC entry 5080 (class 0 OID 0)
-- Dependencies: 228
-- Name: Profiles_profile_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Profiles_profile_id_seq" OWNED BY public."Profiles".profile_id;


--
-- TOC entry 229 (class 1259 OID 17608)
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
-- TOC entry 5082 (class 0 OID 0)
-- Dependencies: 229
-- Name: Profiles_user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Profiles_user_id_seq" OWNED BY public."Profiles".user_id;


--
-- TOC entry 230 (class 1259 OID 17609)
-- Name: Qualities; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Qualities" (
    quality_id integer NOT NULL,
    type "char" NOT NULL
);


ALTER TABLE public."Qualities" OWNER TO postgres;

--
-- TOC entry 231 (class 1259 OID 17612)
-- Name: Qualities_quality_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Qualities_quality_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Qualities_quality_id_seq" OWNER TO postgres;

--
-- TOC entry 5085 (class 0 OID 0)
-- Dependencies: 231
-- Name: Qualities_quality_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Qualities_quality_id_seq" OWNED BY public."Qualities".quality_id;


--
-- TOC entry 232 (class 1259 OID 17613)
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
-- TOC entry 233 (class 1259 OID 17617)
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
-- TOC entry 5088 (class 0 OID 0)
-- Dependencies: 233
-- Name: Seasons_season_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Seasons_season_id_seq" OWNED BY public."Seasons".season_id;


--
-- TOC entry 234 (class 1259 OID 17618)
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
-- TOC entry 5090 (class 0 OID 0)
-- Dependencies: 234
-- Name: Seasons_series_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Seasons_series_id_seq" OWNED BY public."Seasons".series_id;


--
-- TOC entry 235 (class 1259 OID 17619)
-- Name: Series; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Series" (
    series_id integer NOT NULL,
    title character varying(255),
    age_restriction integer DEFAULT 0,
    start_date timestamp without time zone
);


ALTER TABLE public."Series" OWNER TO postgres;

--
-- TOC entry 236 (class 1259 OID 17623)
-- Name: SeriesGenres_Junction; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."SeriesGenres_Junction" (
    series_id integer NOT NULL,
    genre_id integer NOT NULL
);


ALTER TABLE public."SeriesGenres_Junction" OWNER TO postgres;

--
-- TOC entry 237 (class 1259 OID 17626)
-- Name: SeriesVClassification_Junction; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."SeriesVClassification_Junction" (
    series_id integer NOT NULL,
    vc_id integer NOT NULL
);


ALTER TABLE public."SeriesVClassification_Junction" OWNER TO postgres;

--
-- TOC entry 238 (class 1259 OID 17629)
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
-- TOC entry 5095 (class 0 OID 0)
-- Dependencies: 238
-- Name: Series_series_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Series_series_id_seq" OWNED BY public."Series".series_id;


--
-- TOC entry 239 (class 1259 OID 17630)
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
-- TOC entry 240 (class 1259 OID 17636)
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
-- TOC entry 5098 (class 0 OID 0)
-- Dependencies: 240
-- Name: Subscriptions_subscription_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Subscriptions_subscription_id_seq" OWNED BY public."Subscriptions".subscription_id;


--
-- TOC entry 241 (class 1259 OID 17637)
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
-- TOC entry 5100 (class 0 OID 0)
-- Dependencies: 241
-- Name: Subscriptions_user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Subscriptions_user_id_seq" OWNED BY public."Subscriptions".user_id;


--
-- TOC entry 242 (class 1259 OID 17638)
-- Name: Subtitles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Subtitles" (
    subtitles_id integer NOT NULL,
    media_id integer NOT NULL
);


ALTER TABLE public."Subtitles" OWNER TO postgres;

--
-- TOC entry 243 (class 1259 OID 17641)
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
-- TOC entry 5103 (class 0 OID 0)
-- Dependencies: 243
-- Name: Subtitles_media_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Subtitles_media_id_seq" OWNED BY public."Subtitles".media_id;


--
-- TOC entry 244 (class 1259 OID 17642)
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
-- TOC entry 5105 (class 0 OID 0)
-- Dependencies: 244
-- Name: Subtitles_subtitles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Subtitles_subtitles_id_seq" OWNED BY public."Subtitles".subtitles_id;


--
-- TOC entry 245 (class 1259 OID 17643)
-- Name: Users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Users" (
    user_id integer NOT NULL,
    email character varying(255) NOT NULL,
    password character varying(255) NOT NULL,
    failed_login_attempts integer DEFAULT 0,
    activation_status character varying,
    locked_until timestamp with time zone,
    referral_id integer NOT NULL,
    referral_code character varying(50),
    has_discount boolean DEFAULT false,
    trial_available boolean DEFAULT true
);


ALTER TABLE public."Users" OWNER TO postgres;

--
-- TOC entry 246 (class 1259 OID 17651)
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
-- TOC entry 5108 (class 0 OID 0)
-- Dependencies: 246
-- Name: Users_referral_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Users_referral_id_seq" OWNED BY public."Users".referral_id;


--
-- TOC entry 247 (class 1259 OID 17652)
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
-- TOC entry 5110 (class 0 OID 0)
-- Dependencies: 247
-- Name: Users_user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Users_user_id_seq" OWNED BY public."Users".user_id;


--
-- TOC entry 248 (class 1259 OID 17653)
-- Name: ViewingClassification; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."ViewingClassification" (
    id integer NOT NULL,
    type "char" NOT NULL
);


ALTER TABLE public."ViewingClassification" OWNER TO postgres;

--
-- TOC entry 249 (class 1259 OID 17656)
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
-- TOC entry 5113 (class 0 OID 0)
-- Dependencies: 249
-- Name: Viewing Classification_viewing_classification_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Viewing Classification_viewing_classification_id_seq" OWNED BY public."ViewingClassification".id;


--
-- TOC entry 250 (class 1259 OID 17657)
-- Name: WatchHistory; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."WatchHistory" (
    history_id integer NOT NULL,
    profile_id integer NOT NULL,
    media_id integer NOT NULL,
    resume_to time without time zone,
    times_watched integer DEFAULT 1,
    time_stamp timestamp without time zone,
    viewing_status character varying(255)
);


ALTER TABLE public."WatchHistory" OWNER TO postgres;

--
-- TOC entry 251 (class 1259 OID 17661)
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
-- TOC entry 5116 (class 0 OID 0)
-- Dependencies: 251
-- Name: Watch History_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Watch History_history_id_seq" OWNED BY public."WatchHistory".history_id;


--
-- TOC entry 252 (class 1259 OID 17662)
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
-- TOC entry 5118 (class 0 OID 0)
-- Dependencies: 252
-- Name: Watch History_media_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Watch History_media_id_seq" OWNED BY public."WatchHistory".media_id;


--
-- TOC entry 253 (class 1259 OID 17663)
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
-- TOC entry 5120 (class 0 OID 0)
-- Dependencies: 253
-- Name: Watch History_profile_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Watch History_profile_id_seq" OWNED BY public."WatchHistory".profile_id;


--
-- TOC entry 254 (class 1259 OID 17664)
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
-- TOC entry 255 (class 1259 OID 17667)
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
-- TOC entry 5123 (class 0 OID 0)
-- Dependencies: 255
-- Name: WatchLists_list_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."WatchLists_list_id_seq" OWNED BY public."WatchLists".list_id;


--
-- TOC entry 256 (class 1259 OID 17668)
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
-- TOC entry 5125 (class 0 OID 0)
-- Dependencies: 256
-- Name: WatchLists_media_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."WatchLists_media_id_seq" OWNED BY public."WatchLists".media_id;


--
-- TOC entry 257 (class 1259 OID 17669)
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
-- TOC entry 5127 (class 0 OID 0)
-- Dependencies: 257
-- Name: WatchLists_profile_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."WatchLists_profile_id_seq" OWNED BY public."WatchLists".profile_id;


--
-- TOC entry 258 (class 1259 OID 17670)
-- Name: media_details; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.media_details AS
 SELECT m.media_id,
    m.season_id,
    m.episode_number,
    m.title AS media_title,
    m.duration AS media_duration,
    m.release_date AS media_release_date,
    s.title AS series_title,
    ss.season_number
   FROM ((public."Media" m
     LEFT JOIN public."Seasons" ss ON ((m.season_id = ss.season_id)))
     LEFT JOIN public."Series" s ON ((ss.series_id = s.series_id)));


ALTER VIEW public.media_details OWNER TO postgres;

--
-- TOC entry 259 (class 1259 OID 17674)
-- Name: series_and_seasons; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.series_and_seasons AS
 SELECT s.series_id,
    s.title AS series_title,
    s.age_restriction,
    s.start_date AS series_start_date,
    ss.season_id,
    ss.season_number,
    ss.release_date AS season_release_date
   FROM (public."Series" s
     LEFT JOIN public."Seasons" ss ON ((s.series_id = ss.series_id)));


ALTER VIEW public.series_and_seasons OWNER TO postgres;

--
-- TOC entry 260 (class 1259 OID 17678)
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
-- TOC entry 261 (class 1259 OID 17683)
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
-- TOC entry 262 (class 1259 OID 17688)
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
   FROM (public."WatchHistory" wh
     LEFT JOIN public."Media" m ON ((wh.media_id = m.media_id)));


ALTER VIEW public.watch_history_details OWNER TO postgres;

--
-- TOC entry 263 (class 1259 OID 17692)
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
-- TOC entry 4774 (class 2604 OID 17696)
-- Name: Genre genre_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Genre" ALTER COLUMN genre_id SET DEFAULT nextval('public."Genre_genre_id_seq"'::regclass);


--
-- TOC entry 4775 (class 2604 OID 17698)
-- Name: Media media_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Media" ALTER COLUMN media_id SET DEFAULT nextval('public."Media_media_id_seq"'::regclass);


--
-- TOC entry 4776 (class 2604 OID 17699)
-- Name: Media season_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Media" ALTER COLUMN season_id SET DEFAULT nextval('public."Media_season_id_seq"'::regclass);


--
-- TOC entry 4778 (class 2604 OID 17700)
-- Name: Profiles profile_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Profiles" ALTER COLUMN profile_id SET DEFAULT nextval('public."Profiles_profile_id_seq"'::regclass);


--
-- TOC entry 4779 (class 2604 OID 17701)
-- Name: Profiles user_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Profiles" ALTER COLUMN user_id SET DEFAULT nextval('public."Profiles_user_id_seq"'::regclass);


--
-- TOC entry 4782 (class 2604 OID 17702)
-- Name: Qualities quality_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Qualities" ALTER COLUMN quality_id SET DEFAULT nextval('public."Qualities_quality_id_seq"'::regclass);


--
-- TOC entry 4783 (class 2604 OID 17703)
-- Name: Seasons season_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Seasons" ALTER COLUMN season_id SET DEFAULT nextval('public."Seasons_season_id_seq"'::regclass);


--
-- TOC entry 4784 (class 2604 OID 17704)
-- Name: Seasons series_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Seasons" ALTER COLUMN series_id SET DEFAULT nextval('public."Seasons_series_id_seq"'::regclass);


--
-- TOC entry 4786 (class 2604 OID 17705)
-- Name: Series series_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Series" ALTER COLUMN series_id SET DEFAULT nextval('public."Series_series_id_seq"'::regclass);


--
-- TOC entry 4788 (class 2604 OID 17706)
-- Name: Subscriptions subscription_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Subscriptions" ALTER COLUMN subscription_id SET DEFAULT nextval('public."Subscriptions_subscription_id_seq"'::regclass);


--
-- TOC entry 4789 (class 2604 OID 17707)
-- Name: Subscriptions user_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Subscriptions" ALTER COLUMN user_id SET DEFAULT nextval('public."Subscriptions_user_id_seq"'::regclass);


--
-- TOC entry 4791 (class 2604 OID 17708)
-- Name: Subtitles subtitles_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Subtitles" ALTER COLUMN subtitles_id SET DEFAULT nextval('public."Subtitles_subtitles_id_seq"'::regclass);


--
-- TOC entry 4792 (class 2604 OID 17709)
-- Name: Subtitles media_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Subtitles" ALTER COLUMN media_id SET DEFAULT nextval('public."Subtitles_media_id_seq"'::regclass);


--
-- TOC entry 4793 (class 2604 OID 17710)
-- Name: Users user_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users" ALTER COLUMN user_id SET DEFAULT nextval('public."Users_user_id_seq"'::regclass);


--
-- TOC entry 4795 (class 2604 OID 17711)
-- Name: Users referral_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users" ALTER COLUMN referral_id SET DEFAULT nextval('public."Users_referral_id_seq"'::regclass);


--
-- TOC entry 4798 (class 2604 OID 17712)
-- Name: ViewingClassification id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ViewingClassification" ALTER COLUMN id SET DEFAULT nextval('public."Viewing Classification_viewing_classification_id_seq"'::regclass);


--
-- TOC entry 4799 (class 2604 OID 17713)
-- Name: WatchHistory history_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."WatchHistory" ALTER COLUMN history_id SET DEFAULT nextval('public."Watch History_history_id_seq"'::regclass);


--
-- TOC entry 4800 (class 2604 OID 17714)
-- Name: WatchHistory profile_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."WatchHistory" ALTER COLUMN profile_id SET DEFAULT nextval('public."Watch History_profile_id_seq"'::regclass);


--
-- TOC entry 4801 (class 2604 OID 17715)
-- Name: WatchHistory media_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."WatchHistory" ALTER COLUMN media_id SET DEFAULT nextval('public."Watch History_media_id_seq"'::regclass);


--
-- TOC entry 4803 (class 2604 OID 17716)
-- Name: WatchLists list_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."WatchLists" ALTER COLUMN list_id SET DEFAULT nextval('public."WatchLists_list_id_seq"'::regclass);


--
-- TOC entry 4804 (class 2604 OID 17717)
-- Name: WatchLists profile_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."WatchLists" ALTER COLUMN profile_id SET DEFAULT nextval('public."WatchLists_profile_id_seq"'::regclass);


--
-- TOC entry 4805 (class 2604 OID 17718)
-- Name: WatchLists media_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."WatchLists" ALTER COLUMN media_id SET DEFAULT nextval('public."WatchLists_media_id_seq"'::regclass);


--
-- TOC entry 5014 (class 0 OID 17574)
-- Dependencies: 217
-- Data for Name: Genre; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Genre" (genre_id, title) FROM stdin;
\.


--
-- TOC entry 5016 (class 0 OID 17579)
-- Dependencies: 219
-- Data for Name: Media; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Media" (media_id, season_id, episode_number, title, duration, release_date) FROM stdin;
\.


--
-- TOC entry 5017 (class 0 OID 17583)
-- Dependencies: 220
-- Data for Name: MediaGenres_Junction; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."MediaGenres_Junction" (media_id, genre_id) FROM stdin;
\.


--
-- TOC entry 5018 (class 0 OID 17586)
-- Dependencies: 221
-- Data for Name: MediaQualities_Junction; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."MediaQualities_Junction" (media_id, quality_id) FROM stdin;
\.


--
-- TOC entry 5019 (class 0 OID 17589)
-- Dependencies: 222
-- Data for Name: MediaVClassification_Junction; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."MediaVClassification_Junction" (media_id, vc_id) FROM stdin;
\.


--
-- TOC entry 5022 (class 0 OID 17594)
-- Dependencies: 225
-- Data for Name: ProfileGenres_Junction; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."ProfileGenres_Junction" (profile_id, genre_id) FROM stdin;
\.


--
-- TOC entry 5023 (class 0 OID 17597)
-- Dependencies: 226
-- Data for Name: ProfileVClassification_Junction; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."ProfileVClassification_Junction" (profile_id, vc_id) FROM stdin;
\.


--
-- TOC entry 5024 (class 0 OID 17600)
-- Dependencies: 227
-- Data for Name: Profiles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Profiles" (profile_id, user_id, age, name, photo_path, child_profile, date_of_birth, language) FROM stdin;
\.


--
-- TOC entry 5027 (class 0 OID 17609)
-- Dependencies: 230
-- Data for Name: Qualities; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Qualities" (quality_id, type) FROM stdin;
\.


--
-- TOC entry 5029 (class 0 OID 17613)
-- Dependencies: 232
-- Data for Name: Seasons; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Seasons" (season_id, series_id, season_number, release_date) FROM stdin;
\.


--
-- TOC entry 5032 (class 0 OID 17619)
-- Dependencies: 235
-- Data for Name: Series; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Series" (series_id, title, age_restriction, start_date) FROM stdin;
\.


--
-- TOC entry 5033 (class 0 OID 17623)
-- Dependencies: 236
-- Data for Name: SeriesGenres_Junction; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."SeriesGenres_Junction" (series_id, genre_id) FROM stdin;
\.


--
-- TOC entry 5034 (class 0 OID 17626)
-- Dependencies: 237
-- Data for Name: SeriesVClassification_Junction; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."SeriesVClassification_Junction" (series_id, vc_id) FROM stdin;
\.


--
-- TOC entry 5036 (class 0 OID 17630)
-- Dependencies: 239
-- Data for Name: Subscriptions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Subscriptions" (subscription_id, user_id, price, type, description, start_date, end_date) FROM stdin;
\.


--
-- TOC entry 5039 (class 0 OID 17638)
-- Dependencies: 242
-- Data for Name: Subtitles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Subtitles" (subtitles_id, media_id) FROM stdin;
\.


--
-- TOC entry 5042 (class 0 OID 17643)
-- Dependencies: 245
-- Data for Name: Users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Users" (user_id, email, password, failed_login_attempts, activation_status, locked_until, referral_id, referral_code, has_discount, trial_available) FROM stdin;
4	test@123.com	$2b$10$K1PC9dIC9S4lQ55ChPcYEOR25vTSCQrI6sCUWfrGZ9N8.3zzZ/YxO	0	not_activated	\N	4	\N	t	t
5	tes2t@123.com	$2b$10$R7gGzRbkVzSuIg7R54WaXefwBCmyio.Yc1QD2QXb1JHe8OHGGiYw2	0	not_activated	\N	5	\N	t	t
6	tes22t@123.com	$2b$10$lEcpJx66SiWrXvncIUHLze.wv/eBPjql09LHkz3OKV69sDREBhUtS	0	not_activated	\N	6	\N	t	t
7	tes322t@123.com	$2b$10$qw/r/CcGihUPUqVgBnXd0u9mrFHec.vkjq052Go64s0GSanhnm8BC	0	not_activated	\N	7	\N	t	t
\.


--
-- TOC entry 5045 (class 0 OID 17653)
-- Dependencies: 248
-- Data for Name: ViewingClassification; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."ViewingClassification" (id, type) FROM stdin;
\.


--
-- TOC entry 5047 (class 0 OID 17657)
-- Dependencies: 250
-- Data for Name: WatchHistory; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."WatchHistory" (history_id, profile_id, media_id, resume_to, times_watched, time_stamp, viewing_status) FROM stdin;
\.


--
-- TOC entry 5051 (class 0 OID 17664)
-- Dependencies: 254
-- Data for Name: WatchLists; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."WatchLists" (list_id, profile_id, media_id, viewing_status) FROM stdin;
\.


--
-- TOC entry 5135 (class 0 OID 0)
-- Dependencies: 218
-- Name: Genre_genre_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Genre_genre_id_seq"', 1, false);


--
-- TOC entry 5136 (class 0 OID 0)
-- Dependencies: 223
-- Name: Media_media_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Media_media_id_seq"', 1, false);


--
-- TOC entry 5137 (class 0 OID 0)
-- Dependencies: 224
-- Name: Media_season_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Media_season_id_seq"', 1, false);


--
-- TOC entry 5138 (class 0 OID 0)
-- Dependencies: 228
-- Name: Profiles_profile_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Profiles_profile_id_seq"', 1, false);


--
-- TOC entry 5139 (class 0 OID 0)
-- Dependencies: 229
-- Name: Profiles_user_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Profiles_user_id_seq"', 1, false);


--
-- TOC entry 5140 (class 0 OID 0)
-- Dependencies: 231
-- Name: Qualities_quality_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Qualities_quality_id_seq"', 1, false);


--
-- TOC entry 5141 (class 0 OID 0)
-- Dependencies: 233
-- Name: Seasons_season_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Seasons_season_id_seq"', 1, false);


--
-- TOC entry 5142 (class 0 OID 0)
-- Dependencies: 234
-- Name: Seasons_series_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Seasons_series_id_seq"', 1, false);


--
-- TOC entry 5143 (class 0 OID 0)
-- Dependencies: 238
-- Name: Series_series_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Series_series_id_seq"', 1, false);


--
-- TOC entry 5144 (class 0 OID 0)
-- Dependencies: 240
-- Name: Subscriptions_subscription_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Subscriptions_subscription_id_seq"', 1, false);


--
-- TOC entry 5145 (class 0 OID 0)
-- Dependencies: 241
-- Name: Subscriptions_user_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Subscriptions_user_id_seq"', 1, false);


--
-- TOC entry 5146 (class 0 OID 0)
-- Dependencies: 243
-- Name: Subtitles_media_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Subtitles_media_id_seq"', 1, false);


--
-- TOC entry 5147 (class 0 OID 0)
-- Dependencies: 244
-- Name: Subtitles_subtitles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Subtitles_subtitles_id_seq"', 1, false);


--
-- TOC entry 5148 (class 0 OID 0)
-- Dependencies: 246
-- Name: Users_referral_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Users_referral_id_seq"', 7, true);


--
-- TOC entry 5149 (class 0 OID 0)
-- Dependencies: 247
-- Name: Users_user_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Users_user_id_seq"', 7, true);


--
-- TOC entry 5150 (class 0 OID 0)
-- Dependencies: 249
-- Name: Viewing Classification_viewing_classification_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Viewing Classification_viewing_classification_id_seq"', 1, false);


--
-- TOC entry 5151 (class 0 OID 0)
-- Dependencies: 251
-- Name: Watch History_history_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Watch History_history_id_seq"', 1, false);


--
-- TOC entry 5152 (class 0 OID 0)
-- Dependencies: 252
-- Name: Watch History_media_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Watch History_media_id_seq"', 1, false);


--
-- TOC entry 5153 (class 0 OID 0)
-- Dependencies: 253
-- Name: Watch History_profile_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Watch History_profile_id_seq"', 1, false);


--
-- TOC entry 5154 (class 0 OID 0)
-- Dependencies: 255
-- Name: WatchLists_list_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."WatchLists_list_id_seq"', 1, false);


--
-- TOC entry 5155 (class 0 OID 0)
-- Dependencies: 256
-- Name: WatchLists_media_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."WatchLists_media_id_seq"', 1, false);


--
-- TOC entry 5156 (class 0 OID 0)
-- Dependencies: 257
-- Name: WatchLists_profile_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."WatchLists_profile_id_seq"', 1, false);


--
-- TOC entry 4807 (class 2606 OID 17720)
-- Name: Genre Genre_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Genre"
    ADD CONSTRAINT "Genre_pkey" PRIMARY KEY (genre_id);


--
-- TOC entry 4811 (class 2606 OID 17722)
-- Name: Profiles Profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Profiles"
    ADD CONSTRAINT "Profiles_pkey" PRIMARY KEY (profile_id);


--
-- TOC entry 4813 (class 2606 OID 17724)
-- Name: Qualities Qualities_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Qualities"
    ADD CONSTRAINT "Qualities_pkey" PRIMARY KEY (quality_id);


--
-- TOC entry 4815 (class 2606 OID 17726)
-- Name: Seasons Seasons_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Seasons"
    ADD CONSTRAINT "Seasons_pkey" PRIMARY KEY (season_id);


--
-- TOC entry 4817 (class 2606 OID 17728)
-- Name: Series Series_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Series"
    ADD CONSTRAINT "Series_pkey" PRIMARY KEY (series_id);


--
-- TOC entry 4819 (class 2606 OID 17730)
-- Name: Subscriptions Subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Subscriptions"
    ADD CONSTRAINT "Subscriptions_pkey" PRIMARY KEY (subscription_id);


--
-- TOC entry 4821 (class 2606 OID 17732)
-- Name: Subtitles Subtitles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Subtitles"
    ADD CONSTRAINT "Subtitles_pkey" PRIMARY KEY (subtitles_id);


--
-- TOC entry 4827 (class 2606 OID 17734)
-- Name: ViewingClassification Viewing Classification_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ViewingClassification"
    ADD CONSTRAINT "Viewing Classification_pkey" PRIMARY KEY (id);


--
-- TOC entry 4829 (class 2606 OID 17736)
-- Name: WatchHistory Watch History_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."WatchHistory"
    ADD CONSTRAINT "Watch History_pkey" PRIMARY KEY (history_id);


--
-- TOC entry 4831 (class 2606 OID 17738)
-- Name: WatchLists WatchLists_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."WatchLists"
    ADD CONSTRAINT "WatchLists_pkey" PRIMARY KEY (list_id);


--
-- TOC entry 4823 (class 2606 OID 17740)
-- Name: Users email; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT email UNIQUE (email);


--
-- TOC entry 4809 (class 2606 OID 17742)
-- Name: Media media; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Media"
    ADD CONSTRAINT media PRIMARY KEY (media_id);


--
-- TOC entry 4825 (class 2606 OID 17744)
-- Name: Users user; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "user" PRIMARY KEY (user_id);


--
-- TOC entry 4857 (class 2620 OID 17872)
-- Name: Subscriptions apply_referral_discount_trigger; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER apply_referral_discount_trigger AFTER UPDATE ON public."Subscriptions" FOR EACH ROW EXECUTE FUNCTION public.apply_referral_discount();


--
-- TOC entry 4859 (class 2620 OID 17745)
-- Name: Users failed_login_trigger; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER failed_login_trigger BEFORE UPDATE ON public."Users" FOR EACH ROW WHEN (((old.failed_login_attempts < 3) AND (new.failed_login_attempts >= 3))) EXECUTE FUNCTION public.lock_user_account();


--
-- TOC entry 4856 (class 2620 OID 17746)
-- Name: Profiles profile_age_validation_trigger; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER profile_age_validation_trigger BEFORE INSERT OR UPDATE ON public."Profiles" FOR EACH ROW EXECUTE FUNCTION public.validate_profile_age();


--
-- TOC entry 4860 (class 2620 OID 17747)
-- Name: Users referral_discount_trigger; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER referral_discount_trigger AFTER INSERT ON public."Users" FOR EACH ROW EXECUTE FUNCTION public.apply_referral_discount();


--
-- TOC entry 4858 (class 2620 OID 17748)
-- Name: Subscriptions trial_expiry_trigger; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trial_expiry_trigger AFTER INSERT OR UPDATE ON public."Subscriptions" FOR EACH ROW EXECUTE FUNCTION public.expire_trial_period();


--
-- TOC entry 4861 (class 2620 OID 17749)
-- Name: WatchHistory viewing_history_trigger; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER viewing_history_trigger BEFORE INSERT ON public."WatchHistory" FOR EACH ROW EXECUTE FUNCTION public.update_viewing_history();


--
-- TOC entry 4862 (class 2620 OID 17750)
-- Name: WatchLists watchlist_removal_trigger; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER watchlist_removal_trigger AFTER UPDATE ON public."WatchLists" FOR EACH ROW WHEN (((new.viewing_status)::text = 'complete'::text)) EXECUTE FUNCTION public.remove_from_watchlist();


--
-- TOC entry 4833 (class 2606 OID 17751)
-- Name: MediaGenres_Junction MediaGenres_Junction_genre_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."MediaGenres_Junction"
    ADD CONSTRAINT "MediaGenres_Junction_genre_id_fkey" FOREIGN KEY (genre_id) REFERENCES public."Genre"(genre_id);


--
-- TOC entry 4834 (class 2606 OID 17756)
-- Name: MediaGenres_Junction MediaGenres_Junction_media_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."MediaGenres_Junction"
    ADD CONSTRAINT "MediaGenres_Junction_media_id_fkey" FOREIGN KEY (media_id) REFERENCES public."Media"(media_id);


--
-- TOC entry 4835 (class 2606 OID 17761)
-- Name: MediaQualities_Junction MediaQualities_Junction_media_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."MediaQualities_Junction"
    ADD CONSTRAINT "MediaQualities_Junction_media_id_fkey" FOREIGN KEY (media_id) REFERENCES public."Media"(media_id);


--
-- TOC entry 4836 (class 2606 OID 17766)
-- Name: MediaQualities_Junction MediaQualities_Junction_quality_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."MediaQualities_Junction"
    ADD CONSTRAINT "MediaQualities_Junction_quality_id_fkey" FOREIGN KEY (quality_id) REFERENCES public."Qualities"(quality_id);


--
-- TOC entry 4837 (class 2606 OID 17771)
-- Name: MediaVClassification_Junction MediaVClassification_Junction_media_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."MediaVClassification_Junction"
    ADD CONSTRAINT "MediaVClassification_Junction_media_id_fkey" FOREIGN KEY (media_id) REFERENCES public."Media"(media_id);


--
-- TOC entry 4838 (class 2606 OID 17776)
-- Name: MediaVClassification_Junction MediaVClassification_Junction_vc_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."MediaVClassification_Junction"
    ADD CONSTRAINT "MediaVClassification_Junction_vc_id_fkey" FOREIGN KEY (vc_id) REFERENCES public."ViewingClassification"(id);


--
-- TOC entry 4839 (class 2606 OID 17781)
-- Name: ProfileGenres_Junction ProfileGenres_Junction_genre_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ProfileGenres_Junction"
    ADD CONSTRAINT "ProfileGenres_Junction_genre_id_fkey" FOREIGN KEY (genre_id) REFERENCES public."Genre"(genre_id);


--
-- TOC entry 4840 (class 2606 OID 17786)
-- Name: ProfileGenres_Junction ProfileGenres_Junction_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ProfileGenres_Junction"
    ADD CONSTRAINT "ProfileGenres_Junction_profile_id_fkey" FOREIGN KEY (profile_id) REFERENCES public."Profiles"(profile_id);


--
-- TOC entry 4841 (class 2606 OID 17791)
-- Name: ProfileVClassification_Junction ProfileVClassification_Junction_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ProfileVClassification_Junction"
    ADD CONSTRAINT "ProfileVClassification_Junction_profile_id_fkey" FOREIGN KEY (profile_id) REFERENCES public."Profiles"(profile_id);


--
-- TOC entry 4842 (class 2606 OID 17796)
-- Name: ProfileVClassification_Junction ProfileVClassification_Junction_vc_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ProfileVClassification_Junction"
    ADD CONSTRAINT "ProfileVClassification_Junction_vc_id_fkey" FOREIGN KEY (vc_id) REFERENCES public."ViewingClassification"(id);


--
-- TOC entry 4845 (class 2606 OID 17801)
-- Name: SeriesGenres_Junction SeriesGenres_Junction_genre_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SeriesGenres_Junction"
    ADD CONSTRAINT "SeriesGenres_Junction_genre_id_fkey" FOREIGN KEY (genre_id) REFERENCES public."Genre"(genre_id);


--
-- TOC entry 4846 (class 2606 OID 17806)
-- Name: SeriesGenres_Junction SeriesGenres_Junction_series_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SeriesGenres_Junction"
    ADD CONSTRAINT "SeriesGenres_Junction_series_id_fkey" FOREIGN KEY (series_id) REFERENCES public."Series"(series_id);


--
-- TOC entry 4847 (class 2606 OID 17811)
-- Name: SeriesVClassification_Junction SeriesVClassification_Junction_series_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SeriesVClassification_Junction"
    ADD CONSTRAINT "SeriesVClassification_Junction_series_id_fkey" FOREIGN KEY (series_id) REFERENCES public."Series"(series_id);


--
-- TOC entry 4848 (class 2606 OID 17816)
-- Name: SeriesVClassification_Junction SeriesVClassification_Junction_vc_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SeriesVClassification_Junction"
    ADD CONSTRAINT "SeriesVClassification_Junction_vc_id_fkey" FOREIGN KEY (vc_id) REFERENCES public."ViewingClassification"(id);


--
-- TOC entry 4852 (class 2606 OID 17826)
-- Name: WatchHistory media; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."WatchHistory"
    ADD CONSTRAINT media FOREIGN KEY (media_id) REFERENCES public."Media"(media_id) NOT VALID;


--
-- TOC entry 4854 (class 2606 OID 17831)
-- Name: WatchLists media; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."WatchLists"
    ADD CONSTRAINT media FOREIGN KEY (media_id) REFERENCES public."Media"(media_id) NOT VALID;


--
-- TOC entry 4850 (class 2606 OID 17903)
-- Name: Subtitles media; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Subtitles"
    ADD CONSTRAINT media FOREIGN KEY (media_id) REFERENCES public."Media"(media_id) ON DELETE CASCADE;


--
-- TOC entry 4855 (class 2606 OID 17913)
-- Name: WatchLists profile; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."WatchLists"
    ADD CONSTRAINT profile FOREIGN KEY (profile_id) REFERENCES public."Profiles"(profile_id) ON DELETE CASCADE;


--
-- TOC entry 4853 (class 2606 OID 17918)
-- Name: WatchHistory profile; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."WatchHistory"
    ADD CONSTRAINT profile FOREIGN KEY (profile_id) REFERENCES public."Profiles"(profile_id) ON DELETE CASCADE;


--
-- TOC entry 4851 (class 2606 OID 17846)
-- Name: Users referral; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT referral FOREIGN KEY (referral_id) REFERENCES public."Users"(user_id) NOT VALID;


--
-- TOC entry 4832 (class 2606 OID 17893)
-- Name: Media season; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Media"
    ADD CONSTRAINT season FOREIGN KEY (season_id) REFERENCES public."Seasons"(season_id) ON DELETE CASCADE;


--
-- TOC entry 4844 (class 2606 OID 17898)
-- Name: Seasons season; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Seasons"
    ADD CONSTRAINT season FOREIGN KEY (series_id) REFERENCES public."Series"(series_id) ON DELETE CASCADE;


--
-- TOC entry 4849 (class 2606 OID 17866)
-- Name: Subscriptions user; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Subscriptions"
    ADD CONSTRAINT "user" FOREIGN KEY (user_id) REFERENCES public."Users"(user_id) NOT VALID;


--
-- TOC entry 4843 (class 2606 OID 17908)
-- Name: Profiles user; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Profiles"
    ADD CONSTRAINT "user" FOREIGN KEY (user_id) REFERENCES public."Users"(user_id) ON DELETE CASCADE;


--
-- TOC entry 5060 (class 0 OID 0)
-- Dependencies: 281
-- Name: FUNCTION apply_referral_discount(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.apply_referral_discount() TO senior;


--
-- TOC entry 5061 (class 0 OID 0)
-- Dependencies: 289
-- Name: FUNCTION expire_trial_period(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.expire_trial_period() TO senior;


--
-- TOC entry 5062 (class 0 OID 0)
-- Dependencies: 290
-- Name: FUNCTION lock_user_account(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.lock_user_account() TO senior;


--
-- TOC entry 5063 (class 0 OID 0)
-- Dependencies: 266
-- Name: FUNCTION remove_from_watchlist(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.remove_from_watchlist() TO senior;


--
-- TOC entry 5064 (class 0 OID 0)
-- Dependencies: 267
-- Name: FUNCTION update_viewing_history(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.update_viewing_history() TO senior;


--
-- TOC entry 5065 (class 0 OID 0)
-- Dependencies: 270
-- Name: FUNCTION validate_profile_age(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.validate_profile_age() TO senior;


--
-- TOC entry 5066 (class 0 OID 0)
-- Dependencies: 217
-- Name: TABLE "Genre"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public."Genre" TO senior;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public."Genre" TO api;


--
-- TOC entry 5068 (class 0 OID 0)
-- Dependencies: 218
-- Name: SEQUENCE "Genre_genre_id_seq"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public."Genre_genre_id_seq" TO senior;
GRANT SELECT,USAGE ON SEQUENCE public."Genre_genre_id_seq" TO junior;
GRANT SELECT,USAGE ON SEQUENCE public."Genre_genre_id_seq" TO api;


--
-- TOC entry 5069 (class 0 OID 0)
-- Dependencies: 219
-- Name: TABLE "Media"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public."Media" TO senior;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public."Media" TO medior;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public."Media" TO api;


--
-- TOC entry 5070 (class 0 OID 0)
-- Dependencies: 220
-- Name: TABLE "MediaGenres_Junction"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public."MediaGenres_Junction" TO senior;


--
-- TOC entry 5071 (class 0 OID 0)
-- Dependencies: 221
-- Name: TABLE "MediaQualities_Junction"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public."MediaQualities_Junction" TO senior;


--
-- TOC entry 5072 (class 0 OID 0)
-- Dependencies: 222
-- Name: TABLE "MediaVClassification_Junction"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public."MediaVClassification_Junction" TO senior;


--
-- TOC entry 5074 (class 0 OID 0)
-- Dependencies: 223
-- Name: SEQUENCE "Media_media_id_seq"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public."Media_media_id_seq" TO senior;
GRANT SELECT,USAGE ON SEQUENCE public."Media_media_id_seq" TO junior;
GRANT SELECT,USAGE ON SEQUENCE public."Media_media_id_seq" TO api;


--
-- TOC entry 5076 (class 0 OID 0)
-- Dependencies: 224
-- Name: SEQUENCE "Media_season_id_seq"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public."Media_season_id_seq" TO senior;
GRANT SELECT,USAGE ON SEQUENCE public."Media_season_id_seq" TO junior;
GRANT SELECT,USAGE ON SEQUENCE public."Media_season_id_seq" TO api;


--
-- TOC entry 5077 (class 0 OID 0)
-- Dependencies: 225
-- Name: TABLE "ProfileGenres_Junction"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public."ProfileGenres_Junction" TO senior;


--
-- TOC entry 5078 (class 0 OID 0)
-- Dependencies: 226
-- Name: TABLE "ProfileVClassification_Junction"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public."ProfileVClassification_Junction" TO senior;


--
-- TOC entry 5079 (class 0 OID 0)
-- Dependencies: 227
-- Name: TABLE "Profiles"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public."Profiles" TO senior;
GRANT SELECT ON TABLE public."Profiles" TO junior;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public."Profiles" TO api;


--
-- TOC entry 5081 (class 0 OID 0)
-- Dependencies: 228
-- Name: SEQUENCE "Profiles_profile_id_seq"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public."Profiles_profile_id_seq" TO senior;
GRANT SELECT,USAGE ON SEQUENCE public."Profiles_profile_id_seq" TO junior;
GRANT SELECT,USAGE ON SEQUENCE public."Profiles_profile_id_seq" TO api;


--
-- TOC entry 5083 (class 0 OID 0)
-- Dependencies: 229
-- Name: SEQUENCE "Profiles_user_id_seq"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public."Profiles_user_id_seq" TO senior;
GRANT SELECT,USAGE ON SEQUENCE public."Profiles_user_id_seq" TO junior;
GRANT SELECT,USAGE ON SEQUENCE public."Profiles_user_id_seq" TO api;


--
-- TOC entry 5084 (class 0 OID 0)
-- Dependencies: 230
-- Name: TABLE "Qualities"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public."Qualities" TO senior;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public."Qualities" TO api;


--
-- TOC entry 5086 (class 0 OID 0)
-- Dependencies: 231
-- Name: SEQUENCE "Qualities_quality_id_seq"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public."Qualities_quality_id_seq" TO senior;
GRANT SELECT,USAGE ON SEQUENCE public."Qualities_quality_id_seq" TO junior;
GRANT SELECT,USAGE ON SEQUENCE public."Qualities_quality_id_seq" TO api;


--
-- TOC entry 5087 (class 0 OID 0)
-- Dependencies: 232
-- Name: TABLE "Seasons"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public."Seasons" TO senior;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public."Seasons" TO api;


--
-- TOC entry 5089 (class 0 OID 0)
-- Dependencies: 233
-- Name: SEQUENCE "Seasons_season_id_seq"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public."Seasons_season_id_seq" TO senior;
GRANT SELECT,USAGE ON SEQUENCE public."Seasons_season_id_seq" TO junior;
GRANT SELECT,USAGE ON SEQUENCE public."Seasons_season_id_seq" TO api;


--
-- TOC entry 5091 (class 0 OID 0)
-- Dependencies: 234
-- Name: SEQUENCE "Seasons_series_id_seq"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public."Seasons_series_id_seq" TO senior;
GRANT SELECT,USAGE ON SEQUENCE public."Seasons_series_id_seq" TO junior;
GRANT SELECT,USAGE ON SEQUENCE public."Seasons_series_id_seq" TO api;


--
-- TOC entry 5092 (class 0 OID 0)
-- Dependencies: 235
-- Name: TABLE "Series"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public."Series" TO senior;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public."Series" TO api;


--
-- TOC entry 5093 (class 0 OID 0)
-- Dependencies: 236
-- Name: TABLE "SeriesGenres_Junction"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public."SeriesGenres_Junction" TO senior;


--
-- TOC entry 5094 (class 0 OID 0)
-- Dependencies: 237
-- Name: TABLE "SeriesVClassification_Junction"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public."SeriesVClassification_Junction" TO senior;


--
-- TOC entry 5096 (class 0 OID 0)
-- Dependencies: 238
-- Name: SEQUENCE "Series_series_id_seq"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public."Series_series_id_seq" TO senior;
GRANT SELECT,USAGE ON SEQUENCE public."Series_series_id_seq" TO junior;
GRANT SELECT,USAGE ON SEQUENCE public."Series_series_id_seq" TO api;


--
-- TOC entry 5097 (class 0 OID 0)
-- Dependencies: 239
-- Name: TABLE "Subscriptions"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public."Subscriptions" TO senior;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public."Subscriptions" TO medior;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public."Subscriptions" TO api;


--
-- TOC entry 5099 (class 0 OID 0)
-- Dependencies: 240
-- Name: SEQUENCE "Subscriptions_subscription_id_seq"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public."Subscriptions_subscription_id_seq" TO senior;
GRANT SELECT,USAGE ON SEQUENCE public."Subscriptions_subscription_id_seq" TO junior;
GRANT SELECT,USAGE ON SEQUENCE public."Subscriptions_subscription_id_seq" TO api;


--
-- TOC entry 5101 (class 0 OID 0)
-- Dependencies: 241
-- Name: SEQUENCE "Subscriptions_user_id_seq"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public."Subscriptions_user_id_seq" TO senior;
GRANT SELECT,USAGE ON SEQUENCE public."Subscriptions_user_id_seq" TO junior;
GRANT SELECT,USAGE ON SEQUENCE public."Subscriptions_user_id_seq" TO api;


--
-- TOC entry 5102 (class 0 OID 0)
-- Dependencies: 242
-- Name: TABLE "Subtitles"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public."Subtitles" TO senior;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public."Subtitles" TO api;


--
-- TOC entry 5104 (class 0 OID 0)
-- Dependencies: 243
-- Name: SEQUENCE "Subtitles_media_id_seq"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public."Subtitles_media_id_seq" TO senior;
GRANT SELECT,USAGE ON SEQUENCE public."Subtitles_media_id_seq" TO junior;
GRANT SELECT,USAGE ON SEQUENCE public."Subtitles_media_id_seq" TO api;


--
-- TOC entry 5106 (class 0 OID 0)
-- Dependencies: 244
-- Name: SEQUENCE "Subtitles_subtitles_id_seq"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public."Subtitles_subtitles_id_seq" TO senior;
GRANT SELECT,USAGE ON SEQUENCE public."Subtitles_subtitles_id_seq" TO junior;
GRANT SELECT,USAGE ON SEQUENCE public."Subtitles_subtitles_id_seq" TO api;


--
-- TOC entry 5107 (class 0 OID 0)
-- Dependencies: 245
-- Name: TABLE "Users"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public."Users" TO senior;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public."Users" TO medior;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public."Users" TO api;


--
-- TOC entry 5109 (class 0 OID 0)
-- Dependencies: 246
-- Name: SEQUENCE "Users_referral_id_seq"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public."Users_referral_id_seq" TO senior;
GRANT SELECT,USAGE ON SEQUENCE public."Users_referral_id_seq" TO junior;
GRANT SELECT,USAGE ON SEQUENCE public."Users_referral_id_seq" TO api;


--
-- TOC entry 5111 (class 0 OID 0)
-- Dependencies: 247
-- Name: SEQUENCE "Users_user_id_seq"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public."Users_user_id_seq" TO senior;
GRANT SELECT,USAGE ON SEQUENCE public."Users_user_id_seq" TO junior;
GRANT SELECT,USAGE ON SEQUENCE public."Users_user_id_seq" TO api;


--
-- TOC entry 5112 (class 0 OID 0)
-- Dependencies: 248
-- Name: TABLE "ViewingClassification"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public."ViewingClassification" TO senior;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public."ViewingClassification" TO api;


--
-- TOC entry 5114 (class 0 OID 0)
-- Dependencies: 249
-- Name: SEQUENCE "Viewing Classification_viewing_classification_id_seq"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public."Viewing Classification_viewing_classification_id_seq" TO senior;
GRANT SELECT,USAGE ON SEQUENCE public."Viewing Classification_viewing_classification_id_seq" TO junior;
GRANT SELECT,USAGE ON SEQUENCE public."Viewing Classification_viewing_classification_id_seq" TO api;


--
-- TOC entry 5115 (class 0 OID 0)
-- Dependencies: 250
-- Name: TABLE "WatchHistory"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public."WatchHistory" TO senior;
GRANT SELECT ON TABLE public."WatchHistory" TO junior;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public."WatchHistory" TO api;


--
-- TOC entry 5117 (class 0 OID 0)
-- Dependencies: 251
-- Name: SEQUENCE "Watch History_history_id_seq"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public."Watch History_history_id_seq" TO senior;
GRANT SELECT,USAGE ON SEQUENCE public."Watch History_history_id_seq" TO junior;
GRANT SELECT,USAGE ON SEQUENCE public."Watch History_history_id_seq" TO api;


--
-- TOC entry 5119 (class 0 OID 0)
-- Dependencies: 252
-- Name: SEQUENCE "Watch History_media_id_seq"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public."Watch History_media_id_seq" TO senior;
GRANT SELECT,USAGE ON SEQUENCE public."Watch History_media_id_seq" TO junior;
GRANT SELECT,USAGE ON SEQUENCE public."Watch History_media_id_seq" TO api;


--
-- TOC entry 5121 (class 0 OID 0)
-- Dependencies: 253
-- Name: SEQUENCE "Watch History_profile_id_seq"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public."Watch History_profile_id_seq" TO senior;
GRANT SELECT,USAGE ON SEQUENCE public."Watch History_profile_id_seq" TO junior;
GRANT SELECT,USAGE ON SEQUENCE public."Watch History_profile_id_seq" TO api;


--
-- TOC entry 5122 (class 0 OID 0)
-- Dependencies: 254
-- Name: TABLE "WatchLists"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public."WatchLists" TO senior;
GRANT SELECT ON TABLE public."WatchLists" TO junior;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public."WatchLists" TO api;


--
-- TOC entry 5124 (class 0 OID 0)
-- Dependencies: 255
-- Name: SEQUENCE "WatchLists_list_id_seq"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public."WatchLists_list_id_seq" TO senior;
GRANT SELECT,USAGE ON SEQUENCE public."WatchLists_list_id_seq" TO junior;
GRANT SELECT,USAGE ON SEQUENCE public."WatchLists_list_id_seq" TO api;


--
-- TOC entry 5126 (class 0 OID 0)
-- Dependencies: 256
-- Name: SEQUENCE "WatchLists_media_id_seq"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public."WatchLists_media_id_seq" TO senior;
GRANT SELECT,USAGE ON SEQUENCE public."WatchLists_media_id_seq" TO junior;
GRANT SELECT,USAGE ON SEQUENCE public."WatchLists_media_id_seq" TO api;


--
-- TOC entry 5128 (class 0 OID 0)
-- Dependencies: 257
-- Name: SEQUENCE "WatchLists_profile_id_seq"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public."WatchLists_profile_id_seq" TO senior;
GRANT SELECT,USAGE ON SEQUENCE public."WatchLists_profile_id_seq" TO junior;
GRANT SELECT,USAGE ON SEQUENCE public."WatchLists_profile_id_seq" TO api;


--
-- TOC entry 5129 (class 0 OID 0)
-- Dependencies: 258
-- Name: TABLE media_details; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.media_details TO senior;


--
-- TOC entry 5130 (class 0 OID 0)
-- Dependencies: 259
-- Name: TABLE series_and_seasons; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.series_and_seasons TO senior;


--
-- TOC entry 5131 (class 0 OID 0)
-- Dependencies: 260
-- Name: TABLE subscription_referral_stats; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.subscription_referral_stats TO senior;


--
-- TOC entry 5132 (class 0 OID 0)
-- Dependencies: 261
-- Name: TABLE user_details; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.user_details TO senior;


--
-- TOC entry 5133 (class 0 OID 0)
-- Dependencies: 262
-- Name: TABLE watch_history_details; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.watch_history_details TO senior;


--
-- TOC entry 5134 (class 0 OID 0)
-- Dependencies: 263
-- Name: TABLE watch_list_details; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.watch_list_details TO senior;


-- Completed on 2025-01-20 01:02:58

--
-- PostgreSQL database dump complete
--

