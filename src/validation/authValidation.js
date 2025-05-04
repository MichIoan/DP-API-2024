/**
 * Validation schemas for authentication endpoints
 */
const Joi = require('joi');

// Schema for user registration
const registerSchema = {
    body: Joi.object({
        email: Joi.string().email().required()
            .messages({
                'string.email': 'Email must be a valid email address',
                'any.required': 'Email is required'
            }),
        password: Joi.string().min(8).required()
            .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)'))
            .messages({
                'string.min': 'Password must be at least 8 characters long',
                'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
                'any.required': 'Password is required'
            }),
        first_name: Joi.string().max(50),
        last_name: Joi.string().max(50),
        referral_code: Joi.string().max(20)
    })
};

// Schema for user login
const loginSchema = {
    body: Joi.object({
        email: Joi.string().email().required()
            .messages({
                'string.email': 'Email must be a valid email address',
                'any.required': 'Email is required'
            }),
        password: Joi.string().required()
            .messages({
                'any.required': 'Password is required'
            })
    })
};

// Schema for token refresh
const refreshTokenSchema = {
    body: Joi.object({
        refreshToken: Joi.string().required()
            .messages({
                'any.required': 'Refresh token is required'
            })
    })
};

module.exports = {
    registerSchema,
    loginSchema,
    refreshTokenSchema
};
