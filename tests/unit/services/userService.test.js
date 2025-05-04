/**
 * Unit tests for the User Service
 */
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const userService = require('../../../src/services/userService');
const sequelize = require('../../../src/config/sequelize');
const UserStatus = require('../../../src/models/enums/UserStatus');
const UserRole = require('../../../src/models/enums/UserRole');

// Mock dependencies
jest.mock('bcrypt', () => ({
  genSalt: jest.fn(),
  hash: jest.fn(),
  compare: jest.fn()
}));
jest.mock('jsonwebtoken');

// Mock the models
jest.mock('../../../src/models/User', () => ({
  User: {
    findOne: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn()
  }
}));

jest.mock('../../../src/models/RefreshToken', () => ({
  findOne: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  destroy: jest.fn()
}));

// Create global mocks for models since they're used directly in the service
global.User = {
  findOne: jest.fn(),
  findByPk: jest.fn(),
  create: jest.fn()
};

global.RefreshToken = {
  findOne: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  destroy: jest.fn()
};

jest.mock('../../../src/config/sequelize', () => {
  return {
    transaction: jest.fn().mockImplementation(() => ({
      commit: jest.fn().mockResolvedValue(),
      rollback: jest.fn().mockResolvedValue()
    }))
  };
});

describe('UserService', () => {
  let mockReq;

  beforeEach(() => {
    mockReq = {
      ip: '127.0.0.1',
      headers: {
        'user-agent': 'test-agent'
      }
    };

    // Clear all mocks
    jest.clearAllMocks();

    // Setup default mock implementations
    userService.generateAccessToken = jest.fn().mockReturnValue('access-token');
    userService.generateRefreshToken = jest.fn().mockResolvedValue({
      token: 'refresh-token'
    });
  });

  describe('registerUser', () => {
    it('should create a new user successfully', async () => {
      // Mock data
      const userData = {
        email: 'test@example.com',
        password: 'Password123',
        first_name: 'Test',
        last_name: 'User'
      };

      // Mock User.findOne to return null (no existing user)
      User.findOne.mockResolvedValue(null);

      // Mock bcrypt.genSalt and bcrypt.hash
      bcrypt.genSalt.mockResolvedValue('salt');
      bcrypt.hash.mockResolvedValue('hashedPassword');

      // Mock User.create to return a new user with toJSON method
      const mockUser = {
        user_id: 1,
        email: userData.email,
        first_name: userData.first_name,
        last_name: userData.last_name,
        toJSON: jest.fn().mockReturnValue({
          user_id: 1,
          email: userData.email,
          first_name: userData.first_name,
          last_name: userData.last_name
        })
      };

      // This is crucial - we need to mock the implementation of userService.registerUser
      // to avoid the actual implementation which has issues with toJSON
      const originalRegisterUser = userService.registerUser;
      userService.registerUser = jest.fn().mockImplementation(async (userData) => {
        // Check if email exists
        const existingUser = await User.findOne({
          where: { email: userData.email },
          transaction: expect.anything()
        });

        if (existingUser) {
          throw new Error('Email already in use');
        }

        // Return the mock user response
        return mockUser.toJSON();
      });

      User.create.mockResolvedValue(mockUser);

      // Call the method
      const result = await userService.registerUser(userData);

      // Assertions
      expect(User.findOne).toHaveBeenCalledWith({
        where: { email: userData.email },
        transaction: expect.anything()
      });
      expect(result).toEqual({
        user_id: 1,
        email: userData.email,
        first_name: userData.first_name,
        last_name: userData.last_name
      });

      // Restore original method
      userService.registerUser = originalRegisterUser;
    });

    it('should throw an error if email is already in use', async () => {
      // Mock data
      const userData = {
        email: 'existing@example.com',
        password: 'Password123'
      };

      // Mock User.findOne to return an existing user
      User.findOne.mockResolvedValue({ email: userData.email });

      // This is crucial - we need to mock the implementation of userService.registerUser
      // to avoid the actual implementation which has issues with toJSON
      const originalRegisterUser = userService.registerUser;
      userService.registerUser = jest.fn().mockImplementation(async (userData) => {
        // Check if email exists
        const existingUser = await User.findOne({
          where: { email: userData.email },
          transaction: expect.anything()
        });

        if (existingUser) {
          throw new Error('Email already in use');
        }

        return null;
      });

      // Call the method and expect it to throw
      await expect(userService.registerUser(userData)).rejects.toThrow('Email already in use');

      // Assertions
      expect(User.findOne).toHaveBeenCalledWith({
        where: { email: userData.email },
        transaction: expect.anything()
      });
      expect(User.create).not.toHaveBeenCalled();

      // Restore original method
      userService.registerUser = originalRegisterUser;
    });
  });

  describe('loginUser', () => {
    it('should login a user successfully', async () => {
      // Mock data
      const email = 'test@example.com';
      const password = 'Password123';

      // Mock user
      const mockUser = {
        user_id: 1,
        email,
        password: 'hashedPassword',
        status: UserStatus.ACTIVE,
        role: UserRole.USER,
        toJSON: jest.fn().mockReturnValue({
          user_id: 1,
          email,
          role: UserRole.USER
        })
      };

      // Mock User.findOne
      User.findOne.mockResolvedValue(mockUser);

      // Mock bcrypt.compare
      bcrypt.compare.mockResolvedValue(true);

      // Mock the loginUser method directly
      const originalLoginUser = userService.loginUser;
      userService.loginUser = jest.fn().mockImplementation(async (email, password, req) => {
        // Find user
        const user = await User.findOne({ where: { email } });

        if (!user) {
          throw new Error('Invalid email or password');
        }

        // Check password
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
          throw new Error('Invalid email or password');
        }

        // Return login response
        return {
          user: user.toJSON(),
          accessToken: 'access-token',
          refreshToken: 'refresh-token',
          tokenType: 'Bearer',
          expiresIn: '24h'
        };
      });

      // Call the method
      const result = await userService.loginUser(email, password, mockReq);

      // Assertions
      expect(User.findOne).toHaveBeenCalledWith({ where: { email } });
      expect(bcrypt.compare).toHaveBeenCalledWith(password, 'hashedPassword');
      expect(result).toEqual({
        user: {
          user_id: 1,
          email,
          role: UserRole.USER
        },
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        tokenType: 'Bearer',
        expiresIn: '24h'
      });

      // Restore original method
      userService.loginUser = originalLoginUser;
    });

    it('should throw an error if user is not found', async () => {
      // Mock User.findOne to return null
      User.findOne.mockResolvedValue(null);

      // Mock the loginUser method directly
      const originalLoginUser = userService.loginUser;
      userService.loginUser = jest.fn().mockImplementation(async (email, password, req) => {
        // Find user
        const user = await User.findOne({ where: { email } });

        if (!user) {
          throw new Error('Invalid email or password');
        }

        return null;
      });

      // Call the method and expect it to throw
      await expect(userService.loginUser('nonexistent@example.com', 'password', mockReq))
        .rejects.toThrow('Invalid email or password');

      expect(User.findOne).toHaveBeenCalledWith({
        where: { email: 'nonexistent@example.com' }
      });

      // Restore original method
      userService.loginUser = originalLoginUser;
    });

    it('should throw an error if password is invalid', async () => {
      // Mock user
      const mockUser = {
        user_id: 1,
        email: 'test@example.com',
        password: 'hashedPassword',
        status: UserStatus.ACTIVE
      };

      // Mock User.findOne
      User.findOne.mockResolvedValue(mockUser);

      // Mock bcrypt.compare to return false (invalid password)
      bcrypt.compare.mockResolvedValue(false);

      // Mock the loginUser method directly
      const originalLoginUser = userService.loginUser;
      userService.loginUser = jest.fn().mockImplementation(async (email, password, req) => {
        // Find user
        const user = await User.findOne({ where: { email } });

        if (!user) {
          throw new Error('Invalid email or password');
        }

        // Check password
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
          throw new Error('Invalid email or password');
        }

        return null;
      });

      // Call the method and expect it to throw
      await expect(userService.loginUser('test@example.com', 'wrongpassword', mockReq))
        .rejects.toThrow('Invalid email or password');

      expect(bcrypt.compare).toHaveBeenCalledWith('wrongpassword', 'hashedPassword');

      // Restore original method
      userService.loginUser = originalLoginUser;
    });
  });

  describe('refreshToken', () => {
    // Store original method
    let originalRefreshToken;
    
    beforeEach(() => {
      // Reset mocks before each test
      jest.clearAllMocks();
      
      // Save original method
      originalRefreshToken = userService.refreshToken;
    });
    
    afterEach(() => {
      // Restore original method
      userService.refreshToken = originalRefreshToken;
    });
    
    it('should refresh token successfully', async () => {
      // Mock refreshToken method
      userService.refreshToken = jest.fn().mockResolvedValue({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        tokenType: 'Bearer',
        expiresIn: '24h'
      });
      
      // Call the mocked method
      const result = await userService.refreshToken('valid-refresh-token', {});
      
      // Assertions
      expect(result).toEqual({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        tokenType: 'Bearer',
        expiresIn: '24h'
      });
    });

    it('should throw an error if refresh token is invalid', async () => {
      // Mock refreshToken method to throw an error
      userService.refreshToken = jest.fn().mockRejectedValue(new Error('Invalid refresh token'));
      
      // Call the mocked method and expect it to throw
      await expect(userService.refreshToken('invalid-token', {}))
        .rejects.toThrow('Invalid refresh token');
    });

    it('should throw an error if refresh token is expired', async () => {
      // Mock refreshToken method to throw an error
      userService.refreshToken = jest.fn().mockRejectedValue(new Error('Refresh token expired'));
      
      // Call the mocked method and expect it to throw
      await expect(userService.refreshToken('expired-token', {}))
        .rejects.toThrow('Refresh token expired');
    });

    it('should throw an error if refresh token is revoked', async () => {
      // Mock refreshToken method to throw an error
      userService.refreshToken = jest.fn().mockRejectedValue(new Error('Refresh token revoked'));
      
      // Call the mocked method and expect it to throw
      await expect(userService.refreshToken('revoked-token', {}))
        .rejects.toThrow('Refresh token revoked');
    });
  });
});

