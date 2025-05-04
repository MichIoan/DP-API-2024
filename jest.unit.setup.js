/**
 * Jest setup file for Netflix API unit tests
 * This file sets up mocks and other test environment configurations
 * without mocking controllers
 */

// Create a mock Model class - must be available for destructuring
class MockModel {
  static init(attributes, options) {
    return this;
  }
  
  static findOne() {
    return Promise.resolve({});
  }
  
  static findAll() {
    return Promise.resolve([]);
  }
  
  static findByPk() {
    return Promise.resolve({});
  }
  
  static create() {
    return Promise.resolve({});
  }
  
  static update() {
    return Promise.resolve([1]);
  }
  
  static destroy() {
    return Promise.resolve(1);
  }
  
  static belongsTo() {
    return this;
  }
  
  static hasMany() {
    return this;
  }
  
  static belongsToMany() {
    return this;
  }
  
  static hasOne() {
    return this;
  }
}

// Define mock DataTypes that will be available to all mocks
// Make DataTypes methods be functions to support DataTypes.STRING(500) syntax
const mockDataTypes = {
  STRING: jest.fn(length => ({ type: 'STRING', length })),
  TEXT: jest.fn(() => 'TEXT'),
  INTEGER: jest.fn(options => ({ type: 'INTEGER', options })),
  FLOAT: jest.fn(options => ({ type: 'FLOAT', options })),
  BOOLEAN: jest.fn(() => 'BOOLEAN'),
  DATE: jest.fn(() => 'DATE'),
  ENUM: jest.fn((...values) => ({ type: 'ENUM', values })),
  UUID: jest.fn(() => 'UUID'),
  UUIDV4: jest.fn(() => 'UUIDV4'),
  JSON: jest.fn(() => 'JSON'),
  JSONB: jest.fn(() => 'JSONB'),
  ARRAY: jest.fn(type => ({ type: 'ARRAY', subtype: type })),
  VIRTUAL: jest.fn(type => ({ type: 'VIRTUAL', returnType: type })),
  DATEONLY: jest.fn(() => 'DATEONLY'),
  DECIMAL: jest.fn((precision, scale) => ({ type: 'DECIMAL', precision, scale }))
};

// Make Sequelize and DataTypes available globally for models
global.Sequelize = {
  Model: MockModel
};

global.DataTypes = mockDataTypes;

// Mock Sequelize module
jest.mock('sequelize', () => {
  const actualSequelize = jest.requireActual('sequelize');
  
  // Create a proper constructor function for Sequelize
  function MockSequelize() {
    this.define = jest.fn().mockReturnValue(MockModel);
    this.authenticate = jest.fn().mockResolvedValue();
    this.sync = jest.fn().mockResolvedValue();
    this.transaction = jest.fn(callback => callback({ commit: jest.fn(), rollback: jest.fn() }));
    this.literal = jest.fn(str => str);
    this.query = jest.fn().mockResolvedValue([]);
    this.close = jest.fn().mockResolvedValue();
    return this;
  }
  
  // Add static properties to the constructor
  MockSequelize.DataTypes = mockDataTypes;
  MockSequelize.Model = MockModel;
  MockSequelize.Op = actualSequelize.Op;
  
  return MockSequelize;
});

// Mock UserRole for validation tests
jest.mock('./src/models/enums/UserRole', () => ({
  ROLES: {
    ADMIN: 'ADMIN',
    USER: 'USER',
    GUEST: 'GUEST'
  },
  isValidRole: jest.fn(role => ['ADMIN', 'USER', 'GUEST'].includes(role)),
  getAllValues: jest.fn(() => ['ADMIN', 'USER', 'GUEST']),
  hasPermission: jest.fn(() => true)
}), { virtual: true });

// Mock UserStatus for validation tests
jest.mock('./src/models/enums/UserStatus', () => ({
  STATUSES: {
    ACTIVE: 'ACTIVE',
    INACTIVE: 'INACTIVE',
    SUSPENDED: 'SUSPENDED',
    DELETED: 'DELETED'
  },
  isValidStatus: jest.fn(status => ['ACTIVE', 'INACTIVE', 'SUSPENDED', 'DELETED'].includes(status)),
  getAllValues: jest.fn(() => ['ACTIVE', 'INACTIVE', 'SUSPENDED', 'DELETED'])
}), { virtual: true });

