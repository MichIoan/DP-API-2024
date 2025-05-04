# Netflix API UML Documentation

## 1. Class Diagram

### Models and Relationships

#### User
- **Attributes**:
  - user_id (PK)
  - email
  - password
  - name
  - role (enum: ADMIN, USER)
  - status (enum: ACTIVE, INACTIVE, SUSPENDED)
  - referral_id (FK to User)
  - created_at
  - updated_at
- **Relationships**:
  - Has many Profile (1:N)
  - Has one Subscription (1:1)
  - Has many ReferredUsers (1:N, self-referential)
  - Belongs to Referrer (N:1, self-referential)
  - Has many RefreshToken (1:N)

#### Profile
- **Attributes**:
  - profile_id (PK)
  - user_id (FK)
  - name
  - age
  - language
  - avatar_url
  - created_at
  - updated_at
- **Relationships**:
  - Belongs to User (N:1)
  - Has many WatchHistory (1:N)
  - Has many WatchList (1:N)

#### Subscription
- **Attributes**:
  - subscription_id (PK)
  - user_id (FK)
  - plan_id
  - start_date
  - end_date
  - status (enum: ACTIVE, CANCELLED, EXPIRED)
  - payment_method
  - created_at
  - updated_at
- **Relationships**:
  - Belongs to User (N:1)

#### RefreshToken
- **Attributes**:
  - token_id (PK)
  - user_id (FK)
  - token
  - expires_at
  - created_at
- **Relationships**:
  - Belongs to User (N:1)

#### Media
- **Attributes**:
  - media_id (PK)
  - title
  - description
  - release_date
  - duration
  - media_type (enum: MOVIE, EPISODE)
  - classification (enum: G, PG, PG13, R, NC17)
  - poster_url
  - backdrop_url
  - season_id (FK, nullable)
  - created_at
  - updated_at
- **Relationships**:
  - Belongs to Season (N:1, optional)
  - Has many Subtitle (1:N)
  - Has many WatchHistory (1:N)
  - Has many WatchList (1:N)
  - Belongs to many Genre (N:M through MediaGenres)

#### Series
- **Attributes**:
  - series_id (PK)
  - title
  - description
  - release_date
  - end_date
  - status (enum: ONGOING, ENDED, CANCELLED)
  - classification (enum: G, PG, PG13, R, NC17)
  - poster_url
  - backdrop_url
  - created_at
  - updated_at
- **Relationships**:
  - Has many Season (1:N)

#### Season
- **Attributes**:
  - season_id (PK)
  - series_id (FK)
  - season_number
  - title
  - release_date
  - episode_count
  - created_at
  - updated_at
- **Relationships**:
  - Belongs to Series (N:1)
  - Has many Media (1:N)

#### Genre
- **Attributes**:
  - genre_id (PK)
  - name
  - description
  - created_at
  - updated_at
- **Relationships**:
  - Belongs to many Media (N:M through MediaGenres)

#### MediaGenres (Junction Table)
- **Attributes**:
  - id (PK)
  - media_id (FK)
  - genre_id (FK)
- **Relationships**:
  - Belongs to Media (N:1)
  - Belongs to Genre (N:1)

#### WatchHistory
- **Attributes**:
  - history_id (PK)
  - profile_id (FK)
  - media_id (FK)
  - progress
  - timestamp
  - created_at
  - updated_at
- **Relationships**:
  - Belongs to Profile (N:1)
  - Belongs to Media (N:1)

#### WatchList
- **Attributes**:
  - watchlist_id (PK)
  - profile_id (FK)
  - media_id (FK)
  - added_date
  - created_at
  - updated_at
- **Relationships**:
  - Belongs to Profile (N:1)
  - Belongs to Media (N:1)

#### Subtitle
- **Attributes**:
  - subtitle_id (PK)
  - media_id (FK)
  - language
  - file_path
  - created_at
  - updated_at
- **Relationships**:
  - Belongs to Media (N:1)

#### ViewingClassification
- **Attributes**:
  - classification_id (PK)
  - code (enum: G, PG, PG13, R, NC17)
  - description
  - min_age
  - created_at
  - updated_at