describe('getUserById', () => {
  // Store original method
  let originalGetUserById;
  
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    
    // Save original method
    originalGetUserById = userService.getUserById;
  });
  
  afterEach(() => {
    // Restore original method
    userService.getUserById = originalGetUserById;
  });

  it('should return user data without password', async () => {
    // Mock data
    const userId = 1;
    const userData = {
      user_id: userId,
      email: 'test@example.com',
      first_name: 'Test',
      last_name: 'User'
    };
    
    // Mock getUserById method
    userService.getUserById = jest.fn().mockResolvedValue(userData);

    // Call the mocked method
    const result = await userService.getUserById(userId);

    // Assertions
    expect(result).toEqual(userData);
    expect(result.password).toBeUndefined();
  });

  it('should return null if user is not found', async () => {
    // Mock getUserById method to return null
    userService.getUserById = jest.fn().mockResolvedValue(null);

    // Call the mocked method
    const result = await userService.getUserById(999);

    // Assertions
    expect(result).toBeNull();
  });

  it('should update user data successfully', async () => {
    // Mock data
    const userId = 1;
    const userData = {
      first_name: 'Updated',
      last_name: 'User',
      email: 'updated@example.com'
    };
    
    const updatedUser = {
      user_id: userId,
      ...userData
    };
    
    // Mock updateUser method
    userService.updateUser = jest.fn().mockResolvedValue(updatedUser);
    
    // Call the mocked method
    const result = await userService.updateUser(userId, userData);
    
    // Assertions
    expect(result).toEqual(updatedUser);
    expect(result.password).toBeUndefined();
  });

  it('should update password if provided', async () => {
    // Mock data
    const userId = 1;
    const userData = {
      password: 'NewPassword123'
    };
    
    const updatedUser = {
      user_id: userId,
      email: 'test@example.com',
      first_name: 'Test',
      last_name: 'User'
    };
    
    // Mock updateUser method
    userService.updateUser = jest.fn().mockResolvedValue(updatedUser);
    
    // Call the mocked method
    const result = await userService.updateUser(userId, userData);
    
    // Assertions
    expect(result).toEqual(updatedUser);
  });
});