// Mock SubscriptionType for validation tests
jest.mock('./src/models/enums/SubscriptionType', () => ({
  TYPES: {
    BASIC: 'BASIC',
    STANDARD: 'STANDARD',
    PREMIUM: 'PREMIUM'
  },
  isValidType: jest.fn(type => ['BASIC', 'STANDARD', 'PREMIUM'].includes(type)),
  getAllValues: jest.fn(() => ['BASIC', 'STANDARD', 'PREMIUM'])
}), { virtual: true });

// Mock ContentClassification for validation tests
jest.mock('./src/models/enums/ContentClassification', () => ({
  RATINGS: {
    G: 'G',
    PG: 'PG',
    PG13: 'PG13',
    R: 'R',
    NC17: 'NC17'
  },
  isValidRating: jest.fn(rating => ['G', 'PG', 'PG13', 'R', 'NC17'].includes(rating)),
  getAllValues: jest.fn(() => ['G', 'PG', 'PG13', 'R', 'NC17'])
}), { virtual: true });

// Create validation middleware
jest.mock('./src/middleware/validation', () => ({
  validate: jest.fn().mockImplementation(() => (req, res, next) => next())
}), { virtual: true });

// Critical - Mock the associations file directly
jest.mock('./src/models/associations', () => ({}), { virtual: true });

// Mock all models needed for tests
// User Model
jest.mock('./src/models/User', () => ({
  User: {
    findOne: jest.fn().mockResolvedValue(null),
    findByPk: jest.fn().mockResolvedValue(null),
    findAll: jest.fn().mockResolvedValue([]),
    create: jest.fn().mockResolvedValue({}),
    update: jest.fn().mockResolvedValue([1]),
    destroy: jest.fn().mockResolvedValue(1),
    count: jest.fn().mockResolvedValue(0),
  }
}), { virtual: true });

// Mock RefreshToken model
jest.mock('./src/models/RefreshToken', () => ({
  RefreshToken: {
    findOne: jest.fn().mockResolvedValue(null),
    findByPk: jest.fn().mockResolvedValue(null),
    findAll: jest.fn().mockResolvedValue([]),
    create: jest.fn().mockResolvedValue({}),
    update: jest.fn().mockResolvedValue([1]),
    destroy: jest.fn().mockResolvedValue(1),
    count: jest.fn().mockResolvedValue(0),
  }
}), { virtual: true });

// Mock Media model
jest.mock('./src/models/Media', () => ({
  Media: {
    findOne: jest.fn().mockResolvedValue(null),
    findByPk: jest.fn().mockResolvedValue(null),
    findAll: jest.fn().mockResolvedValue([]),
    create: jest.fn().mockResolvedValue({}),
    update: jest.fn().mockResolvedValue([1]),
    destroy: jest.fn().mockResolvedValue(1),
    count: jest.fn().mockResolvedValue(0),
  }
}), { virtual: true });

// Mock Movie model
jest.mock('./src/models/Movie', () => ({
  Movie: {
    findOne: jest.fn().mockResolvedValue(null),
    findByPk: jest.fn().mockResolvedValue(null),
    findAll: jest.fn().mockResolvedValue([]),
    create: jest.fn().mockResolvedValue({}),
    update: jest.fn().mockResolvedValue([1]),
    destroy: jest.fn().mockResolvedValue(1),
    count: jest.fn().mockResolvedValue(0),
  }
}), { virtual: true });

// Mock Series model
jest.mock('./src/models/Series', () => ({
  Series: {
    findOne: jest.fn().mockResolvedValue(null),
    findByPk: jest.fn().mockResolvedValue(null),
    findAll: jest.fn().mockResolvedValue([]),
    create: jest.fn().mockResolvedValue({}),
    update: jest.fn().mockResolvedValue([1]),
    destroy: jest.fn().mockResolvedValue(1),
    count: jest.fn().mockResolvedValue(0),
  }
}), { virtual: true });

// Mock Season model
jest.mock('./src/models/Season', () => ({
  Season: {
    findOne: jest.fn().mockResolvedValue(null),
    findByPk: jest.fn().mockResolvedValue(null),
    findAll: jest.fn().mockResolvedValue([]),
    create: jest.fn().mockResolvedValue({}),
    update: jest.fn().mockResolvedValue([1]),
    destroy: jest.fn().mockResolvedValue(1),
    count: jest.fn().mockResolvedValue(0),
  }
}), { virtual: true });

