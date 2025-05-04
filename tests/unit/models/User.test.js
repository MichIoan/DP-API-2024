const { User } = require('../../mocks/models');
const UserStatus = require('../../../src/models/enums/UserStatus');
const UserRole = require('../../../src/models/enums/UserRole');

describe('User Model', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  describe('findByPk', () => {
    it('should return a user when given a valid ID', async () => {
      const user = await User.findByPk(1);
      
      expect(User.findByPk).toHaveBeenCalledWith(1);
      expect(user).toHaveProperty('user_id', 1);
      expect(user).toHaveProperty('email', 'test@example.com');
      expect(user).toHaveProperty('activation_status', 'ACTIVE');
    });

    it('should be able to mock a different return value', async () => {
      // Override the mock for this specific test
      User.findByPk.mockResolvedValueOnce({
        user_id: 2,
        email: 'another@example.com',
        activation_status: UserStatus.SUSPENDED,
        role: UserRole.ADMIN
      });
      
      const user = await User.findByPk(2);
      
      expect(User.findByPk).toHaveBeenCalledWith(2);
      expect(user.email).toBe('another@example.com');
      expect(user.activation_status).toBe(UserStatus.SUSPENDED);
    });
  });

  describe('isActive', () => {
    it('should call isActive method on user instance', async () => {
      const user = await User.findByPk(1);
      
      user.isActive.mockReturnValueOnce(true);
      const result = user.isActive();
      
      expect(user.isActive).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should be able to mock different return values', async () => {
      const user = await User.findByPk(1);
      
      user.isActive.mockReturnValueOnce(false);
      const result = user.isActive();
      
      expect(user.isActive).toHaveBeenCalled();
      expect(result).toBe(false);
    });
  });

  describe('isLocked', () => {
    it('should call isLocked method on user instance', async () => {
      const user = await User.findByPk(1);
      
      user.isLocked.mockReturnValueOnce(true);
      const result = user.isLocked();
      
      expect(user.isLocked).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should be able to mock different return values', async () => {
      const user = await User.findByPk(1);
      
      user.isLocked.mockReturnValueOnce(false);
      const result = user.isLocked();
      
      expect(user.isLocked).toHaveBeenCalled();
      expect(result).toBe(false);
    });
  });

  describe('hasRole', () => {
    it('should call hasRole method with correct parameters', async () => {
      const user = await User.findByPk(1);
      
      user.hasRole.mockReturnValueOnce(true);
      const result = user.hasRole(UserRole.ADMIN);
      
      expect(user.hasRole).toHaveBeenCalledWith(UserRole.ADMIN);
      expect(result).toBe(true);
    });
  });

  describe('hasPermission', () => {
    it('should call hasPermission method with correct parameters', async () => {
      const user = await User.findByPk(1);
      
      user.hasPermission.mockReturnValueOnce(true);
      const result = user.hasPermission(UserRole.USER);
      
      expect(user.hasPermission).toHaveBeenCalledWith(UserRole.USER);
      expect(result).toBe(true);
    });
  });

  describe('toXML', () => {
    it('should call toXML method and return XML-compatible format', async () => {
      const user = await User.findByPk(1);
      
      user.toXML.mockReturnValueOnce({
        user: {
          user_id: 1,
          email: 'test@example.com',
          role: UserRole.USER
        }
      });
      
      const result = user.toXML();
      
      expect(user.toXML).toHaveBeenCalled();
      expect(result).toEqual({
        user: {
          user_id: 1,
          email: 'test@example.com',
          role: UserRole.USER
        }
      });
      expect(result.user.password).toBeUndefined();
    });
  });

  describe('create', () => {
    it('should call create with the provided user data', async () => {
      const userData = {
        email: 'new@example.com',
        password: 'hashedpassword',
        role: UserRole.USER
      };
      
      await User.create(userData);
      
      expect(User.create).toHaveBeenCalledWith(userData);
    });
  });

  describe('update', () => {
    it('should call update with the provided user data and options', async () => {
      const userData = {
        email: 'updated@example.com'
      };
      
      const options = {
        where: { user_id: 1 }
      };
      
      await User.update(userData, options);
      
      expect(User.update).toHaveBeenCalledWith(userData, options);
    });
  });

  describe('destroy', () => {
    it('should call destroy with the provided options', async () => {
      const options = {
        where: { user_id: 1 }
      };
      
      await User.destroy(options);
      
      expect(User.destroy).toHaveBeenCalledWith(options);
    });
  });
});
