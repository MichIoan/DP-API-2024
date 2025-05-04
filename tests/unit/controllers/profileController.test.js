/**
 * Unit tests for the Profile Controller
 */
const profileController = require('../../../src/controllers/profileController');
const profileService = require('../../../src/services/profileService');
const { Profile } = require('../../../src/models/Profile');

// Mock dependencies
jest.mock('../../../src/services/profileService');
jest.mock('../../../src/models/Profile', () => {
  return {
    Profile: {
      findByPk: jest.fn()
    }
  };
});

describe('ProfileController', () => {
  let req;
  let res;
  
  beforeEach(() => {
    // Mock request and response objects
    req = {
      params: {},
      userId: 1,
      body: {},
      query: {}
    };
    
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    
    // Mock controller methods
    profileController.handleSuccess = jest.fn();
    profileController.handleError = jest.fn();
    
    // Clear all mocks
    jest.clearAllMocks();
  });
  
  describe('getUserProfiles', () => {
    it('should get user profiles successfully', async () => {
      // Mock profileService.getUserProfiles
      const mockProfiles = [
        {
          profile_id: 1,
          user_id: 1,
          name: 'Profile 1',
          age: 30
        },
        {
          profile_id: 2,
          user_id: 1,
          name: 'Profile 2',
          age: 10
        }
      ];
      profileService.getUserProfiles.mockResolvedValue(mockProfiles);
      
      // Call the method
      await profileController.getUserProfiles(req, res);
      
      // Assertions
      expect(profileService.getUserProfiles).toHaveBeenCalledWith(1);
      expect(profileController.handleSuccess).toHaveBeenCalledWith(
        req, 
        res, 
        200, 
        { profiles: mockProfiles }
      );
      expect(profileController.handleError).not.toHaveBeenCalled();
    });
    
    it('should return empty array if no profiles found', async () => {
      // Mock profileService.getUserProfiles to return empty array
      profileService.getUserProfiles.mockResolvedValue([]);
      
      // Call the method
      await profileController.getUserProfiles(req, res);
      
      // Assertions
      expect(profileService.getUserProfiles).toHaveBeenCalledWith(1);
      expect(profileController.handleSuccess).toHaveBeenCalledWith(
        req, 
        res, 
        200, 
        { 
          message: "No profiles found for this user.",
          profiles: []
        }
      );
      expect(profileController.handleError).not.toHaveBeenCalled();
    });
    
    it('should handle errors', async () => {
      // Mock profileService.getUserProfiles to throw an error
      const error = new Error('Database error');
      profileService.getUserProfiles.mockRejectedValue(error);
      
      // Call the method
      await profileController.getUserProfiles(req, res);
      
      // Assertions
      expect(profileService.getUserProfiles).toHaveBeenCalledWith(1);
      expect(profileController.handleError).toHaveBeenCalledWith(
        req, 
        res, 
        500, 
        "Error retrieving profiles",
        error.message
      );
      expect(profileController.handleSuccess).not.toHaveBeenCalled();
    });
  });
  
  describe('getProfileById', () => {
    it('should get profile by ID successfully', async () => {
      // Mock request parameters
      req.params = {
        profileId: '1'
      };
      
      // Mock Profile.findByPk
      const mockProfile = {
        profile_id: 1,
        user_id: 1,
        name: 'Test Profile',
        age: 30
      };
      Profile.findByPk.mockResolvedValue(mockProfile);
      
      // Call the method
      await profileController.getProfileById(req, res);
      
      // Assertions
      expect(Profile.findByPk).toHaveBeenCalledWith('1');
      expect(profileController.handleSuccess).toHaveBeenCalledWith(
        req, 
        res, 
        200, 
        { profile: mockProfile }
      );
      expect(profileController.handleError).not.toHaveBeenCalled();
    });
    
    it('should return 400 if profile ID is missing', async () => {
      // Empty request parameters
      req.params = {};
      
      // Call the method
      await profileController.getProfileById(req, res);
      
      // Assertions
      expect(Profile.findByPk).not.toHaveBeenCalled();
      expect(profileController.handleError).toHaveBeenCalledWith(
        req, 
        res, 
        400, 
        "Profile ID is required"
      );
      expect(profileController.handleSuccess).not.toHaveBeenCalled();
    });
    
    it('should return 404 if profile is not found', async () => {
      // Mock request parameters
      req.params = {
        profileId: '999'
      };
      
      // Mock Profile.findByPk to return null
      Profile.findByPk.mockResolvedValue(null);
      
      // Call the method
      await profileController.getProfileById(req, res);
      
      // Assertions
      expect(Profile.findByPk).toHaveBeenCalledWith('999');
      expect(profileController.handleError).toHaveBeenCalledWith(
        req, 
        res, 
        404, 
        "Profile not found"
      );
      expect(profileController.handleSuccess).not.toHaveBeenCalled();
    });
    
    it('should return 403 if profile belongs to another user', async () => {
      // Mock request parameters
      req.params = {
        profileId: '1'
      };
      req.userId = 1;
      
      // Mock Profile.findByPk
      const mockProfile = {
        profile_id: 1,
        user_id: 2, // Different user ID
        name: 'Test Profile',
        age: 30
      };
      Profile.findByPk.mockResolvedValue(mockProfile);
      
      // Call the method
      await profileController.getProfileById(req, res);
      
      // Assertions
      expect(Profile.findByPk).toHaveBeenCalledWith('1');
      expect(profileController.handleError).toHaveBeenCalledWith(
        req, 
        res, 
        403, 
        "You don't have permission to access this profile"
      );
      expect(profileController.handleSuccess).not.toHaveBeenCalled();
    });
    
    it('should handle invalid ID format errors', async () => {
      // Mock request parameters
      req.params = {
        profileId: 'invalid-id'
      };
      
      // Mock Profile.findByPk to throw a database error
      const error = new Error('invalid input syntax for type integer: "invalid-id"');
      error.name = 'SequelizeDatabaseError';
      Profile.findByPk.mockRejectedValue(error);
      
      // Call the method
      await profileController.getProfileById(req, res);
      
      // Assertions
      expect(Profile.findByPk).toHaveBeenCalledWith('invalid-id');
      expect(profileController.handleError).toHaveBeenCalledWith(
        req, 
        res, 
        400, 
        "Invalid profile ID format"
      );
      expect(profileController.handleSuccess).not.toHaveBeenCalled();
    });
    
    it('should handle errors', async () => {
      // Mock request parameters
      req.params = {
        profileId: '1'
      };
      
      // Mock Profile.findByPk to throw an error
      const error = new Error('Database error');
      Profile.findByPk.mockRejectedValue(error);
      
      // Call the method
      await profileController.getProfileById(req, res);
      
      // Assertions
      expect(Profile.findByPk).toHaveBeenCalledWith('1');
      expect(profileController.handleError).toHaveBeenCalledWith(
        req, 
        res, 
        500, 
        "Error retrieving profile",
        error.message
      );
      expect(profileController.handleSuccess).not.toHaveBeenCalled();
    });
  });
  
  describe('createProfile', () => {
    it('should create profile successfully', async () => {
      // Mock request body
      req.body = {
        name: 'New Profile',
        age: 25,
        language: 'en'
      };
      
      // Mock profileService.createProfile
      const mockCreatedProfile = {
        profile_id: 3,
        user_id: 1,
        name: 'New Profile',
        age: 25,
        language: 'en'
      };
      profileService.createProfile.mockResolvedValue(mockCreatedProfile);
      
      // Mock profileService.getUserProfiles for profile limit check
      profileService.getUserProfiles.mockResolvedValue([{ profile_id: 1 }, { profile_id: 2 }]);
      
      // Call the method
      await profileController.createProfile(req, res);
      
      // Assertions
      expect(profileService.getUserProfiles).toHaveBeenCalledWith(1);
      expect(profileService.createProfile).toHaveBeenCalledWith(1, req.body);
      expect(profileController.handleSuccess).toHaveBeenCalledWith(
        req, 
        res, 
        201, 
        { profile: mockCreatedProfile }
      );
      expect(profileController.handleError).not.toHaveBeenCalled();
    });
    
    it('should return 400 if name is missing', async () => {
      // Request body without name
      req.body = {
        age: 25
      };
      
      // Call the method
      await profileController.createProfile(req, res);
      
      // Assertions
      expect(profileService.createProfile).not.toHaveBeenCalled();
      expect(profileController.handleError).toHaveBeenCalledWith(
        req, 
        res, 
        400, 
        "Missing required fields: name"
      );
      expect(profileController.handleSuccess).not.toHaveBeenCalled();
    });
    
    it('should return 403 if maximum profile limit reached', async () => {
      // Mock request body
      req.body = {
        name: 'New Profile',
        age: 25
      };
      
      // Mock profileService.getUserProfiles to return 5 profiles (max limit)
      profileService.getUserProfiles.mockResolvedValue([
        { profile_id: 1 }, 
        { profile_id: 2 },
        { profile_id: 3 },
        { profile_id: 4 },
        { profile_id: 5 }
      ]);
      
      // Call the method
      await profileController.createProfile(req, res);
      
      // Assertions
      expect(profileService.getUserProfiles).toHaveBeenCalledWith(1);
      expect(profileService.createProfile).not.toHaveBeenCalled();
      expect(profileController.handleError).toHaveBeenCalledWith(
        req, 
        res, 
        403, 
        "Maximum profile limit reached (5 profiles)"
      );
      expect(profileController.handleSuccess).not.toHaveBeenCalled();
    });
    
    it('should return 409 if profile name already exists', async () => {
      // Mock request body
      req.body = {
        name: 'Existing Profile',
        age: 25
      };
      
      // Mock profileService.getUserProfiles to return fewer than 5 profiles
      profileService.getUserProfiles.mockResolvedValue([{}, {}, {}]); // 3 profiles
      
      // Mock profileService.createProfile to throw a unique constraint error
      const error = new Error('Unique constraint violation');
      error.name = 'SequelizeUniqueConstraintError';
      profileService.createProfile.mockRejectedValue(error);
      
      // Call the method
      await profileController.createProfile(req, res);
      
      // Assertions
      expect(profileService.getUserProfiles).toHaveBeenCalledWith(1);
      expect(profileService.createProfile).toHaveBeenCalledWith(1, req.body);
      expect(profileController.handleError).toHaveBeenCalledWith(
        req, 
        res, 
        409, 
        "A profile with this name already exists for this user"
      );
      expect(profileController.handleSuccess).not.toHaveBeenCalled();
    });
    
    it('should return 422 if validation error occurs', async () => {
      // Mock request body
      req.body = {
        name: 'Invalid Profile',
        age: 'not-a-number' // Invalid age
      };
      
      // Mock profileService.getUserProfiles to return fewer than 5 profiles
      profileService.getUserProfiles.mockResolvedValue([{}, {}]); // 2 profiles
      
      // Mock profileService.createProfile to throw a validation error
      const error = new Error('Validation error: Age must be a number');
      error.name = 'SequelizeValidationError';
      profileService.createProfile.mockRejectedValue(error);
      
      // Call the method
      await profileController.createProfile(req, res);
      
      // Assertions
      expect(profileService.getUserProfiles).toHaveBeenCalledWith(1);
      expect(profileService.createProfile).toHaveBeenCalledWith(1, req.body);
      expect(profileController.handleError).toHaveBeenCalledWith(
        req, 
        res, 
        422, 
        "Invalid profile data provided",
        error.message
      );
      expect(profileController.handleSuccess).not.toHaveBeenCalled();
    });
    
    it('should handle errors', async () => {
      // Mock request body
      req.body = {
        name: 'New Profile',
        age: 25
      };
      
      // Mock profileService.getUserProfiles
      profileService.getUserProfiles.mockResolvedValue([{ profile_id: 1 }]);
      
      // Mock profileService.createProfile to throw an error
      const error = new Error('Database error');
      profileService.createProfile.mockRejectedValue(error);
      
      // Call the method
      await profileController.createProfile(req, res);
      
      // Assertions
      expect(profileService.getUserProfiles).toHaveBeenCalledWith(1);
      expect(profileService.createProfile).toHaveBeenCalledWith(1, req.body);
      expect(profileController.handleError).toHaveBeenCalledWith(
        req, 
        res, 
        500, 
        "Error creating profile",
        error.message
      );
      expect(profileController.handleSuccess).not.toHaveBeenCalled();
    });
  });
  
  describe('updateProfile', () => {
    it('should update profile successfully', async () => {
      // Mock request parameters and body
      req.params = {
        profileId: '1'
      };
      req.body = {
        name: 'Updated Profile',
        age: 26
      };
      
      // Mock Profile.findByPk
      const mockProfile = {
        profile_id: 1,
        user_id: 1,
        name: 'Test Profile',
        age: 25
      };
      Profile.findByPk.mockResolvedValue(mockProfile);
      
      // Mock profileService.updateProfile
      const mockUpdatedProfile = {
        profile_id: 1,
        user_id: 1,
        name: 'Updated Profile',
        age: 26
      };
      profileService.updateProfile.mockResolvedValue(mockUpdatedProfile);
      
      // Call the method
      await profileController.updateProfile(req, res);
      
      // Assertions
      expect(Profile.findByPk).toHaveBeenCalledWith('1');
      expect(profileService.updateProfile).toHaveBeenCalledWith('1', req.body);
      expect(profileController.handleSuccess).toHaveBeenCalledWith(
        req, 
        res, 
        200, 
        { profile: mockUpdatedProfile }
      );
      expect(profileController.handleError).not.toHaveBeenCalled();
    });
    
    it('should return 400 if profile ID is missing', async () => {
      // Empty request parameters
      req.params = {};
      req.body = {
        name: 'Updated Profile'
      };
      
      // Call the method
      await profileController.updateProfile(req, res);
      
      // Assertions
      expect(Profile.findByPk).not.toHaveBeenCalled();
      expect(profileController.handleError).toHaveBeenCalledWith(
        req, 
        res, 
        400, 
        "Profile ID is required"
      );
      expect(profileController.handleSuccess).not.toHaveBeenCalled();
    });
    
    it('should return 404 if profile is not found', async () => {
      // Mock request parameters and body
      req.params = {
        profileId: '999'
      };
      req.body = {
        name: 'Updated Profile'
      };
      
      // Mock Profile.findByPk to return null
      Profile.findByPk.mockResolvedValue(null);
      
      // Call the method
      await profileController.updateProfile(req, res);
      
      // Assertions
      expect(Profile.findByPk).toHaveBeenCalledWith('999');
      expect(profileController.handleError).toHaveBeenCalledWith(
        req, 
        res, 
        404, 
        "Profile not found"
      );
      expect(profileController.handleSuccess).not.toHaveBeenCalled();
    });
    
    it('should return 403 if profile belongs to another user', async () => {
      // Mock request parameters and body
      req.params = {
        profileId: '1'
      };
      req.body = {
        name: 'Updated Profile'
      };
      req.userId = 1;
      
      // Mock Profile.findByPk
      const mockProfile = {
        profile_id: 1,
        user_id: 2, // Different user ID
        name: 'Test Profile'
      };
      Profile.findByPk.mockResolvedValue(mockProfile);
      
      // Call the method
      await profileController.updateProfile(req, res);
      
      // Assertions
      expect(Profile.findByPk).toHaveBeenCalledWith('1');
      expect(profileController.handleError).toHaveBeenCalledWith(
        req, 
        res, 
        403, 
        "You don't have permission to update this profile"
      );
      expect(profileController.handleSuccess).not.toHaveBeenCalled();
    });
    
    it('should return 409 if profile name already exists', async () => {
      // Mock request parameters and body
      req.params = {
        profileId: '1'
      };
      req.body = {
        name: 'Existing Profile'
      };
      
      // Mock Profile.findByPk
      const mockProfile = {
        profile_id: 1,
        user_id: 1,
        name: 'Test Profile'
      };
      Profile.findByPk.mockResolvedValue(mockProfile);
      
      // Mock profileService.updateProfile to throw unique constraint error
      const error = new Error('Duplicate profile name');
      error.name = 'SequelizeUniqueConstraintError';
      profileService.updateProfile.mockRejectedValue(error);
      
      // Call the method
      await profileController.updateProfile(req, res);
      
      // Assertions
      expect(Profile.findByPk).toHaveBeenCalledWith('1');
      expect(profileService.updateProfile).toHaveBeenCalledWith('1', req.body);
      expect(profileController.handleError).toHaveBeenCalledWith(
        req, 
        res, 
        409, 
        "A profile with this name already exists for this user"
      );
      expect(profileController.handleSuccess).not.toHaveBeenCalled();
    });
    
    it('should return 422 if validation error occurs', async () => {
      // Mock request parameters and body
      req.params = {
        profileId: '1'
      };
      req.body = {
        age: 'invalid age'
      };
      
      // Mock Profile.findByPk
      const mockProfile = {
        profile_id: 1,
        user_id: 1,
        name: 'Test Profile'
      };
      Profile.findByPk.mockResolvedValue(mockProfile);
      
      // Mock profileService.updateProfile to throw validation error
      const error = new Error('Validation error');
      error.name = 'SequelizeValidationError';
      profileService.updateProfile.mockRejectedValue(error);
      
      // Call the method
      await profileController.updateProfile(req, res);
      
      // Assertions
      expect(Profile.findByPk).toHaveBeenCalledWith('1');
      expect(profileService.updateProfile).toHaveBeenCalledWith('1', req.body);
      expect(profileController.handleError).toHaveBeenCalledWith(
        req, 
        res, 
        422, 
        "Invalid profile data provided",
        error.message
      );
      expect(profileController.handleSuccess).not.toHaveBeenCalled();
    });
    
    it('should handle general errors', async () => {
      // Mock request parameters and body
      req.params = {
        profileId: '1'
      };
      req.body = {
        name: 'Updated Profile'
      };
      
      // Mock Profile.findByPk
      const mockProfile = {
        profile_id: 1,
        user_id: 1,
        name: 'Test Profile'
      };
      Profile.findByPk.mockResolvedValue(mockProfile);
      
      // Mock profileService.updateProfile to throw general error
      const error = new Error('Update error');
      profileService.updateProfile.mockRejectedValue(error);
      
      // Call the method
      await profileController.updateProfile(req, res);
      
      // Assertions
      expect(Profile.findByPk).toHaveBeenCalledWith('1');
      expect(profileService.updateProfile).toHaveBeenCalledWith('1', req.body);
      expect(profileController.handleError).toHaveBeenCalledWith(
        req, 
        res, 
        500, 
        "Error updating profile",
        error.message
      );
      expect(profileController.handleSuccess).not.toHaveBeenCalled();
    });
  });
  
  describe('deleteProfile', () => {
    it('should delete profile successfully', async () => {
      // Mock request parameters
      req.params = {
        profileId: '1'
      };
      
      // Mock Profile.findByPk
      const mockProfile = {
        profile_id: 1,
        user_id: 1,
        name: 'Test Profile'
      };
      Profile.findByPk.mockResolvedValue(mockProfile);
      
      // Mock profileService.deleteProfile
      profileService.deleteProfile.mockResolvedValue(true);
      
      // Call the method
      await profileController.deleteProfile(req, res);
      
      // Assertions
      expect(Profile.findByPk).toHaveBeenCalledWith('1');
      expect(profileService.deleteProfile).toHaveBeenCalledWith('1');
      expect(profileController.handleSuccess).toHaveBeenCalledWith(
        req, 
        res, 
        204, 
        { message: "Profile deleted successfully" }
      );
      expect(profileController.handleError).not.toHaveBeenCalled();
    });
    
    it('should return 400 if profile ID is missing', async () => {
      // Empty request parameters
      req.params = {};
      
      // Call the method
      await profileController.deleteProfile(req, res);
      
      // Assertions
      expect(Profile.findByPk).not.toHaveBeenCalled();
      expect(profileController.handleError).toHaveBeenCalledWith(
        req, 
        res, 
        400, 
        "Profile ID is required"
      );
      expect(profileController.handleSuccess).not.toHaveBeenCalled();
    });
    
    it('should return 404 if profile is not found', async () => {
      // Mock request parameters
      req.params = {
        profileId: '999'
      };
      
      // Mock Profile.findByPk to return null
      Profile.findByPk.mockResolvedValue(null);
      
      // Call the method
      await profileController.deleteProfile(req, res);
      
      // Assertions
      expect(Profile.findByPk).toHaveBeenCalledWith('999');
      expect(profileController.handleError).toHaveBeenCalledWith(
        req, 
        res, 
        404, 
        "Profile not found"
      );
      expect(profileController.handleSuccess).not.toHaveBeenCalled();
    });
    
    it('should return 403 if profile belongs to another user', async () => {
      // Mock request parameters
      req.params = {
        profileId: '1'
      };
      req.userId = 1;
      
      // Mock Profile.findByPk
      const mockProfile = {
        profile_id: 1,
        user_id: 2, // Different user ID
        name: 'Test Profile'
      };
      Profile.findByPk.mockResolvedValue(mockProfile);
      
      // Call the method
      await profileController.deleteProfile(req, res);
      
      // Assertions
      expect(Profile.findByPk).toHaveBeenCalledWith('1');
      expect(profileController.handleError).toHaveBeenCalledWith(
        req, 
        res, 
        403, 
        "You don't have permission to delete this profile"
      );
      expect(profileController.handleSuccess).not.toHaveBeenCalled();
    });
    
    it('should handle foreign key constraint errors', async () => {
      // Mock request parameters
      req.params = {
        profileId: '1'
      };
      
      // Mock Profile.findByPk
      const mockProfile = {
        profile_id: 1,
        user_id: 1,
        name: 'Test Profile'
      };
      Profile.findByPk.mockResolvedValue(mockProfile);
      
      // Mock profileService.deleteProfile to throw foreign key constraint error
      const error = new Error('Cannot delete or update a parent row: a foreign key constraint fails');
      profileService.deleteProfile.mockRejectedValue(error);
      
      // Call the method
      await profileController.deleteProfile(req, res);
      
      // Assertions
      expect(Profile.findByPk).toHaveBeenCalledWith('1');
      expect(profileService.deleteProfile).toHaveBeenCalledWith('1');
      expect(profileController.handleError).toHaveBeenCalledWith(
        req, 
        res, 
        409, 
        "Cannot delete profile as it has associated data"
      );
      expect(profileController.handleSuccess).not.toHaveBeenCalled();
    });
    
    it('should handle general errors', async () => {
      // Mock request parameters
      req.params = {
        profileId: '1'
      };
      
      // Mock Profile.findByPk
      const mockProfile = {
        profile_id: 1,
        user_id: 1,
        name: 'Test Profile'
      };
      Profile.findByPk.mockResolvedValue(mockProfile);
      
      // Mock profileService.deleteProfile to throw general error
      const error = new Error('Delete error');
      profileService.deleteProfile.mockRejectedValue(error);
      
      // Call the method
      await profileController.deleteProfile(req, res);
      
      // Assertions
      expect(Profile.findByPk).toHaveBeenCalledWith('1');
      expect(profileService.deleteProfile).toHaveBeenCalledWith('1');
      expect(profileController.handleError).toHaveBeenCalledWith(
        req, 
        res, 
        500, 
        "Error deleting profile",
        error.message
      );
      expect(profileController.handleSuccess).not.toHaveBeenCalled();
    });
  });
  
  describe('getAgeAppropriateContent', () => {
    it('should get age-appropriate content successfully', async () => {
      // Mock request parameters
      req.params = {
        profileId: '1'
      };
      
      // Mock Profile.findByPk
      const mockProfile = {
        profile_id: 1,
        user_id: 1,
        name: 'Test Profile',
        age: 12
      };
      Profile.findByPk.mockResolvedValue(mockProfile);
      
      // Mock profileService.getAgeAppropriateContent
      const mockContent = [
        { media_id: 1, title: 'Kid Movie 1', classification: 'G' },
        { media_id: 2, title: 'Kid Movie 2', classification: 'PG' }
      ];
      profileService.getAgeAppropriateContent.mockResolvedValue(mockContent);
      
      // Call the method
      await profileController.getAgeAppropriateContent(req, res);
      
      // Assertions
      expect(Profile.findByPk).toHaveBeenCalledWith('1');
      expect(profileService.getAgeAppropriateContent).toHaveBeenCalledWith('1', 20);
      expect(profileController.handleSuccess).toHaveBeenCalledWith(
        req, 
        res, 
        200, 
        { content: mockContent }
      );
      expect(profileController.handleError).not.toHaveBeenCalled();
    });
    
    it('should use limit from query parameters if provided', async () => {
      // Mock request parameters and query
      req.params = {
        profileId: '1'
      };
      req.query = {
        limit: '5'
      };
      
      // Mock Profile.findByPk
      const mockProfile = {
        profile_id: 1,
        user_id: 1,
        name: 'Test Profile',
        age: 12
      };
      Profile.findByPk.mockResolvedValue(mockProfile);
      
      // Mock profileService.getAgeAppropriateContent
      const mockContent = [
        { media_id: 1, title: 'Kid Movie 1', classification: 'G' }
      ];
      profileService.getAgeAppropriateContent.mockResolvedValue(mockContent);
      
      // Call the method
      await profileController.getAgeAppropriateContent(req, res);
      
      // Assertions
      expect(profileService.getAgeAppropriateContent).toHaveBeenCalledWith('1', 5);
      expect(profileController.handleSuccess).toHaveBeenCalledWith(
        req, 
        res, 
        200, 
        { content: mockContent }
      );
    });
    
    it('should return 400 if profile ID is missing', async () => {
      // Empty request parameters
      req.params = {};
      
      // Call the method
      await profileController.getAgeAppropriateContent(req, res);
      
      // Assertions
      expect(Profile.findByPk).not.toHaveBeenCalled();
      expect(profileController.handleError).toHaveBeenCalledWith(
        req, 
        res, 
        400, 
        "Profile ID is required"
      );
      expect(profileController.handleSuccess).not.toHaveBeenCalled();
    });
    
    it('should return 404 if profile is not found', async () => {
      // Mock request parameters
      req.params = {
        profileId: '999'
      };
      
      // Mock Profile.findByPk to return null
      Profile.findByPk.mockResolvedValue(null);
      
      // Call the method
      await profileController.getAgeAppropriateContent(req, res);
      
      // Assertions
      expect(Profile.findByPk).toHaveBeenCalledWith('999');
      expect(profileController.handleError).toHaveBeenCalledWith(
        req, 
        res, 
        404, 
        "Profile not found"
      );
      expect(profileController.handleSuccess).not.toHaveBeenCalled();
    });
    
    it('should return 403 if profile belongs to another user', async () => {
      // Mock request parameters
      req.params = {
        profileId: '1'
      };
      req.userId = 1;
      
      // Mock Profile.findByPk
      const mockProfile = {
        profile_id: 1,
        user_id: 2, // Different user ID
        name: 'Test Profile',
        age: 12
      };
      Profile.findByPk.mockResolvedValue(mockProfile);
      
      // Call the method
      await profileController.getAgeAppropriateContent(req, res);
      
      // Assertions
      expect(Profile.findByPk).toHaveBeenCalledWith('1');
      expect(profileController.handleError).toHaveBeenCalledWith(
        req, 
        res, 
        403, 
        "You don't have permission to access this profile's content"
      );
      expect(profileController.handleSuccess).not.toHaveBeenCalled();
    });
    
    it('should handle database errors', async () => {
      // Mock request parameters
      req.params = {
        profileId: '1'
      };
      
      // Mock Profile.findByPk
      const mockProfile = {
        profile_id: 1,
        user_id: 1,
        name: 'Test Profile',
        age: 12
      };
      Profile.findByPk.mockResolvedValue(mockProfile);
      
      // Mock profileService.getAgeAppropriateContent to throw database error
      const error = new Error('Invalid input syntax');
      error.name = 'SequelizeDatabaseError';
      profileService.getAgeAppropriateContent.mockRejectedValue(error);
      
      // Call the method
      await profileController.getAgeAppropriateContent(req, res);
      
      // Assertions
      expect(Profile.findByPk).toHaveBeenCalledWith('1');
      expect(profileService.getAgeAppropriateContent).toHaveBeenCalledWith('1', 20);
      expect(profileController.handleError).toHaveBeenCalledWith(
        req, 
        res, 
        400, 
        "Invalid request parameters",
        error.message
      );
      expect(profileController.handleSuccess).not.toHaveBeenCalled();
    });
    
    it('should handle general errors', async () => {
      // Mock request parameters
      req.params = {
        profileId: '1'
      };
      
      // Mock Profile.findByPk
      const mockProfile = {
        profile_id: 1,
        user_id: 1,
        name: 'Test Profile',
        age: 12
      };
      Profile.findByPk.mockResolvedValue(mockProfile);
      
      // Mock profileService.getAgeAppropriateContent to throw general error
      const error = new Error('Service error');
      profileService.getAgeAppropriateContent.mockRejectedValue(error);
      
      // Call the method
      await profileController.getAgeAppropriateContent(req, res);
      
      // Assertions
      expect(Profile.findByPk).toHaveBeenCalledWith('1');
      expect(profileService.getAgeAppropriateContent).toHaveBeenCalledWith('1', 20);
      expect(profileController.handleError).toHaveBeenCalledWith(
        req, 
        res, 
        500, 
        "Error retrieving content",
        error.message
      );
      expect(profileController.handleSuccess).not.toHaveBeenCalled();
    });
  });
});
