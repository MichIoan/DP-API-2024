/**
 * Mock Sequelize configuration for tests
 * This replaces the real Sequelize with SequelizeMock for testing
 */
const SequelizeMock = require('sequelize-mock');

// Create a mock Sequelize instance
const sequelizeMock = new SequelizeMock();

// Add any additional mock functionality needed for tests
sequelizeMock.authenticate = jest.fn().mockResolvedValue(true);
sequelizeMock.sync = jest.fn().mockResolvedValue(true);
sequelizeMock.transaction = jest.fn().mockImplementation(callback => {
  if (callback) {
    const transaction = { commit: jest.fn(), rollback: jest.fn() };
    return Promise.resolve(callback(transaction));
  }
  return Promise.resolve({ commit: jest.fn(), rollback: jest.fn() });
});

// Export the mock
module.exports = sequelizeMock;
