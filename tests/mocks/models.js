/**
 * Centralized mock models for testing
 * This file provides mock implementations of all models used in the application
 */

const ContentClassification = require('./ContentClassification');

// Mock Movie model
const Movie = {
  findOne: jest.fn().mockResolvedValue(null),
  findByPk: jest.fn().mockResolvedValue({
    movie_id: 1,
    title: 'Test Movie',
    description: 'A test movie for testing',
    genre: 'Action',
    release_year: 2023,
    duration: 120,
    rating: 'PG-13',
    director: 'Test Director',
    cast: ['Actor 1', 'Actor 2'],
    poster_url: 'https://example.com/poster.jpg',
    trailer_url: 'https://example.com/trailer.mp4'
  }),
  findAll: jest.fn().mockResolvedValue([]),
  create: jest.fn().mockResolvedValue({}),
  update: jest.fn().mockResolvedValue([1]),
  destroy: jest.fn().mockResolvedValue(1)
};

// Mock Series model
const Series = {
  findOne: jest.fn().mockResolvedValue(null),
  findByPk: jest.fn().mockResolvedValue({
    series_id: 1,
    title: 'Test Series',
    description: 'A test series for testing',
    genre: 'Drama',
    release_year: 2023,
    end_year: null,
    seasons: 1,
    rating: 'TV-MA',
    creator: 'Test Creator',
    cast: ['Actor 1', 'Actor 2'],
    poster_url: 'https://example.com/series-poster.jpg',
    trailer_url: 'https://example.com/series-trailer.mp4'
  }),
  findAll: jest.fn().mockResolvedValue([]),
  create: jest.fn().mockResolvedValue({}),
  update: jest.fn().mockResolvedValue([1]),
  destroy: jest.fn().mockResolvedValue(1),
  prototype: {
    isSuitableForChildren: function() {
      return this.age_restriction <= 13;
    },
    getContentClassification: function() {
      if (this.age_restriction <= 7) {
        return ContentClassification.G;
      } else if (this.age_restriction <= 13) {
        return ContentClassification.PG;
      } else if (this.age_restriction <= 17) {
        return ContentClassification.PG13;
      } else {
        return ContentClassification.R;
      }
    },
    isRunning: function() {
      return !this.end_date || new Date(this.end_date) > new Date();
    },
    toXML: function() {
      // Handle both cases: when 'this' has a get method or when 'this' is the data itself
      const data = typeof this.get === 'function' ? this.get() : this;
      return {
        series: {
          id: data.series_id,
          title: data.title,
          ageRestriction: data.age_restriction,
          startDate: data.start_date,
          endDate: data.end_date,
          description: data.description,
          rating: data.rating
        }
      };
    }
  }
};

