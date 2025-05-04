/**
 * Validation middleware using Joi
 * Creates reusable validation middleware for request validation
 */

/**
 * Create a validation middleware
 * @param {Object} schema - Joi validation schema
 * @returns {Function} Express middleware function
 */
const validate = (schema) => {
    return (req, res, next) => {
        if (!schema) {
            return next();
        }

        // Validation options
        const options = {
            abortEarly: false,   // Return all errors
            allowUnknown: true,  // Allow unknown fields
            stripUnknown: false  // Don't remove unknown fields
        };

        // Validate body if schema has body validator
        if (schema.body && req.body) {
            const { error, value } = schema.body.validate(req.body, options);
            if (error) {
                return res.status(400).json({
                    success: false,
                    error: 'Validation error',
                    data: error.details.map(err => ({
                        field: err.path.join('.'),
                        message: err.message
                    }))
                });
            }
            req.body = value;
        }

        // Validate query if schema has query validator
        if (schema.query && req.query) {
            const { error, value } = schema.query.validate(req.query, options);
            if (error) {
                return res.status(400).json({
                    success: false,
                    error: 'Validation error',
                    data: error.details.map(err => ({
                        field: err.path.join('.'),
                        message: err.message
                    }))
                });
            }
            req.query = value;
        }

        // Validate params if schema has params validator
        if (schema.params && req.params) {
            const { error, value } = schema.params.validate(req.params, options);
            if (error) {
                return res.status(400).json({
                    success: false,
                    error: 'Validation error',
                    data: error.details.map(err => ({
                        field: err.path.join('.'),
                        message: err.message
                    }))
                });
            }
            req.params = value;
        }

        next();
    };
};

module.exports = validate;
