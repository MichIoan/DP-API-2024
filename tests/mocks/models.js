/**
 * Centralized mock models for testing
 * This file provides mock implementations of all models used in the application
 */

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
  destroy: jest.fn().mockResolvedValue(1)
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

module.exports = {
  Movie,
  Series,
  Profile,
  WatchList
};