// Mock Media model
const Media = {
  findOne: jest.fn().mockResolvedValue(null),
  findByPk: jest.fn().mockResolvedValue({
    media_id: 1,
    season_id: 1,
    episode_number: 1,
    title: 'Test Episode',
    duration: '00:45:00',
    release_date: new Date('2023-01-01'),
    description: 'A test episode for testing',
    classification: 'PG-13'
  }),
  findAll: jest.fn().mockResolvedValue([]),
  create: jest.fn().mockResolvedValue({}),
  update: jest.fn().mockResolvedValue([1]),
  destroy: jest.fn().mockResolvedValue(1),
  prototype: {
    getDurationMinutes: function() {
      if (!this.duration) return 0;
      
      // Parse the time string (HH:MM:SS)
      const parts = this.duration.split(':');
      if (parts.length === 3) {
        const hours = parseInt(parts[0], 10);
        const minutes = parseInt(parts[1], 10);
        return (hours * 60) + minutes;
      }
      return 0;
    },
    isNewRelease: function() {
      if (!this.release_date) return false;
      
      const releaseDate = new Date(this.release_date);
      const now = new Date();
      const diffTime = Math.abs(now - releaseDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      return diffDays <= 30;
    },
    toXML: function() {
      // Handle both cases: when 'this' has a get method or when 'this' is the data itself
      const data = typeof this.get === 'function' ? this.get() : this;
      return {
        episode: {
          id: data.media_id,
          title: data.title,
          seasonId: data.season_id,
          episodeNumber: data.episode_number,
          duration: data.duration,
          releaseDate: data.release_date,
          description: data.description,
          classification: data.classification
        }
      };
    }
  }
};

// Mock Season model
const Season = {
  findOne: jest.fn().mockResolvedValue(null),
  findByPk: jest.fn().mockResolvedValue({
    season_id: 1,
    series_id: 1,
    season_number: 1,
    release_date: new Date('2023-01-01'),
    episode_count: 10,
    description: 'First season of the test series'
  }),
  findAll: jest.fn().mockResolvedValue([]),
  create: jest.fn().mockResolvedValue({}),
  update: jest.fn().mockResolvedValue([1]),
  destroy: jest.fn().mockResolvedValue(1),
  prototype: {
    isLatestSeason: function(totalSeasons) {
      return this.season_number === totalSeasons;
    },
    isRecentlyReleased: function() {
      if (!this.release_date) return false;
      
      const releaseDate = new Date(this.release_date);
      const now = new Date();
      const diffTime = Math.abs(now - releaseDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      return diffDays <= 90;
    },
    toXML: function() {
      // Handle both cases: when 'this' has a get method or when 'this' is the data itself
      const data = typeof this.get === 'function' ? this.get() : this;
      return {
        season: {
          id: data.season_id,
          seriesId: data.series_id,
          seasonNumber: data.season_number,
          releaseDate: data.release_date,
          episodeCount: data.episode_count,
          description: data.description
        }
      };
    }
  }
};

// Mock Genre model
const Genre = {
  findOne: jest.fn().mockResolvedValue(null),
  findByPk: jest.fn().mockResolvedValue({
    genre_id: 1,
    name: 'Action',
    description: 'Action-packed content with thrilling sequences'
  }),
  findAll: jest.fn().mockResolvedValue([]),
  create: jest.fn().mockResolvedValue({}),
  update: jest.fn().mockResolvedValue([1]),
  destroy: jest.fn().mockResolvedValue(1),
  prototype: {
    getMediaWithGenre: async function() {
      // This is a simplified mock implementation
      return [
        { media_id: 1, title: 'Action Movie 1' },
        { media_id: 2, title: 'Action Movie 2' }
      ];
    },
    toXML: function() {
      // Handle both cases: when 'this' has a get method or when 'this' is the data itself
      const data = typeof this.get === 'function' ? this.get() : this;
      return {
        genre: {
          id: data.genre_id,
          name: data.name,
          description: data.description
        }
      };
    }
  }
};

// Mock MediaGenres model
const MediaGenres = {
  findOne: jest.fn().mockResolvedValue(null),
  findByPk: jest.fn().mockResolvedValue({
    media_genre_id: 1,
    media_id: 1,
    genre_id: 1
  }),
  findAll: jest.fn().mockResolvedValue([]),
  create: jest.fn().mockResolvedValue({}),
  update: jest.fn().mockResolvedValue([1]),
  destroy: jest.fn().mockResolvedValue(1),
  prototype: {
    toXML: function() {
      // Handle both cases: when 'this' has a get method or when 'this' is the data itself
      const data = typeof this.get === 'function' ? this.get() : this;
      return {
        mediaGenre: {
          id: data.media_genre_id,
          mediaId: data.media_id,
          genreId: data.genre_id
        }
      };
    }
  }
};

// Mock Profile model
const Profile = {
  findOne: jest.fn().mockResolvedValue(null),
  findByPk: jest.fn().mockResolvedValue({
    profile_id: 1,
    user_id: 1,
    name: 'Test Profile',
    avatar: 'avatar1.png',
    language_preference: 'en',
    content_preferences: { genres: ['action', 'comedy'] },
    is_kids: false
  }),
  findAll: jest.fn().mockResolvedValue([]),
  create: jest.fn().mockResolvedValue({}),
  update: jest.fn().mockResolvedValue([1]),
  destroy: jest.fn().mockResolvedValue(1)
};

// Mock WatchList model
const WatchList = {
  findOne: jest.fn().mockResolvedValue(null),
  findByPk: jest.fn().mockResolvedValue({
    watchlist_id: 1,
    profile_id: 1,
    movie_id: 1,
    series_id: null,
    added_date: new Date(),
    status: 'UNWATCHED',
    Movie: {
      movie_id: 1,
      title: 'Test Movie',
      genre: 'Action'
    }
  }),
  findAll: jest.fn().mockResolvedValue([]),
  create: jest.fn().mockResolvedValue({}),
  update: jest.fn().mockResolvedValue([1]),
  destroy: jest.fn().mockResolvedValue(1)
};

// Mock User model
const User = {
  findOne: jest.fn().mockResolvedValue(null),
  findByPk: jest.fn().mockResolvedValue({
    user_id: 1,
    email: 'test@example.com',
    password: 'hashedpassword',
    activation_status: 'ACTIVE',
    role: 'USER',
    failed_login_attempts: 0,
    locked_until: null,
    referral_code: 'ABC123',
    has_discount: false,
    trial_available: true,
    isActive: jest.fn().mockReturnValue(true),
    isLocked: jest.fn().mockReturnValue(false),
    hasRole: jest.fn().mockReturnValue(true),
    hasPermission: jest.fn().mockReturnValue(true),
    toXML: jest.fn().mockReturnValue({ user: { user_id: 1, email: 'test@example.com' } })
  }),
  findAll: jest.fn().mockResolvedValue([]),
  create: jest.fn().mockResolvedValue({}),
  update: jest.fn().mockResolvedValue([1]),
  destroy: jest.fn().mockResolvedValue(1)
};

module.exports = {
  Movie,
  Series,
  Media,
  Season,
  Genre,
  MediaGenres,
  Profile,
  WatchList,
  User
};
