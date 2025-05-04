/**
 * Jest global teardown
 * This script runs after all tests are done to clean up resources
 */

module.exports = async () => {
  console.log('Running global teardown to close all server instances...');
  
  const closePromises = [];
  
  // Close integration test server if it exists
  if (global.__test_server__) {
    console.log('Closing integration test server...');
    closePromises.push(
      new Promise((resolve) => {
        global.__test_server__.close(() => {
          console.log('Integration test server closed successfully');
          global.__test_server__ = null;
          resolve();
        });
      })
    );
  }
  
  // Close E2E test server if it exists
  if (global.__e2e_test_server__) {
    console.log('Closing E2E test server...');
    closePromises.push(
      new Promise((resolve) => {
        global.__e2e_test_server__.close(() => {
          console.log('E2E test server closed successfully');
          global.__e2e_test_server__ = null;
          resolve();
        });
      })
    );
  }
  
  // Close any other server instances that might be created during tests
  if (global.__profile_test_server__) {
    console.log('Closing profile test server...');
    closePromises.push(
      new Promise((resolve) => {
        global.__profile_test_server__.close(() => {
          console.log('Profile test server closed successfully');
          global.__profile_test_server__ = null;
          resolve();
        });
      })
    );
  }
  
  if (global.__watchlist_test_server__) {
    console.log('Closing watchlist test server...');
    closePromises.push(
      new Promise((resolve) => {
        global.__watchlist_test_server__.close(() => {
          console.log('Watchlist test server closed successfully');
          global.__watchlist_test_server__ = null;
          resolve();
        });
      })
    );
  }
  
  // Wait for all servers to close
  await Promise.all(closePromises);
  
  // Add some delay to ensure connections are properly closed
  console.log('Waiting for connections to fully close...');
  await new Promise(resolve => setTimeout(resolve, 1000));
  console.log('Global teardown completed successfully');
};
