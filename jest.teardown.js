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
        try {
          global.__test_server__.close(() => {
            console.log('Integration test server closed successfully');
            global.__test_server__ = null;
            resolve();
          });
        } catch (err) {
          console.error('Error closing integration test server:', err.message);
          global.__test_server__ = null;
          resolve();
        }
      })
    );
  }
  
  // Close E2E test server if it exists
  if (global.__e2e_test_server__) {
    console.log('Closing E2E test server...');
    closePromises.push(
      new Promise((resolve) => {
        try {
          global.__e2e_test_server__.close(() => {
            console.log('E2E test server closed successfully');
            global.__e2e_test_server__ = null;
            resolve();
          });
        } catch (err) {
          console.error('Error closing E2E test server:', err.message);
          global.__e2e_test_server__ = null;
          resolve();
        }
      })
    );
  }
  
  // Close watchlist test server if it exists
  if (global.__watchlist_test_server__) {
    console.log('Closing watchlist test server...');
    closePromises.push(
      new Promise((resolve) => {
        try {
          global.__watchlist_test_server__.close(() => {
            console.log('Watchlist test server closed successfully');
            global.__watchlist_test_server__ = null;
            resolve();
          });
        } catch (err) {
          console.error('Error closing watchlist test server:', err.message);
          global.__watchlist_test_server__ = null;
          resolve();
        }
      })
    );
  }
  
  // Close any other server instances that might be created during tests
  if (global.__profile_test_server__) {
    console.log('Closing profile test server...');
    closePromises.push(
      new Promise((resolve) => {
        try {
          global.__profile_test_server__.close(() => {
            console.log('Profile test server closed successfully');
            global.__profile_test_server__ = null;
            resolve();
          });
        } catch (err) {
          console.error('Error closing profile test server:', err.message);
          global.__profile_test_server__ = null;
          resolve();
        }
      })
    );
  }
  
  // Wait for all servers to close
  if (closePromises.length > 0) {
    console.log('Waiting for connections to fully close...');
    await Promise.all(closePromises);
  }
  
  // Check for remaining handles
  const activeHandles = process._getActiveHandles();
  if (activeHandles.length > 0) {
    console.log(`Remaining active handles: ${activeHandles.length}`);
    
    // Force close any remaining handles
    for (const handle of activeHandles) {
      if (handle && typeof handle.close === 'function') {
        try {
          handle.close();
          console.log('Closed a remaining handle');
        } catch (err) {
          console.error('Failed to close handle:', err.message);
        }
      }
    }
  }
  
  // Add a small delay to ensure all resources are released
  await new Promise(resolve => setTimeout(resolve, 500));
  
  console.log('Global teardown completed successfully');
};
