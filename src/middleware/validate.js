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

        // Validate request data against schema
        const validationOptions = {
            abortEarly: false, // Return all errors, not just the first one
            allowUnknown: true, // Allow unknown fields (don't reject them)
            stripUnknown: false // Don't remove unknown fields
        };

        // Validate different parts of the request based on schema
        const { error, value } = schema.validate(
            {
                body: req.body,
                query: req.query,
                params: req.params
            },
            validationOptions
        );

        if (error) {
            // Format validation errors
            const errors = error.details.map(detail => ({
                path: detail.path.join('.'),
                message: detail.message
            }));

            return res.status(400).json({
                status: 'error',
                message: 'Validation error',
                errors
            });
        }

        // Update request with validated values
        if (value.body) req.body = value.body;
        if (value.query) req.query = value.query;
        if (value.params) req.params = value.params;

        return next();
    };
};

module.exports = validate;