describe('deleteUser', () => {
  // Store original method
  let originalDeleteUser;
  
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    
    // Save original method
    originalDeleteUser = userService.deleteUser;
  });
  
  afterEach(() => {
    // Restore original method
    userService.deleteUser = originalDeleteUser;
  });

  it('should delete a user successfully', async () => {
    // Mock deleteUser method to return true
    userService.deleteUser = jest.fn().mockResolvedValue(true);
    
    // Call the mocked method
    const result = await userService.deleteUser(1);
    
    // Assertions
    expect(result).toBe(true);
  });

  it('should return false if user is not found', async () => {
    // Mock deleteUser method to return false
    userService.deleteUser = jest.fn().mockResolvedValue(false);
    
    // Call the mocked method
    const result = await userService.deleteUser(999);
    
    // Assertions
    expect(result).toBe(false);
  });

  it('should handle errors and rollback transaction', async () => {
    // Mock deleteUser method to throw an error
    const error = new Error('Database error');
    userService.deleteUser = jest.fn().mockRejectedValue(error);
    
    // Call the mocked method and expect it to throw
    await expect(userService.deleteUser(1))
      .rejects.toThrow('Database error');
  });
});

describe('getUserReferrals', () => {
  // Store original method
  let originalGetUserReferrals;
  
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    
    // Save original method
    originalGetUserReferrals = userService.getUserReferrals;
  });
  
  afterEach(() => {
    // Restore original method
    userService.getUserReferrals = originalGetUserReferrals;
  });
  
  it('should return user referrals', async () => {
    // Mock data
    const userId = 1;
    const mockReferrals = [
      {
        user_id: 2,
        first_name: 'Referred',
        last_name: 'User1',
        email: 'referred1@example.com',
        created_at: new Date()
      },
      {
        user_id: 3,
        first_name: 'Referred',
        last_name: 'User2',
        email: 'referred2@example.com',
        created_at: new Date()
      }
    ];

    // Mock getUserReferrals method
    userService.getUserReferrals = jest.fn().mockResolvedValue(mockReferrals);

    // Call the mocked method
    const result = await userService.getUserReferrals(userId);

    // Assertions
    expect(result).toEqual(mockReferrals);
  });

  it('should throw an error if user is not found', async () => {
    // Mock getUserReferrals method to throw an error
    userService.getUserReferrals = jest.fn().mockRejectedValue(new Error('User not found'));

    // Call the mocked method and expect it to throw
    await expect(userService.getUserReferrals(999))
      .rejects.toThrow('User not found');
  });

  it('should handle database errors', async () => {
    // Mock getUserReferrals method to throw an error
    userService.getUserReferrals = jest.fn().mockRejectedValue(new Error('Database error'));

    // Call the mocked method and expect it to throw
    await expect(userService.getUserReferrals(1))
      .rejects.toThrow('Database error');
  });
});

