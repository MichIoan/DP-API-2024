/**
 * Base controller class that provides common functionality for all controllers
 * Implements shared methods for response handling, validation, etc.
 */
const responseUtils = require('../utils/responseUtils');
class BaseController {
    /**
     * Handle successful response
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @param {Number} statusCode - HTTP status code
     * @param {Object} data - Response data
     * @param {String} message - Success message
     * @param {Object} meta - Metadata (pagination, etc.)
     * @returns {Object} - Response object
     */
    handleSuccess(req, res, statusCode, data, message = 'Success', meta = null) {
        const response = responseUtils.successResponse(statusCode, message, data, meta);
        return res.status(response.statusCode).json(response.body);
    }
    
    /**
     * Handle error responses with standardized format
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @param {Number} statusCode - HTTP status code
     * @param {String} message - Error message
     * @param {Object|Array} errors - Additional error details
     * @returns {Object} Formatted error response
     */
    handleError(req, res, statusCode, message, errors = null) {
        const response = responseUtils.errorResponse(statusCode, message, errors);
        return res.status(response.statusCode).json(response.body);
    }
    
    /**
     * Handle not found error
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @param {String} resource - Resource that was not found
     * @returns {Object} Not found response
     */
    handleNotFound(req, res, resource = 'Resource') {
        const response = responseUtils.notFoundResponse(resource);
        return res.status(response.statusCode).json(response.body);
    }
    
    /**
     * Handle unauthorized error
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @param {String} message - Unauthorized message
     * @returns {Object} Unauthorized response
     */
    handleUnauthorized(req, res, message = 'Unauthorized') {
        const response = responseUtils.unauthorizedResponse(message);
        return res.status(response.statusCode).json(response.body);
    }
    
    /**
     * Handle forbidden error
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @param {String} message - Forbidden message
     * @returns {Object} Forbidden response
     */
    handleForbidden(req, res, message = 'Forbidden') {
        const response = responseUtils.forbiddenResponse(message);
        return res.status(response.statusCode).json(response.body);
    }
    
    /**
     * Handle validation error
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @param {Array} errors - Validation errors
     * @returns {Object} Validation error response
     */
    handleValidationError(req, res, errors) {
        const response = responseUtils.validationErrorResponse(errors);
        return res.status(response.statusCode).json(response.body);
    }
    
    /**
     * Handle server error
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @param {String} message - Server error message
     * @param {Error} error - Error object
     * @returns {Object} Server error response
     */
    handleServerError(req, res, message = 'Internal server error', error = null) {
        const response = responseUtils.serverErrorResponse(message, error);
        return res.status(response.statusCode).json(response.body);
    }
    
    /**
     * Validates required fields in request body
     * @param {Object} body - Request body
     * @param {Array} requiredFields - Array of required field names
     * @returns {Object} Validation result with isValid and missing fields
     */
    validateRequiredFields(body, requiredFields) {
        const missingFields = [];
        
        for (const field of requiredFields) {
            if (!body[field]) {
                missingFields.push(field);
            }
        }
        
        return {
            isValid: missingFields.length === 0,
            missingFields
        };
    }
    
    /**
     * Safely convert parameters to expected types
     * @param {Object} params - Parameters to convert
     * @param {Object} typeMap - Map of parameter names to expected types
     * @returns {Object} Converted parameters
     */
    convertParams(params, typeMap) {
        const converted = {};
        
        for (const [key, type] of Object.entries(typeMap)) {
            if (params[key] !== undefined) {
                switch (type) {
                    case 'number':
                        converted[key] = Number(params[key]);
                        break;
                    case 'boolean':
                        converted[key] = params[key] === 'true' || params[key] === true;
                        break;
                    case 'date':
                        converted[key] = new Date(params[key]);
                        break;
                    default:
                        converted[key] = params[key];
                }
            }
        }
        
        return converted;
    }
}

module.exports = BaseController;
