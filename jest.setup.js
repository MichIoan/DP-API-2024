/**
 * Jest setup file for Netflix API tests
 * This file sets up mocks and other test environment configurations
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

// Mock UserRole for validation tests
jest.mock('./src/models/enums/UserRole', () => ({
  ROLES: {
    ADMIN: 'ADMIN',
    USER: 'USER',
    GUEST: 'GUEST'
  },
  isValidRole: jest.fn(role => ['ADMIN', 'USER', 'GUEST'].includes(role)),
  getAllValues: jest.fn(() => ['ADMIN', 'USER', 'GUEST'])
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

// Mock Controllers for routes
// Create a standard controller response handler to use in all controller mocks
const mockResponseHandlers = {
  handleSuccess: jest.fn((req, res, statusCode, data) => res.status(statusCode).json(data)),
  handleError: jest.fn((req, res, statusCode, message, details) => res.status(statusCode).json({ error: message, details }))
};

// Mock seriesController with all required methods
jest.mock('./src/controllers/seriesController', () => ({
  getAllSeries: jest.fn((req, res) => mockResponseHandlers.handleSuccess(req, res, 200, [])),
  getSeriesById: jest.fn((req, res) => mockResponseHandlers.handleSuccess(req, res, 200, {})),
  getSeriesSeasons: jest.fn((req, res) => mockResponseHandlers.handleSuccess(req, res, 200, [])),
  getSeasonEpisodes: jest.fn((req, res) => mockResponseHandlers.handleSuccess(req, res, 200, [])),
  getEpisodeById: jest.fn((req, res) => mockResponseHandlers.handleSuccess(req, res, 200, {})),
  startSeriesEpisode: jest.fn((req, res) => mockResponseHandlers.handleSuccess(req, res, 200, { message: 'Started watching episode' })),
  endSeriesEpisode: jest.fn((req, res) => mockResponseHandlers.handleSuccess(req, res, 200, { message: 'Ended watching episode' })),
  ...mockResponseHandlers
}), { virtual: true });

// Mock authController with all required methods
jest.mock('./src/controllers/authController', () => ({
  register: jest.fn((req, res) => mockResponseHandlers.handleSuccess(req, res, 201, { message: 'User registered successfully' })),
  login: jest.fn((req, res) => mockResponseHandlers.handleSuccess(req, res, 200, { token: 'mock-token' })),
  refreshToken: jest.fn((req, res) => mockResponseHandlers.handleSuccess(req, res, 200, { token: 'mock-token' })),
  logout: jest.fn((req, res) => mockResponseHandlers.handleSuccess(req, res, 200, { message: 'Logged out successfully' })),
  ...mockResponseHandlers
}), { virtual: true });

// Mock userController with all required methods
jest.mock('./src/controllers/userController', () => ({
  getUserProfile: jest.fn((req, res) => mockResponseHandlers.handleSuccess(req, res, 200, {})),
  updateUserProfile: jest.fn((req, res) => mockResponseHandlers.handleSuccess(req, res, 200, {})),
  updateUserAccount: jest.fn((req, res) => mockResponseHandlers.handleSuccess(req, res, 200, { message: 'User account updated successfully' })),
  changePassword: jest.fn((req, res) => mockResponseHandlers.handleSuccess(req, res, 200, { message: 'Password changed successfully' })),
  getUserAccount: jest.fn((req, res) => mockResponseHandlers.handleSuccess(req, res, 200, {})),
  ...mockResponseHandlers
}), { virtual: true });

// Create mock for validators
jest.mock('./src/validation/userValidation', () => ({
  updateUserSchema: {},
  changePasswordSchema: {}
}), { virtual: true });

// Mock validation middleware
jest.mock('./src/middleware/validation', () => ({
  validate: jest.fn().mockImplementation(() => (req, res, next) => next())
}), { virtual: true });

// Critical - Mock the associations file directly
jest.mock('./src/models/associations', () => ({}), { virtual: true });

// Mock route files to return router objects
jest.mock('./src/routes/userRoutes', () => {
  const express = require('express');
  const router = express.Router();
  return router;
}, { virtual: true });

jest.mock('./src/routes/seriesRoutes', () => {
  const express = require('express');
  const router = express.Router();
  return router;
}, { virtual: true });

jest.mock('./src/routes/adminRoutes', () => {
  const express = require('express');
  const router = express.Router();
  return router;
}, { virtual: true });

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
    hasMany: jest.fn(),
    hasOne: jest.fn(),
    belongsTo: jest.fn()
  }
}), { virtual: true });

// Profile Model
jest.mock('./src/models/Profile', () => ({
  Profile: {
    findOne: jest.fn().mockResolvedValue(null),
    findByPk: jest.fn().mockResolvedValue(null),
    findAll: jest.fn().mockResolvedValue([]),
    create: jest.fn().mockResolvedValue({}),
    update: jest.fn().mockResolvedValue([1]),
    destroy: jest.fn().mockResolvedValue(1),
    belongsTo: jest.fn()
  }
}), { virtual: true });

// Subscription Model
jest.mock('./src/models/Subscription', () => ({
  Subscription: {
    findOne: jest.fn().mockResolvedValue(null),
    findByPk: jest.fn().mockResolvedValue(null),
    findAll: jest.fn().mockResolvedValue([]),
    create: jest.fn().mockResolvedValue({}),
    update: jest.fn().mockResolvedValue([1]),
    destroy: jest.fn().mockResolvedValue(1),
    belongsTo: jest.fn()
  }
}), { virtual: true });

// RefreshToken Model
jest.mock('./src/models/RefreshToken', () => ({
  findOne: jest.fn().mockResolvedValue(null),
  findByPk: jest.fn().mockResolvedValue(null),
  findAll: jest.fn().mockResolvedValue([]),
  create: jest.fn().mockResolvedValue({}),
  update: jest.fn().mockResolvedValue([1]),
  destroy: jest.fn().mockResolvedValue(1)
}), { virtual: true });

// WatchList Model
jest.mock('./src/models/WatchList', () => ({
  WatchList: {
    findOne: jest.fn().mockResolvedValue(null),
    findByPk: jest.fn().mockResolvedValue(null),
    findAll: jest.fn().mockResolvedValue([]),
    create: jest.fn().mockResolvedValue({}),
    update: jest.fn().mockResolvedValue([1]),
    destroy: jest.fn().mockResolvedValue(1)
  }
}), { virtual: true });

// WatchHistory Model
jest.mock('./src/models/WatchHistory', () => ({
  WatchHistory: {
    findOne: jest.fn().mockResolvedValue(null),
    findByPk: jest.fn().mockResolvedValue(null),
    findAll: jest.fn().mockResolvedValue([]),
    create: jest.fn().mockResolvedValue({}),
    update: jest.fn().mockResolvedValue([1]),
    destroy: jest.fn().mockResolvedValue(1)
  }
}), { virtual: true });

// Mock Sequelize module before any models are imported
jest.mock('sequelize', () => {
  const mockSequelize = jest.fn(() => ({
    authenticate: jest.fn().mockResolvedValue(),
    define: jest.fn().mockReturnValue({}),
    sync: jest.fn().mockResolvedValue(),
    transaction: jest.fn().mockImplementation(cb => {
      if (cb) return Promise.resolve(cb({ commit: jest.fn(), rollback: jest.fn() }));
      return Promise.resolve({ commit: jest.fn(), rollback: jest.fn() });
    }),
    DataTypes: mockDataTypes,
    QueryTypes: {
      SELECT: 'SELECT',
      INSERT: 'INSERT',
      UPDATE: 'UPDATE',
      DELETE: 'DELETE'
    },
    query: jest.fn().mockResolvedValue([[], {}])
  }));

  // This proper export format allows Model to be imported via destructuring
  return {
    Sequelize: mockSequelize,
    Model: MockModel,
    DataTypes: mockDataTypes,
    Op: {
      eq: Symbol('eq'),
      ne: Symbol('ne'),
      gte: Symbol('gte'),
      gt: Symbol('gt'),
      lte: Symbol('lte'),
      lt: Symbol('lt'),
      in: Symbol('in'),
      notIn: Symbol('notIn'),
      like: Symbol('like'),
      notLike: Symbol('notLike')
    }
  };
});

// Mock sequelize-mock
jest.mock('sequelize-mock', () => {
  return jest.fn().mockImplementation(() => ({
    define: jest.fn().mockReturnValue({
      findOne: jest.fn().mockResolvedValue({}),
      findAll: jest.fn().mockResolvedValue([]),
      create: jest.fn().mockResolvedValue({}),
      update: jest.fn().mockResolvedValue([1]),
      destroy: jest.fn().mockResolvedValue(1)
    })
  }));
});

// Mock the database connection module
jest.mock('./src/config/sequelize', () => {
  return {
    sequelize: {
      authenticate: jest.fn().mockResolvedValue(),
      define: jest.fn().mockReturnValue({}),
      sync: jest.fn().mockResolvedValue(),
      transaction: jest.fn().mockImplementation(cb => {
        if (cb) return Promise.resolve(cb({ commit: jest.fn(), rollback: jest.fn() }));
        return Promise.resolve({ commit: jest.fn(), rollback: jest.fn() });
      }),
      DataTypes: mockDataTypes,
      QueryTypes: {
        SELECT: 'SELECT',
        INSERT: 'INSERT',
        UPDATE: 'UPDATE',
        DELETE: 'DELETE'
      },
      query: jest.fn().mockResolvedValue([[], {}]),
      models: {}
    },
    connectToDatabase: jest.fn().mockResolvedValue()
  };
});

// Mock database initialization
jest.mock('./src/config/dbInit', () => ({
  initDatabase: jest.fn().mockResolvedValue(),
  runSchemaSql: jest.fn().mockResolvedValue(),
  testDatabaseFeatures: jest.fn().mockResolvedValue({
    connection: true,
    views: true,
    functions: true,
    triggers: true
  })
}));

// Mock PostgreSQL
jest.mock('pg', () => {
  const mPool = {
    connect: jest.fn().mockImplementation(() => Promise.resolve({
      query: jest.fn().mockResolvedValue({ rows: [] }),
      release: jest.fn()
    })),
    query: jest.fn().mockResolvedValue({ rows: [] }),
    end: jest.fn().mockResolvedValue(true)
  };
  return { Pool: jest.fn(() => mPool) };
});

// Mock database models if needed
jest.mock('./tests/mocks/sequelizeMock', () => {
  return {
    sequelize: {
      authenticate: jest.fn().mockResolvedValue(),
      define: jest.fn().mockReturnValue({}),
      sync: jest.fn().mockResolvedValue(),
      transaction: jest.fn().mockImplementation(cb => {
        if (cb) return Promise.resolve(cb({ commit: jest.fn(), rollback: jest.fn() }));
        return Promise.resolve({ commit: jest.fn(), rollback: jest.fn() });
      }),
      DataTypes: mockDataTypes,
      QueryTypes: {
        SELECT: 'SELECT',
        INSERT: 'INSERT',
        UPDATE: 'UPDATE',
        DELETE: 'DELETE'
      },
      query: jest.fn().mockResolvedValue([[], {}])
    },
    DataTypes: mockDataTypes,
    Model: MockModel
  };
});

// Mock JWT for authentication
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(() => 'mock-token'),
  verify: jest.fn(() => ({ id: 1, role: 'USER' }))
}));

// Mock bcrypt for password hashing
jest.mock('bcrypt', () => ({
  hash: jest.fn(() => 'hashed-password'),
  compare: jest.fn((password, hash) => {
    // Only return true for "Password123"
    return password === 'Password123';
  })
}));

// Set up global test variables
global.testUser = {
  id: 1,
  email: 'test@example.com',
  role: 'USER'
};

// Add global server cleanup
beforeAll(() => {
  // Reset any global server instances at the start of tests
  global.__test_server__ = null;
  global.__e2e_test_server__ = null;
  global.__profile_test_server__ = null;
  global.__watchlist_test_server__ = null;
});

// Clean up mocks after each test
afterEach(() => {
  jest.clearAllMocks();
});

// Add timeout extension for tests
jest.setTimeout(30000);
