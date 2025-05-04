/**
 * Database mocking utilities for tests
 */
const SequelizeMock = require('sequelize-mock');

// Create a mock Sequelize instance
const sequelizeMock = new SequelizeMock();

// Add common mock methods
sequelizeMock.authenticate = jest.fn().mockResolvedValue(true);
sequelizeMock.sync = jest.fn().mockResolvedValue(true);
sequelizeMock.transaction = jest.fn().mockImplementation(callback => {
  if (callback) {
    const transaction = { commit: jest.fn(), rollback: jest.fn() };
    return Promise.resolve(callback(transaction));
  }
  return Promise.resolve({ commit: jest.fn(), rollback: jest.fn() });
});

// Create mock model factory
const createMockModel = (name, attributes = {}) => {
  const mockModel = sequelizeMock.define(name, attributes);
  
  // Add common model methods
  mockModel.findOne = jest.fn().mockResolvedValue(null);
  mockModel.findAll = jest.fn().mockResolvedValue([]);
  mockModel.findByPk = jest.fn().mockResolvedValue(null);
  mockModel.create = jest.fn().mockResolvedValue({});
  mockModel.update = jest.fn().mockResolvedValue([1]);
  mockModel.destroy = jest.fn().mockResolvedValue(1);
  
  // Add association methods
  mockModel.belongsTo = jest.fn().mockReturnValue(mockModel);
  mockModel.hasMany = jest.fn().mockReturnValue(mockModel);
  mockModel.hasOne = jest.fn().mockReturnValue(mockModel);
  mockModel.belongsToMany = jest.fn().mockReturnValue(mockModel);
  
  return mockModel;
};

// Create mock PG Pool
const createMockPgPool = () => ({
  connect: jest.fn().mockImplementation(() => Promise.resolve({
    query: jest.fn().mockResolvedValue({ rows: [] }),
    release: jest.fn()
  })),
  query: jest.fn().mockResolvedValue({ rows: [] }),
  end: jest.fn().mockResolvedValue(true)
});

module.exports = {
  sequelizeMock,
  createMockModel,
  createMockPgPool
};
