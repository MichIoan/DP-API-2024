/**
 * Validation schemas for admin endpoints
 */
const Joi = require('joi');
const UserRole = require('../models/enums/UserRole');

// Schema for updating user role
const updateUserRoleSchema = {
    params: Joi.object({
        userId: Joi.number().integer().positive().required()
            .messages({
                'number.base': 'User ID must be a number',
                'number.integer': 'User ID must be an integer',
                'number.positive': 'User ID must be positive',
                'any.required': 'User ID is required'
            })
    }),
    body: Joi.object({
        role: Joi.string().valid(...UserRole.getAllValues()).required()
            .messages({
                'any.only': `Role must be one of: ${UserRole.getAllValues().join(', ')}`,
                'any.required': 'Role is required'
            })
    })
};

module.exports = {
    updateUserRoleSchema
};
