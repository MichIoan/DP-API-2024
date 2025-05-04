/**
 * Validation schemas for user endpoints
 */
const Joi = require('joi');

// Schema for updating user account
const updateUserSchema = {
    body: Joi.object({
        email: Joi.string().email()
            .messages({
                'string.email': 'Email must be a valid email address'
            }),
        password: Joi.string().min(8)
            .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)'))
            .messages({
                'string.min': 'Password must be at least 8 characters long',
                'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, and one number'
            }),
        first_name: Joi.string().max(50),
        last_name: Joi.string().max(50)
    }).min(1).messages({
        'object.min': 'At least one field must be provided for update'
    })
};

// Schema for applying referral code
const applyReferralSchema = {
    body: Joi.object({
        referral_code: Joi.string().required()
            .messages({
                'any.required': 'Referral code is required'
            })
    })
};

module.exports = {
    updateUserSchema,
    applyReferralSchema
};