// Mock Episode model
jest.mock('./src/models/Episode', () => ({
  Episode: {
    findOne: jest.fn().mockResolvedValue(null),
    findByPk: jest.fn().mockResolvedValue(null),
    findAll: jest.fn().mockResolvedValue([]),
    create: jest.fn().mockResolvedValue({}),
    update: jest.fn().mockResolvedValue([1]),
    destroy: jest.fn().mockResolvedValue(1),
    count: jest.fn().mockResolvedValue(0),
  }
}), { virtual: true });

// Mock Profile model
jest.mock('./src/models/Profile', () => ({
  Profile: {
    findOne: jest.fn().mockResolvedValue(null),
    findByPk: jest.fn().mockResolvedValue(null),
    findAll: jest.fn().mockResolvedValue([]),
    create: jest.fn().mockResolvedValue({}),
    update: jest.fn().mockResolvedValue([1]),
    destroy: jest.fn().mockResolvedValue(1),
    count: jest.fn().mockResolvedValue(0),
  }
}), { virtual: true });

// Mock Subscription model
jest.mock('./src/models/Subscription', () => ({
  Subscription: {
    findOne: jest.fn().mockResolvedValue(null),
    findByPk: jest.fn().mockResolvedValue(null),
    findAll: jest.fn().mockResolvedValue([]),
    create: jest.fn().mockResolvedValue({}),
    update: jest.fn().mockResolvedValue([1]),
    destroy: jest.fn().mockResolvedValue(1),
    count: jest.fn().mockResolvedValue(0),
  }
}), { virtual: true });

// Mock WatchHistory model
jest.mock('./src/models/WatchHistory', () => ({
  WatchHistory: {
    findOne: jest.fn().mockResolvedValue(null),
    findByPk: jest.fn().mockResolvedValue(null),
    findAll: jest.fn().mockResolvedValue([]),
    create: jest.fn().mockResolvedValue({}),
    update: jest.fn().mockResolvedValue([1]),
    destroy: jest.fn().mockResolvedValue(1),
    count: jest.fn().mockResolvedValue(0),
  }
}), { virtual: true });

// Mock WatchList model
jest.mock('./src/models/WatchList', () => ({
  WatchList: {
    findOne: jest.fn().mockResolvedValue(null),
    findByPk: jest.fn().mockResolvedValue(null),
    findAll: jest.fn().mockResolvedValue([]),
    create: jest.fn().mockResolvedValue({}),
    update: jest.fn().mockResolvedValue([1]),
    destroy: jest.fn().mockResolvedValue(1),
    count: jest.fn().mockResolvedValue(0),
  }
}), { virtual: true });

// Mock Genre model
jest.mock('./src/models/Genre', () => ({
  Genre: {
    findOne: jest.fn().mockResolvedValue(null),
    findByPk: jest.fn().mockResolvedValue(null),
    findAll: jest.fn().mockResolvedValue([]),
    create: jest.fn().mockResolvedValue({}),
    update: jest.fn().mockResolvedValue([1]),
    destroy: jest.fn().mockResolvedValue(1),
    count: jest.fn().mockResolvedValue(0),
  }
}), { virtual: true });

// Mock MediaGenres model
jest.mock('./src/models/MediaGenres', () => ({
  MediaGenres: {
    findOne: jest.fn().mockResolvedValue(null),
    findByPk: jest.fn().mockResolvedValue(null),
    findAll: jest.fn().mockResolvedValue([]),
    create: jest.fn().mockResolvedValue({}),
    update: jest.fn().mockResolvedValue([1]),
    destroy: jest.fn().mockResolvedValue(1),
    count: jest.fn().mockResolvedValue(0),
  }
}), { virtual: true });

// Mock Subtitles model
jest.mock('./src/models/Subtitles', () => ({
  Subtitles: {
    findOne: jest.fn().mockResolvedValue(null),
    findByPk: jest.fn().mockResolvedValue(null),
    findAll: jest.fn().mockResolvedValue([]),
    create: jest.fn().mockResolvedValue({}),
    update: jest.fn().mockResolvedValue([1]),
    destroy: jest.fn().mockResolvedValue(1),
    count: jest.fn().mockResolvedValue(0),
  }
}), { virtual: true });

