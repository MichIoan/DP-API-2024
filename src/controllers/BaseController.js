/**
 * Base controller class that provides common functionality for all controllers
 * Implements shared methods for response handling, validation, etc.
 */
class BaseController {
    /**
     * Handle success response with standardized format
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @param {Number} statusCode - HTTP status code
     * @param {Object} data - Response data
     * @returns {Object} Formatted response
     */
    handleSuccess(req, res, statusCode, data) {
        const format = req.isXml ? 'xml' : 'json';
        
        if (format === 'xml') {
            return res.response(req, res, statusCode, { 
                success: true,
                ...data
            });
        }
        
        return res.response(req, res, statusCode, { 
            success: true,
            ...data
        });
    }
    
    /**
     * Handle error responses with standardized format
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @param {Number} statusCode - HTTP status code
     * @param {String} message - Error message
     * @param {Object} details - Additional error details
     * @returns {Object} Formatted error response
     */
    handleError(req, res, statusCode, message, details = null) {
        const errorResponse = {
            success: false,
            error: message
        };
        
        if (details) {
            errorResponse.details = details;
        }
        
        return res.response(req, res, statusCode, errorResponse);
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
