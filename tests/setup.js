/**
 * Global setup for Jest tests
 * This file runs before all tests
 */

// Set environment to test
process.env.NODE_ENV = 'test';

// Load environment variables from .env.test if it exists
require('dotenv').config({ path: '.env.test' });

// Global timeout for async operations
jest.setTimeout(10000);
