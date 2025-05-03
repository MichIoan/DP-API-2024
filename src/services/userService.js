const DbUtils = require('../utils/dbUtils');
const { User } = require('../models/User');
const UserStatus = require('../models/enums/UserStatus');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const sequelize = require('../config/sequelize');

/**
 * Service for handling user-related operations
 * Uses transactions for data integrity
 */
class UserService {
    /**
     * Register a new user
     * @param {Object} userData - User data
     * @returns {Promise<Object>} - Created user
     */
    async registerUser(userData) {
        const transaction = await sequelize.transaction();
        
        try {
            // Check if email already exists
            const existingUser = await User.findOne({
                where: { email: userData.email },
                transaction
            });
            
            if (existingUser) {
                await transaction.rollback();
                throw new Error('Email already in use');
            }
            
            // Hash password
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(userData.password, salt);
            
            // Create user
            const user = await User.create({
                email: userData.email,
                password: hashedPassword,
                first_name: userData.first_name,
                last_name: userData.last_name,
                status: UserStatus.ACTIVE,
                referral_code: this.generateReferralCode(),
                referred_by: userData.referral_code || null
            }, { transaction });
            
            // Remove password from response
            const userResponse = user.toJSON();
            delete userResponse.password;
            
            await transaction.commit();
            return userResponse;
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }
    
    /**
     * Login a user
     * @param {string} email - User email
     * @param {string} password - User password
     * @returns {Promise<Object>} - User data and token
     */
    async loginUser(email, password) {
        // Find user
        const user = await User.findOne({ where: { email } });
        
        if (!user) {
            throw new Error('Invalid email or password');
        }
        
        // Check if user is active
        if (user.status !== UserStatus.ACTIVE) {
            throw new Error('Account is not active');
        }
        
        // Check password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        
        if (!isPasswordValid) {
            throw new Error('Invalid email or password');
        }
        
        // Generate JWT token
        const token = jwt.sign(
            { id: user.user_id },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRATION || '24h' }
        );
        
        // Remove password from response
        const userResponse = user.toJSON();
        delete userResponse.password;
        
        return {
            user: userResponse,
            token
        };
    }
    
    /**
     * Get user by ID
     * @param {number} userId - User ID
     * @returns {Promise<Object>} - User data
     */
    async getUserById(userId) {
        const user = await User.findByPk(userId);
        
        if (!user) {
            return null;
        }
        
        // Remove password from response
        const userResponse = user.toJSON();
        delete userResponse.password;
        
        return userResponse;
    }
    
    /**
     * Update user account
     * @param {number} userId - User ID
     * @param {Object} userData - Updated user data
     * @returns {Promise<Object>} - Updated user
     */
    async updateUser(userId, userData) {
        const transaction = await sequelize.transaction();
        
        try {
            const user = await User.findByPk(userId, { transaction });
            
            if (!user) {
                await transaction.rollback();
                return null;
            }
            
            // Check if email is being changed and if it's already in use
            if (userData.email && userData.email !== user.email) {
                const existingUser = await User.findOne({
                    where: { email: userData.email },
                    transaction
                });
                
                if (existingUser) {
                    await transaction.rollback();
                    throw new Error('Email already in use');
                }
            }
            
            // Hash password if provided
            if (userData.password) {
                const salt = await bcrypt.genSalt(10);
                userData.password = await bcrypt.hash(userData.password, salt);
            }
            
            // Update user
            await user.update(userData, { transaction });
            
            // Remove password from response
            const userResponse = user.toJSON();
            delete userResponse.password;
            
            await transaction.commit();
            return userResponse;
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }
    
    /**
     * Delete user account
     * @param {number} userId - User ID
     * @returns {Promise<boolean>} - Success status
     */
    async deleteUser(userId) {
        const transaction = await sequelize.transaction();
        
        try {
            const user = await User.findByPk(userId, { transaction });
            
            if (!user) {
                await transaction.rollback();
                return false;
            }
            
            // Soft delete by updating status
            await user.update({
                status: UserStatus.DELETED,
                deleted_at: new Date()
            }, { transaction });
            
            await transaction.commit();
            return true;
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }
    
    /**
     * Get referrals for a user
     * @param {number} userId - User ID
     * @returns {Promise<Array>} - User referrals
     */
    async getUserReferrals(userId) {
        // Get the user's referral code
        const user = await User.findByPk(userId);
        
        if (!user) {
            throw new Error('User not found');
        }
        
        // Find users referred by this user
        return User.findAll({
            where: { referred_by: user.referral_code },
            attributes: ['user_id', 'first_name', 'last_name', 'email', 'created_at']
        });
    }
    
    /**
     * Generate a unique referral code
     * @returns {string} - Referral code
     */
    generateReferralCode() {
        // Generate a random alphanumeric string
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        
        for (let i = 0; i < 8; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        
        return code;
    }
    
    /**
     * Verify JWT token
     * @param {string} token - JWT token
     * @returns {Promise<Object>} - Decoded token
     */
    verifyToken(token) {
        return new Promise((resolve, reject) => {
            jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, decoded) => {
                if (err) {
                    return reject(err);
                }
                
                resolve(decoded);
            });
        });
    }
}

// Create a singleton instance
const userService = new UserService();

// Export the instance
module.exports = userService;