// Mock the sequelize config file directly
jest.mock('./src/config/sequelize', () => {
  const mockSequelizeInstance = {
    define: jest.fn().mockReturnValue(MockModel),
    authenticate: jest.fn().mockResolvedValue(),
    sync: jest.fn().mockResolvedValue(),
    transaction: jest.fn(callback => callback({ commit: jest.fn(), rollback: jest.fn() })),
    literal: jest.fn(str => str),
    query: jest.fn().mockResolvedValue([]),
    close: jest.fn().mockResolvedValue(),
    models: {}
  };
  
  return mockSequelizeInstance;
}, { virtual: true });

// Mock dbUtils to avoid direct Sequelize usage
jest.mock('./src/utils/dbUtils', () => ({
  executeTransaction: jest.fn(callback => callback({ commit: jest.fn(), rollback: jest.fn() })),
  executeQuery: jest.fn().mockResolvedValue([]),
  closeConnection: jest.fn().mockResolvedValue()
}), { virtual: true });

// Mock all services
jest.mock('./src/services/index', () => ({
  userService: {
    registerUser: jest.fn().mockResolvedValue({}),
    loginUser: jest.fn().mockResolvedValue({}),
    refreshToken: jest.fn().mockResolvedValue({}),
    revokeAllTokens: jest.fn().mockResolvedValue({}),
    getUserById: jest.fn().mockResolvedValue({}),
    updateUser: jest.fn().mockResolvedValue({}),
    changePassword: jest.fn().mockResolvedValue({})
  },
  mediaService: {
    getAllMedia: jest.fn().mockResolvedValue([]),
    getMediaById: jest.fn().mockResolvedValue({}),
    createMedia: jest.fn().mockResolvedValue({}),
    updateMedia: jest.fn().mockResolvedValue({}),
    deleteMedia: jest.fn().mockResolvedValue({}),
    getMediaByGenre: jest.fn().mockResolvedValue([]),
    searchMedia: jest.fn().mockResolvedValue([])
  },
  seriesService: {
    getAllSeries: jest.fn().mockResolvedValue([]),
    getSeriesById: jest.fn().mockResolvedValue({}),
    createSeries: jest.fn().mockResolvedValue({}),
    updateSeries: jest.fn().mockResolvedValue({}),
    deleteSeries: jest.fn().mockResolvedValue({}),
    getSeriesSeasons: jest.fn().mockResolvedValue([]),
    getSeasonEpisodes: jest.fn().mockResolvedValue([]),
    getEpisodeById: jest.fn().mockResolvedValue({})
  },
  profileService: {
    getProfileById: jest.fn().mockResolvedValue({}),
    createProfile: jest.fn().mockResolvedValue({}),
    updateProfile: jest.fn().mockResolvedValue({}),
    deleteProfile: jest.fn().mockResolvedValue({}),
    getUserProfiles: jest.fn().mockResolvedValue([])
  },
  subscriptionService: {
    getSubscriptionById: jest.fn().mockResolvedValue({}),
    createSubscription: jest.fn().mockResolvedValue({}),
    updateSubscription: jest.fn().mockResolvedValue({}),
    cancelSubscription: jest.fn().mockResolvedValue({}),
    getUserSubscription: jest.fn().mockResolvedValue({})
  },
  watchHistoryService: {
    getWatchHistoryById: jest.fn().mockResolvedValue({}),
    createWatchHistory: jest.fn().mockResolvedValue({}),
    updateWatchHistory: jest.fn().mockResolvedValue({}),
    deleteWatchHistory: jest.fn().mockResolvedValue({}),
    getUserWatchHistory: jest.fn().mockResolvedValue([])
  },
  watchListService: {
    getWatchListById: jest.fn().mockResolvedValue({}),
    createWatchList: jest.fn().mockResolvedValue({}),
    updateWatchList: jest.fn().mockResolvedValue({}),
    deleteWatchList: jest.fn().mockResolvedValue({}),
    getUserWatchList: jest.fn().mockResolvedValue([])
  }
}), { virtual: true });

// Mock bcrypt for password hashing
jest.mock('bcrypt', () => ({
  genSalt: jest.fn().mockResolvedValue('salt'),
  hash: jest.fn().mockResolvedValue('hashed_password'),
  compare: jest.fn().mockResolvedValue(true)
}), { virtual: true });

// Mock jsonwebtoken for token generation and verification
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockReturnValue('mock_token'),
  verify: jest.fn().mockReturnValue({ userId: 1 })
}), { virtual: true });

// Set JWT_SECRET for tests
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
