/**
 * Response utilities for standardizing API responses
 * Provides consistent response structure across the API
 */

/**
 * Create a success response
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Success message
 * @param {Object|Array} data - Response data
 * @param {Object} meta - Metadata (pagination, etc.)
 * @returns {Object} Standardized success response
 */
const successResponse = (statusCode = 200, message = 'Success', data = null, meta = null) => {
    const response = {
        status: 'success',
        message
    };

    if (data !== null) {
        response.data = data;
    }

    if (meta !== null) {
        response.meta = meta;
    }

    return {
        statusCode,
        body: response
    };
};

/**
 * Create an error response
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Error message
 * @param {Array|Object} errors - Detailed errors
 * @returns {Object} Standardized error response
 */
const errorResponse = (statusCode = 500, message = 'Error', errors = null) => {
    const response = {
        status: 'error',
        message
    };

    if (errors !== null) {
        response.errors = errors;
    }

    return {
        statusCode,
        body: response
    };
};

/**
 * Create a validation error response
 * @param {Array} errors - Validation errors
 * @returns {Object} Standardized validation error response
 */
const validationErrorResponse = (errors) => {
    return errorResponse(400, 'Validation error', errors);
};

/**
 * Create a not found response
 * @param {string} resource - Resource that was not found
 * @returns {Object} Standardized not found response
 */
const notFoundResponse = (resource = 'Resource') => {
    return errorResponse(404, `${resource} not found`);
};

/**
 * Create an unauthorized response
 * @param {string} message - Unauthorized message
 * @returns {Object} Standardized unauthorized response
 */
const unauthorizedResponse = (message = 'Unauthorized') => {
    return errorResponse(401, message);
};

/**
 * Create a forbidden response
 * @param {string} message - Forbidden message
 * @returns {Object} Standardized forbidden response
 */
const forbiddenResponse = (message = 'Forbidden') => {
    return errorResponse(403, message);
};

/**
 * Create a conflict response
 * @param {string} message - Conflict message
 * @returns {Object} Standardized conflict response
 */
const conflictResponse = (message = 'Resource already exists') => {
    return errorResponse(409, message);
};

/**
 * Create a server error response
 * @param {string} message - Server error message
 * @param {Error} error - Error object
 * @returns {Object} Standardized server error response
 */
const serverErrorResponse = (message = 'Internal server error', error = null) => {
    let errorDetails = null;
    
    // In development, include error details
    if (process.env.NODE_ENV !== 'production' && error) {
        errorDetails = {
            message: error.message,
            stack: error.stack
        };
    }
    
    return errorResponse(500, message, errorDetails);
};

module.exports = {
    successResponse,
    errorResponse,
    validationErrorResponse,
    notFoundResponse,
    unauthorizedResponse,
    forbiddenResponse,
    conflictResponse,
    serverErrorResponse
};