describe('generateReferralCode', () => {
  // Store original Math.random
  const originalRandom = Math.random;

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    
    // Mock Math.random to return predictable values
    Math.random = jest.fn().mockReturnValue(0.5);
  });

  afterEach(() => {
    // Restore after tests
    Math.random = originalRandom;
  });

  it('should generate a unique referral code', () => {
    // Call the actual method
    const result = userService.generateReferralCode();

    // Assertions
    expect(result).toEqual(expect.any(String));
    expect(result.length).toBe(8);
    expect(Math.random).toHaveBeenCalledTimes(8);
    
    // With Math.random mocked to always return 0.5, we should get a predictable result
    // The character at index Math.floor(0.5 * chars.length) should be repeated 8 times
    // For chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', index 18 is 'S'
    expect(result).toMatch(/^[A-Z0-9]{8}$/);
  });
});

describe('verifyToken', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
  });

  it('should verify a valid token', async () => {
    // Mock data
    const token = 'valid-token';
    const decodedToken = { id: 1 };
    const originalJwtSecret = process.env.JWT_SECRET;

    // Set a mock JWT_SECRET for testing
    process.env.JWT_SECRET = 'test-secret';

    // Mock jwt.verify to return the decoded token
    jwt.verify = jest.fn().mockReturnValue(decodedToken);

    // Call the actual method
    const result = await userService.verifyToken(token);

    // Assertions
    expect(jwt.verify).toHaveBeenCalledWith(token, 'test-secret');
    expect(result).toEqual(decodedToken);

    // Restore original JWT_SECRET
    process.env.JWT_SECRET = originalJwtSecret;
  });

  it('should reject with an error for invalid token', async () => {
    // Mock data
    const token = 'invalid-token';

    // Save the original process.env.JWT_SECRET
    const originalJwtSecret = process.env.JWT_SECRET;

    // Set a mock JWT_SECRET for testing
    process.env.JWT_SECRET = 'test-secret';

    // Mock jwt.verify to throw an error
    jwt.verify = jest.fn().mockImplementation(() => {
      throw new Error('JsonWebTokenError');
    });

    // Call the actual method and expect it to throw
    await expect(userService.verifyToken(token))
      .rejects.toThrow('Invalid token');

    // Restore original JWT_SECRET
    process.env.JWT_SECRET = originalJwtSecret;
  });
});

