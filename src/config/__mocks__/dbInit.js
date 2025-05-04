/**
 * Mock database initialization for tests
 * This prevents actual database connections during testing
 */

// Import the mock sequelize instance
const sequelize = require('./sequelize');

/**
 * Mock function to initialize the database
 */
async function initDatabase() {
  console.log('Using mock database for tests');
  return Promise.resolve();
}

/**
 * Mock function to run schema SQL
 */
async function runSchemaSql() {
  return Promise.resolve();
}

/**
 * Mock function to test database features
 */
async function testDatabaseFeatures() {
  return Promise.resolve({
    connection: true,
    views: true,
    functions: true,
    triggers: true
  });
}

module.exports = {
  initDatabase,
  runSchemaSql,
  testDatabaseFeatures
};
