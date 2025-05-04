/**
 * Unit tests for the Profile Service
 */
const profileService = require('../../../src/services/profileService');
const { Profile } = require('../../../src/models/Profile');
const ContentClassification = require('../../../src/models/enums/ContentClassification');
const sequelize = require('../../../src/config/sequelize');
const DbUtils = require('../../../src/utils/dbUtils');

// Mock dependencies
jest.mock('../../../src/models/Profile', () => ({
  Profile: {
    findAll: jest.fn(),
    findOne: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn()
  }
}));

jest.mock('../../../src/models/enums/ContentClassification', () => ({
  GENERAL: 'GENERAL',
  PG: 'PG',
  PG13: 'PG13',
  R: 'R',
  isValid: jest.fn()
}));

jest.mock('../../../src/config/sequelize', () => ({
  transaction: jest.fn().mockImplementation(() => ({
    commit: jest.fn().mockResolvedValue(),
    rollback: jest.fn().mockResolvedValue()
  })),
  QueryTypes: {
    SELECT: 'SELECT'
  }
}));

jest.mock('../../../src/utils/dbUtils', () => ({
  callStoredProcedure: jest.fn(),
  callProcedure: jest.fn()
}));

describe('ProfileService', () => {
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Set default mock implementations
    ContentClassification.isValid.mockReturnValue(true);
  });

  describe('createProfile', () => {
    it('should create a profile with all provided data', async () => {
      // Mock data
      const userId = 1;
      const profileData = {
        name: 'Test Profile',
        age: 25,
        content_classification: 'PG13',
        language: 'en',
        autoplay: true,
        subtitles: true
      };
      
      // Mock result from stored procedure
      const mockCreatedProfile = {
        profile_id: 1,
        user_id: userId,
        name: profileData.name,
        age: profileData.age,
        content_classification: profileData.content_classification,
        language: profileData.language,
        autoplay: profileData.autoplay,
        subtitles: profileData.subtitles
      };
      
      // Create transaction mock with commit method
      const mockTransaction = {
        commit: jest.fn().mockResolvedValue(undefined),
        rollback: jest.fn()
      };
      
      // Mock sequelize.transaction to return our mock transaction
      sequelize.transaction.mockReturnValue(mockTransaction);
      
      // Mock DbUtils.callStoredProcedure
      DbUtils.callStoredProcedure.mockResolvedValue([mockCreatedProfile]);

      // Call the method
      const result = await profileService.createProfile(userId, profileData);

      // Assertions
      expect(sequelize.transaction).toHaveBeenCalled();
      expect(DbUtils.callStoredProcedure).toHaveBeenCalledWith(
        'CreateProfileWithPreferences',
        [
          userId,
          profileData.name,
          profileData.age,
          profileData.content_classification,
          profileData.language,
          profileData.autoplay,
          profileData.subtitles
        ],
        mockTransaction
      );
      expect(mockTransaction.commit).toHaveBeenCalled();
      expect(result).toEqual(mockCreatedProfile);
    });

    it('should use default values for optional fields', async () => {
      // Mock data
      const userId = 1;
      const profileData = {
        name: 'Test Profile',
        age: 25
      };
      
      // Mock result from stored procedure
      const mockCreatedProfile = {
        profile_id: 1,
        user_id: userId,
        name: profileData.name,
        age: profileData.age,
        content_classification: 'GENERAL',
        language: 'en',
        autoplay: false,
        subtitles: false
      };
      
      // Mock DbUtils.callStoredProcedure
      DbUtils.callStoredProcedure.mockResolvedValue([mockCreatedProfile]);

      // Call the method
      const result = await profileService.createProfile(userId, profileData);

      // Assertions
      expect(DbUtils.callStoredProcedure).toHaveBeenCalledWith(
        'CreateProfileWithPreferences',
        [
          userId,
          profileData.name,
          profileData.age,
          'GENERAL',
          'en',
          false,
          false
        ],
        expect.anything()
      );
      expect(result).toEqual(mockCreatedProfile);
    });

    it('should throw an error if content classification is invalid', async () => {
      // Mock data
      const userId = 1;
      const profileData = {
        name: 'Test Profile',
        age: 25,
        content_classification: 'INVALID'
      };
      
      // Create transaction mock with rollback method
      const mockTransaction = {
        commit: jest.fn(),
        rollback: jest.fn().mockResolvedValue(undefined)
      };
      
      // Mock sequelize.transaction to return our mock transaction
      sequelize.transaction.mockReturnValue(mockTransaction);
      
      // Mock ContentClassification.isValid to return false
      ContentClassification.isValid.mockReturnValue(false);

      // Call the method and expect it to throw
      await expect(profileService.createProfile(userId, profileData)).rejects.toThrow('Invalid content classification');
      
      // Assertions
      expect(ContentClassification.isValid).toHaveBeenCalledWith('INVALID');
      expect(DbUtils.callStoredProcedure).not.toHaveBeenCalled();
    });

    it('should rollback transaction if an error occurs', async () => {
      // Mock data
      const userId = 1;
      const profileData = {
        name: 'Test Profile',
        age: 25
      };
      const error = new Error('Database error');
      
      // Create transaction mock with rollback method
      const mockTransaction = {
        commit: jest.fn(),
        rollback: jest.fn().mockResolvedValue(undefined)
      };
      
      // Mock sequelize.transaction to return our mock transaction
      sequelize.transaction.mockReturnValue(mockTransaction);
      
      // Mock DbUtils.callStoredProcedure to throw an error
      DbUtils.callStoredProcedure.mockRejectedValue(error);

      // Call the method and expect it to throw
      await expect(profileService.createProfile(userId, profileData)).rejects.toThrow(error);
      
      // Assertions
      expect(sequelize.transaction).toHaveBeenCalled();
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });
  });

  describe('getUserProfiles', () => {
    it('should get all profiles for a user', async () => {
      // Mock data
      const userId = 1;
      const mockProfiles = [
        { profile_id: 1, user_id: userId, name: 'Profile 1' },
        { profile_id: 2, user_id: userId, name: 'Profile 2' }
      ];
      
      // Mock Profile.findAll
      Profile.findAll.mockResolvedValue(mockProfiles);

      // Call the method
      const result = await profileService.getUserProfiles(userId);

      // Assertions
      expect(Profile.findAll).toHaveBeenCalledWith({
        where: { user_id: userId },
        order: [['created_at', 'DESC']]
      });
      expect(result).toEqual(mockProfiles);
    });

    it('should throw an error if getting profiles fails', async () => {
      // Mock data
      const userId = 1;
      const error = new Error('Database error');
      
      // Mock Profile.findAll to throw an error
      Profile.findAll.mockRejectedValue(error);

      // Call the method and expect it to throw
      await expect(profileService.getUserProfiles(userId)).rejects.toThrow(error);
    });
  });

  describe('getProfileById', () => {
    it('should get a profile by ID', async () => {
      // Mock data
      const profileId = 1;
      const userId = 1; // Same as the user_id in the mock profile
      const mockProfile = {
        profile_id: profileId,
        user_id: userId,
        name: 'Test Profile'
      };
      
      // Mock Profile.findByPk
      Profile.findByPk.mockResolvedValue(mockProfile);

      // Call the method with both profileId and userId
      const result = await profileService.getProfileById(profileId, userId);

      // Assertions
      expect(Profile.findByPk).toHaveBeenCalledWith(profileId);
      expect(result).toEqual(mockProfile);
    });

    it('should return null if profile not found', async () => {
      // Mock data
      const profileId = 999;
      
      // Mock Profile.findByPk to return null
      Profile.findByPk.mockResolvedValue(null);

      // Call the method
      const result = await profileService.getProfileById(profileId);

      // Assertions
      expect(Profile.findByPk).toHaveBeenCalledWith(profileId);
      expect(result).toBeNull();
    });

    it('should throw an error if getting profile fails', async () => {
      // Mock data
      const profileId = 1;
      const error = new Error('Database error');
      
      // Mock Profile.findByPk to throw an error
      Profile.findByPk.mockRejectedValue(error);

      // Call the method and expect it to throw
      await expect(profileService.getProfileById(profileId)).rejects.toThrow(error);
    });
  });

  describe('updateProfile', () => {
    it('should update a profile', async () => {
      // Mock data
      const profileId = 1;
      const userId = 1; // Same as the user_id in the mock profile
      const updateData = {
        name: 'Updated Profile',
        age: 30,
        content_classification: 'PG'
      };
      
      // Create transaction mock
      const mockTransaction = {
        commit: jest.fn().mockResolvedValue(undefined),
        rollback: jest.fn()
      };
      
      // Mock sequelize.transaction to return our mock transaction
      sequelize.transaction.mockReturnValue(mockTransaction);
      
      const mockProfile = {
        profile_id: profileId,
        user_id: userId, // Must match the userId parameter exactly
        name: 'Test Profile',
        age: 25,
        content_classification: 'GENERAL',
        update: jest.fn().mockImplementation(function(data) {
          // Update the mockProfile object itself to simulate real behavior
          this.name = data.name || this.name;
          this.age = data.age || this.age;
          this.content_classification = data.content_classification || this.content_classification;
          return Promise.resolve(this);
        })
      };
      
      // Mock Profile.findByPk
      Profile.findByPk.mockResolvedValue(mockProfile);

      // The userId MUST match the user_id in the mock profile
      const result = await profileService.updateProfile(profileId, userId, updateData);

      // Assertions
      expect(sequelize.transaction).toHaveBeenCalled();
      expect(Profile.findByPk).toHaveBeenCalledWith(profileId, { transaction: mockTransaction });
      expect(mockProfile.update).toHaveBeenCalledWith(updateData, { transaction: mockTransaction });
      expect(mockTransaction.commit).toHaveBeenCalled();
      // The result should be the updated mockProfile object, including the update function
      expect(result).toMatchObject({
        profile_id: profileId,
        user_id: userId,
        name: updateData.name,
        age: updateData.age,
        content_classification: updateData.content_classification
      });
      // Verify that the update function exists
      expect(result.update).toBeDefined();
    });

    it('should return null if profile not found', async () => {
      // Mock data
      const profileId = 999;
      const userId = 1;
      const updateData = { name: 'Updated Profile' };
      
      // Create transaction mock
      const mockTransaction = {
        commit: jest.fn(),
        rollback: jest.fn().mockResolvedValue(undefined)
      };
      
      // Mock sequelize.transaction to return our mock transaction
      sequelize.transaction.mockReturnValue(mockTransaction);
      
      // Mock Profile.findByPk to return null
      Profile.findByPk.mockResolvedValue(null);

      // Call the method
      const result = await profileService.updateProfile(profileId, userId, updateData);

      // Assertions
      expect(sequelize.transaction).toHaveBeenCalled();
      expect(Profile.findByPk).toHaveBeenCalledWith(profileId, { transaction: mockTransaction });
      expect(mockTransaction.rollback).toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it('should throw an error if updating profile fails', async () => {
      // Mock data
      const profileId = 1;
      const userId = 1; // Add the missing userId variable
      const updateData = { name: 'Updated Profile' };
      const error = new Error('Database error');
      
      // Mock Profile.findByPk to throw an error
      Profile.findByPk.mockRejectedValue(error);

      // Call the method and expect it to throw
      await expect(profileService.updateProfile(profileId, userId, updateData)).rejects.toThrow(error);
    });
  });

  describe('deleteProfile', () => {
    it('should delete a profile', async () => {
      // Mock data
      const profileId = 1;
      const userId = 1; // Same as the user_id in the mock profile
      
      // Create transaction mock
      const mockTransaction = {
        commit: jest.fn().mockResolvedValue(undefined),
        rollback: jest.fn()
      };
      
      // Mock sequelize.transaction to return our mock transaction
      sequelize.transaction.mockReturnValue(mockTransaction);
      
      // Mock profile
      const mockProfile = {
        profile_id: profileId,
        user_id: userId,
        name: 'Test Profile',
        destroy: jest.fn().mockResolvedValue(true)
      };
      
      // Mock Profile.findByPk
      Profile.findByPk.mockResolvedValue(mockProfile);

      // Call the method with profileId and userId
      const result = await profileService.deleteProfile(profileId, userId);

      // Assertions
      expect(sequelize.transaction).toHaveBeenCalled();
      expect(Profile.findByPk).toHaveBeenCalledWith(profileId, { transaction: mockTransaction });
      expect(mockProfile.destroy).toHaveBeenCalledWith({ transaction: mockTransaction });
      expect(mockTransaction.commit).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should return false if profile not found', async () => {
      // Mock data
      const profileId = 999;
      const userId = 1; // Add the missing userId variable
      
      // Create transaction mock
      const mockTransaction = {
        commit: jest.fn().mockResolvedValue(undefined),
        rollback: jest.fn()
      };
      
      // Mock sequelize.transaction to return our mock transaction
      sequelize.transaction.mockReturnValue(mockTransaction);
      
      // Mock Profile.findByPk to return null
      Profile.findByPk.mockResolvedValue(null);

      // Call the method
      const result = await profileService.deleteProfile(profileId, userId);

      // Assertions
      expect(sequelize.transaction).toHaveBeenCalled();
      expect(Profile.findByPk).toHaveBeenCalledWith(profileId, { transaction: mockTransaction });
      expect(mockTransaction.rollback).toHaveBeenCalled();
      expect(result).toBe(false);
    });

    it('should throw an error if deleting profile fails', async () => {
      // Mock data
      const profileId = 1;
      const userId = 1; // Add the missing userId variable
      const error = new Error('Database error');
      
      // Mock Profile.findByPk to throw an error
      Profile.findByPk.mockRejectedValue(error);

      // Call the method and expect it to throw
      await expect(profileService.deleteProfile(profileId, userId)).rejects.toThrow(error);
    });
  });
});