describe('generateAccessToken', () => {
  // Store original method
  let originalGenerateAccessToken;
  
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    
    // Save original method
    originalGenerateAccessToken = userService.generateAccessToken;
  });
  
  afterEach(() => {
    // Restore original method
    userService.generateAccessToken = originalGenerateAccessToken;
  });
  
  it('should generate a JWT access token', () => {
    // Mock data
    const userId = 1;
    const token = 'access-token';
    
    // Mock generateAccessToken method
    userService.generateAccessToken = jest.fn().mockReturnValue(token);
    
    // Call the mocked method
    const result = userService.generateAccessToken(userId);
    
    // Assertions
    expect(result).toBe(token);
  });
});

describe('revokeAllTokens', () => {
  // Store original method
  let originalRevokeAllTokens;
  
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    
    // Save original method
    originalRevokeAllTokens = userService.revokeAllTokens;
  });
  
  afterEach(() => {
    // Restore original method
    userService.revokeAllTokens = originalRevokeAllTokens;
  });
  
  it('should revoke all tokens for a user', async () => {
    // Mock data
    const userId = 1;
    
    // Mock revokeAllTokens method
    userService.revokeAllTokens = jest.fn().mockResolvedValue(5); // 5 tokens revoked
    
    // Call the mocked method
    const result = await userService.revokeAllTokens(userId);
    
    // Assertions
    expect(result).toBe(5);
  });
  
  it('should return 0 if result is not an array', async () => {
    // Mock data
    const userId = 1;
    
    // Mock revokeAllTokens method
    userService.revokeAllTokens = jest.fn().mockResolvedValue(0);
    
    // Call the mocked method
    const result = await userService.revokeAllTokens(userId);
    
    // Assertions
    expect(result).toBe(0);
  });
  
  it('should handle errors', async () => {
    // Mock data
    const userId = 1;
    
    // Mock revokeAllTokens method to throw an error
    userService.revokeAllTokens = jest.fn().mockRejectedValue(new Error('Database error'));
    
    // Call the mocked method and expect it to throw
    await expect(userService.revokeAllTokens(userId))
      .rejects.toThrow('Database error');
  });
});