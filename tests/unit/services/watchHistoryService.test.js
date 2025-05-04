/**
 * Unit tests for the Watch History Service
 */
const watchHistoryService = require('../../../src/services/watchHistoryService');
const { WatchHistory } = require('../../../src/models/WatchHistory');
const { Media } = require('../../../src/models/Media');
const { Profile } = require('../../../src/models/Profile');
const sequelize = require('../../../src/config/sequelize');
const DbUtils = require('../../../src/utils/dbUtils');

// Mock dependencies
jest.mock('../../../src/models/WatchHistory', () => ({
  WatchHistory: {
    findOne: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn()
  }
}));

jest.mock('../../../src/models/Media', () => ({
  Media: {}
}));

jest.mock('../../../src/models/Profile', () => ({
  Profile: {}
}));

jest.mock('../../../src/config/sequelize', () => ({
  query: jest.fn(),
  transaction: jest.fn().mockImplementation(() => ({
    commit: jest.fn().mockResolvedValue(),
    rollback: jest.fn().mockResolvedValue()
  })),
  QueryTypes: {
    SELECT: 'SELECT'
  }
}));

jest.mock('../../../src/utils/dbUtils', () => ({
  callProcedure: jest.fn()
}));

describe('WatchHistoryService', () => {
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('getHistory', () => {
    it('should get watch history for a profile', async () => {
      // Mock data
      const profileId = 1;
      const limit = 20;
      const mockHistory = [
        { history_id: 1, profile_id: 1, media_id: 1, watched_at: new Date() },
        { history_id: 2, profile_id: 1, media_id: 2, watched_at: new Date() }
      ];

      // Mock sequelize.query to return mock history
      sequelize.query.mockResolvedValue(mockHistory);

      // Call the method
      const result = await watchHistoryService.getHistory(profileId, limit);

      // Assertions
      expect(sequelize.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM "watch_history_details"'),
        expect.objectContaining({
          replacements: { profileId, limit },
          type: sequelize.QueryTypes.SELECT
        })
      );
      expect(result).toEqual(mockHistory);
    });

    it('should use default limit if not provided', async () => {
      // Mock data
      const profileId = 1;
      const mockHistory = [];

      // Mock sequelize.query to return mock history
      sequelize.query.mockResolvedValue(mockHistory);

      // Call the method
      await watchHistoryService.getHistory(profileId);

      // Assertions
      expect(sequelize.query).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          replacements: { profileId, limit: 20 },
          type: sequelize.QueryTypes.SELECT
        })
      );
    });

    it('should throw an error if query fails', async () => {
      // Mock data
      const profileId = 1;
      const error = new Error('Database error');

      // Mock sequelize.query to throw an error
      sequelize.query.mockRejectedValue(error);

      // Call the method and expect it to throw
      await expect(watchHistoryService.getHistory(profileId)).rejects.toThrow(error);
    });
  });

  describe('markAsWatched', () => {
    it('should update existing watch history record', async () => {
      // Mock data
      const profileId = 1;
      const mediaId = 2;
      const progress = 75;
      
      // Mock existing watch history record
      const mockWatchHistory = {
        id: 1,
        profile_id: profileId,
        media_id: mediaId,
        progress: 50,
        watched_at: new Date(Date.now() - 86400000), // 1 day ago
        update: jest.fn().mockResolvedValue({
          id: 1,
          profile_id: profileId,
          media_id: mediaId,
          progress: progress,
          watched_at: new Date()
        })
      };

      // Mock WatchHistory.findOne to return existing record
      WatchHistory.findOne.mockResolvedValue(mockWatchHistory);

      // Mock WatchHistory.findByPk to return the updated record with associations
      const mockUpdatedHistory = {
        id: 1,
        profile_id: profileId,
        media_id: mediaId,
        progress: progress,
        watched_at: new Date()
      };
      WatchHistory.findByPk.mockResolvedValue(mockUpdatedHistory);

      // Call the method
      const result = await watchHistoryService.markAsWatched(profileId, mediaId, progress);

      // Assertions
      expect(sequelize.transaction).toHaveBeenCalled();
      expect(WatchHistory.findOne).toHaveBeenCalledWith({
        where: {
          profile_id: profileId,
          media_id: mediaId
        },
        transaction: expect.anything()
      });
      expect(mockWatchHistory.update).toHaveBeenCalledWith({
        progress,
        watched_at: expect.any(Date)
      }, { transaction: expect.anything() });
      expect(WatchHistory.findByPk).toHaveBeenCalledWith(1, {
        include: [
          { model: Media },
          { model: Profile }
        ]
      });
      expect(result).toEqual(mockUpdatedHistory);
    });

    it('should create new watch history record if none exists', async () => {
      // Mock data
      const profileId = 1;
      const mediaId = 2;
      const progress = 100;
      
      // Mock WatchHistory.findOne to return null (no existing record)
      WatchHistory.findOne.mockResolvedValue(null);

      // Mock WatchHistory.create to return a new record
      const mockNewHistory = {
        id: 1,
        profile_id: profileId,
        media_id: mediaId,
        progress: progress,
        watched_at: new Date()
      };
      WatchHistory.create.mockResolvedValue(mockNewHistory);

      // Mock WatchHistory.findByPk to return the new record with associations
      WatchHistory.findByPk.mockResolvedValue(mockNewHistory);

      // Call the method
      const result = await watchHistoryService.markAsWatched(profileId, mediaId);

      // Assertions
      expect(sequelize.transaction).toHaveBeenCalled();
      expect(WatchHistory.findOne).toHaveBeenCalledWith({
        where: {
          profile_id: profileId,
          media_id: mediaId
        },
        transaction: expect.anything()
      });
      expect(WatchHistory.create).toHaveBeenCalledWith({
        profile_id: profileId,
        media_id: mediaId,
        progress: 100,
        watched_at: expect.any(Date)
      }, { transaction: expect.anything() });
      expect(WatchHistory.findByPk).toHaveBeenCalledWith(1, {
        include: [
          { model: Media },
          { model: Profile }
        ]
      });
      expect(result).toEqual(mockNewHistory);
    });

    it('should use default progress if not provided', async () => {
      // Mock data
      const profileId = 1;
      const mediaId = 2;
      
      // Mock WatchHistory.findOne to return null
      WatchHistory.findOne.mockResolvedValue(null);

      // Mock WatchHistory.create to return a new record
      const mockNewHistory = {
        id: 1,
        profile_id: profileId,
        media_id: mediaId,
        progress: 100,
        watched_at: new Date()
      };
      WatchHistory.create.mockResolvedValue(mockNewHistory);

      // Mock WatchHistory.findByPk
      WatchHistory.findByPk.mockResolvedValue(mockNewHistory);

      // Call the method without progress parameter
      await watchHistoryService.markAsWatched(profileId, mediaId);

      // Assertions
      expect(WatchHistory.create).toHaveBeenCalledWith({
        profile_id: profileId,
        media_id: mediaId,
        progress: 100,
        watched_at: expect.any(Date)
      }, { transaction: expect.anything() });
    });

    it('should rollback transaction if an error occurs', async () => {
      // Mock data
      const profileId = 1;
      const mediaId = 2;
      const error = new Error('Database error');
      
      // Create transaction mock with rollback method
      const mockTransaction = {
        commit: jest.fn(),
        rollback: jest.fn().mockResolvedValue(undefined)
      };
      
      // Mock sequelize.transaction to return our mock transaction
      sequelize.transaction.mockReturnValue(mockTransaction);
      
      // Mock WatchHistory.findOne to throw an error
      WatchHistory.findOne.mockRejectedValue(error);

      // Call the method and expect it to throw
      await expect(watchHistoryService.markAsWatched(profileId, mediaId)).rejects.toThrow(error);

      // Assertions
      expect(sequelize.transaction).toHaveBeenCalled();
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });
  });

  describe('updateHistory', () => {
    it('should update watch history record', async () => {
      // Mock data
      const historyId = 1;
      const updateData = { progress: 75 };
      
      // Mock watch history record
      const mockWatchHistory = {
        id: historyId,
        profile_id: 1,
        media_id: 2,
        progress: 50,
        watched_at: new Date(),
        update: jest.fn().mockResolvedValue({
          id: historyId,
          profile_id: 1,
          media_id: 2,
          progress: 75,
          watched_at: new Date()
        })
      };

      // Mock WatchHistory.findByPk
      WatchHistory.findByPk.mockResolvedValueOnce(mockWatchHistory);
      
      // Mock the second findByPk call to return the updated record with associations
      const mockUpdatedHistory = {
        id: historyId,
        profile_id: 1,
        media_id: 2,
        progress: 75,
        watched_at: new Date()
      };
      WatchHistory.findByPk.mockResolvedValueOnce(mockUpdatedHistory);

      // Call the method
      const result = await watchHistoryService.updateHistory(historyId, updateData);

      // Assertions
      expect(WatchHistory.findByPk).toHaveBeenCalledWith(historyId);
      expect(mockWatchHistory.update).toHaveBeenCalledWith(updateData);
      expect(WatchHistory.findByPk).toHaveBeenCalledWith(historyId, {
        include: [
          { model: Media },
          { model: Profile }
        ]
      });
      expect(result).toEqual(mockUpdatedHistory);
    });

    it('should return null if watch history record not found', async () => {
      // Mock data
      const historyId = 999;
      const updateData = { progress: 75 };
      
      // Mock WatchHistory.findByPk to return null
      WatchHistory.findByPk.mockResolvedValue(null);

      // Call the method
      const result = await watchHistoryService.updateHistory(historyId, updateData);

      // Assertions
      expect(WatchHistory.findByPk).toHaveBeenCalledWith(historyId);
      expect(result).toBeNull();
    });

    it('should throw an error if update fails', async () => {
      // Mock data
      const historyId = 1;
      const updateData = { progress: 75 };
      const error = new Error('Database error');
      
      // Mock WatchHistory.findByPk to throw an error
      WatchHistory.findByPk.mockRejectedValue(error);

      // Call the method and expect it to throw
      await expect(watchHistoryService.updateHistory(historyId, updateData)).rejects.toThrow(error);
    });
  });

  describe('deleteHistory', () => {
    it('should delete watch history record', async () => {
      // Mock data
      const historyId = 1;
      
      // Mock watch history record
      const mockWatchHistory = {
        id: historyId,
        profile_id: 1,
        media_id: 2,
        destroy: jest.fn().mockResolvedValue(true)
      };

      // Mock WatchHistory.findByPk
      WatchHistory.findByPk.mockResolvedValue(mockWatchHistory);

      // Call the method
      const result = await watchHistoryService.deleteHistory(historyId);

      // Assertions
      expect(WatchHistory.findByPk).toHaveBeenCalledWith(historyId);
      expect(mockWatchHistory.destroy).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should return false if watch history record not found', async () => {
      // Mock data
      const historyId = 999;
      
      // Mock WatchHistory.findByPk to return null
      WatchHistory.findByPk.mockResolvedValue(null);

      // Call the method
      const result = await watchHistoryService.deleteHistory(historyId);

      // Assertions
      expect(WatchHistory.findByPk).toHaveBeenCalledWith(historyId);
      expect(result).toBe(false);
    });

    it('should throw an error if delete fails', async () => {
      // Mock data
      const historyId = 1;
      const error = new Error('Database error');
      
      // Mock WatchHistory.findByPk to throw an error
      WatchHistory.findByPk.mockRejectedValue(error);

      // Call the method and expect it to throw
      await expect(watchHistoryService.deleteHistory(historyId)).rejects.toThrow(error);
    });
  });

  describe('getRecommendations', () => {
    it('should get recommendations based on watch history', async () => {
      // Mock data
      const profileId = 1;
      const limit = 10;
      const mockRecommendations = [
        { media_id: 3, title: 'Recommended Movie 1' },
        { media_id: 4, title: 'Recommended Movie 2' }
      ];

      // Mock DbUtils.callProcedure
      DbUtils.callProcedure.mockResolvedValue(mockRecommendations);

      // Call the method
      const result = await watchHistoryService.getRecommendations(profileId, limit);

      // Assertions
      expect(DbUtils.callProcedure).toHaveBeenCalledWith('GetRecommendedContent', [profileId, limit]);
      expect(result).toEqual(mockRecommendations);
    });

    it('should use default limit if not provided', async () => {
      // Mock data
      const profileId = 1;
      const mockRecommendations = [];

      // Mock DbUtils.callProcedure
      DbUtils.callProcedure.mockResolvedValue(mockRecommendations);

      // Call the method
      await watchHistoryService.getRecommendations(profileId);

      // Assertions
      expect(DbUtils.callProcedure).toHaveBeenCalledWith('GetRecommendedContent', [profileId, 10]);
    });

    it('should throw an error if getting recommendations fails', async () => {
      // Mock data
      const profileId = 1;
      const error = new Error('Database error');

      // Mock DbUtils.callProcedure to throw an error
      DbUtils.callProcedure.mockRejectedValue(error);

      // Call the method and expect it to throw
      await expect(watchHistoryService.getRecommendations(profileId)).rejects.toThrow(error);
    });
  });
});
