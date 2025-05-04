const BaseModel = require('../../../src/models/BaseModel');
const { Model } = require('sequelize');

describe('BaseModel', () => {
  // Mock instance for testing
  let mockInstance;
  
  beforeEach(() => {
    // Create a mock instance with some data
    mockInstance = {
      get: jest.fn().mockReturnValue({
        id: 1,
        name: 'Test',
        createdAt: new Date(),
        updatedAt: new Date()
      }),
      constructor: {
        name: 'TestModel'
      }
    };
    
    // Apply BaseModel methods to the mock
    Object.setPrototypeOf(mockInstance, BaseModel.prototype);
  });
  
  describe('inheritance', () => {
    it('should extend Sequelize Model', () => {
      expect(BaseModel.prototype instanceof Model).toBe(true);
    });
  });
  
  describe('toJSON', () => {
    it('should return model data in JSON format', () => {
      const result = mockInstance.toJSON();
      
      expect(mockInstance.get).toHaveBeenCalled();
      expect(result).toEqual({
        id: 1,
        name: 'Test',
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date)
      });
    });
  });
  
  describe('toXML', () => {
    it('should return model data in XML-compatible format', () => {
      const result = mockInstance.toXML();
      
      expect(mockInstance.get).toHaveBeenCalled();
      expect(result).toEqual({
        testmodel: {
          id: 1,
          name: 'Test',
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date)
        }
      });
    });
  });
  
  describe('initialize', () => {
    it('should call init with correct parameters', () => {
      // Mock the init method
      const initMock = jest.fn();
      const originalInit = BaseModel.init;
      BaseModel.init = initMock;
      
      // Test parameters
      const attributes = { field: { type: 'string' } };
      const options = { tableName: 'test_table' };
      const sequelize = { define: jest.fn() };
      
      // Call initialize
      BaseModel.initialize(attributes, options, sequelize);
      
      // Verify init was called with correct parameters
      expect(initMock).toHaveBeenCalledWith(
        attributes,
        {
          sequelize,
          tableName: 'test_table'
        }
      );
      
      // Restore original method
      BaseModel.init = originalInit;
    });
  });
});
