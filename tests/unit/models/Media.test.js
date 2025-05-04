const { Media } = require('../../mocks/models');

describe('Media Model', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  describe('findByPk', () => {
    it('should return a media item when given a valid ID', async () => {
      const media = await Media.findByPk(1);
      
      expect(Media.findByPk).toHaveBeenCalledWith(1);
      expect(media).toEqual({
        media_id: 1,
        season_id: 1,
        episode_number: 1,
        title: 'Test Episode',
        duration: '00:45:00',
        release_date: new Date('2023-01-01'),
        description: 'A test episode for testing',
        classification: 'PG-13'
      });
    });

    it('should be able to mock a different return value', async () => {
      // Override the mock for this specific test
      Media.findByPk.mockResolvedValueOnce({
        media_id: 2,
        season_id: 1,
        episode_number: 2,
        title: 'Another Episode',
        duration: '00:50:00',
        release_date: new Date('2023-01-08'),
        description: 'Another test episode',
        classification: 'R'
      });
      
      const media = await Media.findByPk(2);
      
      expect(Media.findByPk).toHaveBeenCalledWith(2);
      expect(media.title).toBe('Another Episode');
      expect(media.episode_number).toBe(2);
    });
  });

  describe('findAll', () => {
    it('should return an empty array by default', async () => {
      const mediaItems = await Media.findAll();
      
      expect(Media.findAll).toHaveBeenCalled();
      expect(mediaItems).toEqual([]);
    });
    
    it('should be able to mock a list of media items', async () => {
      // Override the mock for this specific test
      Media.findAll.mockResolvedValueOnce([
        {
          media_id: 1,
          season_id: 1,
          episode_number: 1,
          title: 'Test Episode 1',
          duration: '00:45:00',
          release_date: new Date('2023-01-01'),
          description: 'First test episode',
          classification: 'PG-13'
        },
        {
          media_id: 2,
          season_id: 1,
          episode_number: 2,
          title: 'Test Episode 2',
          duration: '00:50:00',
          release_date: new Date('2023-01-08'),
          description: 'Second test episode',
          classification: 'R'
        }
      ]);
      
      const mediaItems = await Media.findAll();
      
      expect(Media.findAll).toHaveBeenCalled();
      expect(mediaItems.length).toBe(2);
      expect(mediaItems[0].title).toBe('Test Episode 1');
      expect(mediaItems[1].title).toBe('Test Episode 2');
    });
  });

  describe('create', () => {
    it('should call create with the provided media data', async () => {
      const mediaData = {
        season_id: 1,
        episode_number: 3,
        title: 'New Episode',
        duration: '00:40:00',
        release_date: new Date('2023-01-15'),
        description: 'A new test episode',
        classification: 'PG'
      };
      
      await Media.create(mediaData);
      
      expect(Media.create).toHaveBeenCalledWith(mediaData);
    });
    
    it('should be able to mock a created media item', async () => {
      const mediaData = {
        season_id: 1,
        episode_number: 3,
        title: 'New Episode',
        duration: '00:40:00',
        release_date: new Date('2023-01-15'),
        description: 'A new test episode',
        classification: 'PG'
      };
      
      Media.create.mockResolvedValueOnce({
        media_id: 3,
        ...mediaData
      });
      
      const media = await Media.create(mediaData);
      
      expect(Media.create).toHaveBeenCalledWith(mediaData);
      expect(media.media_id).toBe(3);
      expect(media.title).toBe('New Episode');
    });
  });

  describe('update', () => {
    it('should call update with the provided media data and options', async () => {
      const mediaData = {
        title: 'Updated Episode',
        description: 'Updated description for episode'
      };
      const options = { where: { media_id: 1 } };
      
      await Media.update(mediaData, options);
      
      expect(Media.update).toHaveBeenCalledWith(mediaData, options);
    });
  });

  describe('destroy', () => {
    it('should call destroy with the provided options', async () => {
      const options = { where: { media_id: 1 } };
      
      await Media.destroy(options);
      
      expect(Media.destroy).toHaveBeenCalledWith(options);
    });
  });

  describe('getDurationMinutes', () => {
    it('should convert duration string to minutes', () => {
      const media = {
        duration: '01:30:00',
        getDurationMinutes: Media.prototype.getDurationMinutes
      };
      
      const durationMinutes = media.getDurationMinutes();
      
      expect(durationMinutes).toBe(90); // 1 hour and 30 minutes = 90 minutes
    });
    
    it('should handle duration with only minutes and seconds', () => {
      const media = {
        duration: '00:45:30',
        getDurationMinutes: Media.prototype.getDurationMinutes
      };
      
      const durationMinutes = media.getDurationMinutes();
      
      expect(durationMinutes).toBe(45); // 0 hours and 45 minutes = 45 minutes
    });
    
    it('should return 0 if duration is not set', () => {
      const media = {
        duration: null,
        getDurationMinutes: Media.prototype.getDurationMinutes
      };
      
      const durationMinutes = media.getDurationMinutes();
      
      expect(durationMinutes).toBe(0);
    });
    
    it('should return 0 if duration format is invalid', () => {
      const media = {
        duration: 'invalid',
        getDurationMinutes: Media.prototype.getDurationMinutes
      };
      
      const durationMinutes = media.getDurationMinutes();
      
      expect(durationMinutes).toBe(0);
    });
  });

  describe('isNewRelease', () => {
    it('should return true for media released within the last 30 days', () => {
      // Create a media object with a release date and the isNewRelease method
      const media = {
        release_date: new Date(),  // Current date, which is definitely within 30 days
        isNewRelease: Media.prototype.isNewRelease
      };
      
      const isNew = media.isNewRelease();
      
      expect(isNew).toBe(true);
    });
    
    it('should return false for media released more than 30 days ago', () => {
      // Create a date more than 30 days ago
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 40);  // 40 days ago
      
      const media = {
        release_date: oldDate,
        isNewRelease: Media.prototype.isNewRelease
      };
      
      const isNew = media.isNewRelease();
      
      expect(isNew).toBe(false);
    });
    
    it('should return false if release_date is not set', () => {
      const media = {
        release_date: null,
        isNewRelease: Media.prototype.isNewRelease
      };
      
      const isNew = media.isNewRelease();
      
      expect(isNew).toBe(false);
    });
  });

  describe('toXML', () => {
    it('should format media data for XML responses', () => {
      const mediaData = {
        media_id: 1,
        title: 'Test Episode',
        season_id: 1,
        episode_number: 1,
        duration: '00:45:00',
        release_date: new Date('2023-01-01'),
        description: 'A test episode',
        classification: 'PG-13'
      };
      
      const media = {
        get: () => mediaData,
        toXML: Media.prototype.toXML
      };
      
      const xmlData = media.toXML();
      
      expect(xmlData).toEqual({
        episode: {
          id: 1,
          title: 'Test Episode',
          seasonId: 1,
          episodeNumber: 1,
          duration: '00:45:00',
          releaseDate: mediaData.release_date,
          description: 'A test episode',
          classification: 'PG-13'
        }
      });
    });
    
    it('should handle direct data object without get method', () => {
      const media = {
        media_id: 2,
        title: 'Another Episode',
        season_id: 1,
        episode_number: 2,
        duration: '00:50:00',
        release_date: new Date('2023-01-08'),
        description: 'Another test episode',
        classification: 'R',
        toXML: Media.prototype.toXML
      };
      
      const xmlData = media.toXML();
      
      expect(xmlData).toEqual({
        episode: {
          id: 2,
          title: 'Another Episode',
          seasonId: 1,
          episodeNumber: 2,
          duration: '00:50:00',
          releaseDate: media.release_date,
          description: 'Another test episode',
          classification: 'R'
        }
      });
    });
  });
});