## 2. API Endpoints

### Authentication Routes
- **POST /auth/register** - Register a new user
  - Request: { email, password, name }
  - Response: { message, user }
- **POST /auth/login** - Login a user
  - Request: { email, password }
  - Response: { token, refreshToken, user }
- **POST /auth/refresh-token** - Refresh access token
  - Request: { refreshToken }
  - Response: { token }
- **POST /auth/logout** - Logout a user (requires authentication)
  - Response: { message }

### User Routes
- **GET /users/account** - Get user account details (requires authentication)
  - Response: { user }
- **PUT /users/account** - Update user account (requires authentication)
  - Request: { name, email, password }
  - Response: { message, user }
- **POST /users/referral** - Apply a referral code (requires authentication)
  - Request: { referralCode }
  - Response: { message, discount }
- **DELETE /users/account** - Delete user account (requires authentication)
  - Response: { message }

### Profile Routes
- **GET /profiles** - Get all profiles for a user (requires authentication)
  - Response: { profiles }
- **GET /profiles/:profileId** - Get a specific profile (requires authentication)
  - Response: { profile }
- **POST /profiles** - Create a new profile (requires authentication)
  - Request: { name, age, language, avatar_url }
  - Response: { message, profile }
- **PUT /profiles/:profileId** - Update a profile (requires authentication)
  - Request: { name, age, language, avatar_url }
  - Response: { message, profile }
- **DELETE /profiles/:profileId** - Delete a profile (requires authentication)
  - Response: { message }

### Media Routes
- **GET /media** - Get all media with optional filtering
  - Query Parameters: page, limit, genre, type, classification
  - Response: { media, pagination }
- **GET /media/:mediaId** - Get a specific media item
  - Response: { media }
- **GET /media/search** - Search for media
  - Query Parameters: q, page, limit
  - Response: { media, pagination }
- **GET /media/recommended** - Get recommended media for a user (requires authentication)
  - Response: { recommendations }

### Movie Routes
- **POST /movies** - Create a new movie (requires admin)
  - Request: { title, description, duration, release_date, classification, poster_url, backdrop_url, genres }
  - Response: { message, movie }
- **PUT /movies/:movieId** - Update a movie (requires admin)
  - Request: { title, description, duration, release_date, classification, poster_url, backdrop_url, genres }
  - Response: { message, movie }
- **DELETE /movies/:movieId** - Delete a movie (requires admin)
  - Response: { message }
- **GET /movies/popular** - Get popular movies
  - Query Parameters: limit
  - Response: { movies }

### Series Routes
- **POST /series** - Create a new series (requires admin)
  - Request: { title, description, release_date, end_date, status, classification, poster_url, backdrop_url }
  - Response: { message, series }
- **GET /series** - Get all series with optional filtering
  - Query Parameters: page, limit, genre, classification
  - Response: { series, pagination }
- **GET /series/:seriesId** - Get a specific series
  - Response: { series }
- **PUT /series/:seriesId** - Update a series (requires admin)
  - Request: { title, description, release_date, end_date, status, classification, poster_url, backdrop_url }
  - Response: { message, series }
- **DELETE /series/:seriesId** - Delete a series (requires admin)
  - Response: { message }
- **POST /series/:seriesId/seasons** - Add a season to a series (requires admin)
  - Request: { season_number, title, release_date }
  - Response: { message, season }
- **POST /series/:seriesId/seasons/:seasonId/episodes** - Add an episode to a season (requires admin)
  - Request: { episode_number, title, duration, description }
  - Response: { message, episode }

### Subscription Routes
- **GET /subscriptions** - Get all subscription plans
  - Response: { subscriptions }
- **GET /subscriptions/user** - Get user's subscription (requires authentication)
  - Response: { subscription }
- **POST /subscriptions** - Create a subscription (requires authentication)
  - Request: { plan_id, payment_method }
  - Response: { message, subscription }
- **PUT /subscriptions** - Update a subscription (requires authentication)
  - Request: { plan_id }
  - Response: { message, subscription }
- **POST /subscriptions/cancel** - Cancel a subscription (requires authentication)
  - Response: { message, subscription }

### Watch History Routes
- **GET /watch-history/:profileId** - Get watch history for a profile (requires authentication)
  - Query Parameters: limit
  - Response: { history }
- **POST /watch-history** - Mark media as watched (requires authentication)
  - Request: { profileId, mediaId, progress }
  - Response: { message, history }
- **DELETE /watch-history/:historyId** - Remove item from watch history (requires authentication)
  - Response: { message }

### Watch List Routes
- **GET /watch-list/:profileId** - Get watch list for a profile (requires authentication)
  - Query Parameters: limit
  - Response: { watchList }
- **POST /watch-list** - Add media to watch list (requires authentication)
  - Request: { profileId, mediaId }
  - Response: { message, watchListItem }
- **DELETE /watch-list/:watchListId** - Remove item from watch list (requires authentication)
  - Response: { message }

### Subtitles Routes
- **GET /subtitles/media/:mediaId** - Get subtitles for a media item
  - Response: { subtitles }
- **POST /subtitles** - Create subtitles (requires admin)
  - Request: { media_id, language, file_path }
  - Response: { message, subtitles }
- **PUT /subtitles/:subtitleId** - Update subtitles (requires admin)
  - Request: { language, file_path }
  - Response: { message, subtitles }
- **DELETE /subtitles/:subtitleId** - Delete subtitles (requires admin)
  - Response: { message }

## 3. Middleware

### Authentication Middleware
- **isLoggedIn** - Verifies JWT token and adds userId to request
- **roleAuth** - Checks if user has required role (e.g., ADMIN)

### Validation Middleware
- **validate** - Validates request body/params against Joi schemas

## 4. Services

### User Service
- registerUser(userData)
- getUserById(userId)
- updateUser(userId, userData)
- deleteUser(userId)
- applyReferralCode(userId, referralCode)

### Auth Service
- login(email, password)
- refreshToken(refreshToken)
- logout(userId, token)

### Media Service
- getAllMedia(options)
- getMediaById(mediaId)
- searchMedia(options)
- getRecommendedMedia(userId)
- createMovie(movieData)
- updateMovie(movieId, movieData)
- deleteMovie(movieId)
- getPopularMovies(limit)

### Series Service
- createSeries(seriesData)
- getAllSeries(options)
- getSeriesById(seriesId)
- updateSeries(seriesId, seriesData)
- deleteSeries(seriesId)
- addSeason(seriesId, seasonData)
- addEpisode(seriesId, seasonId, episodeData)

### Profile Service
- getUserProfiles(userId)
- getProfileById(profileId)
- createProfile(userId, profileData)
- updateProfile(profileId, profileData)
- deleteProfile(profileId)

### Subscription Service
- getAllSubscriptions()
- getUserSubscription(userId)
- createSubscription(userId, subscriptionData)
- updateSubscription(userId, subscriptionData)
- cancelSubscription(userId)

### Watch History Service
- getHistory(profileId, limit)
- markAsWatched(profileId, mediaId, progress)
- getHistoryItemById(historyId)
- removeFromHistory(historyId)

### Watch List Service
- getWatchList(profileId, limit)
- addToWatchList(profileId, mediaId)
- getWatchListItemById(watchListId)
- removeFromWatchList(watchListId)

## 5. UML Diagram Suggestions

When creating your UML diagram, consider the following:

1. **Class Diagram**:
   - Show all models with their attributes and relationships
   - Use different colors for different types of models (e.g., user-related, media-related)
   - Indicate relationship types (1:1, 1:N, N:M)

2. **Component Diagram**:
   - Show the main components of the API (Controllers, Services, Models)
   - Illustrate how they interact with each other

3. **Sequence Diagrams** (for key flows):
   - User registration and authentication
   - Media browsing and filtering
   - Watch history tracking
   - Subscription management

4. **API Endpoint Diagram**:
   - Group endpoints by resource type
   - Show authentication requirements
   - Indicate request/response formats

5. **Database Schema**:
   - Show tables with primary and foreign keys
   - Indicate indexes and constraints
