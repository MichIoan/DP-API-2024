const DbUtils = require('../utils/dbUtils');
const { User } = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
const UserStatus = require('../models/enums/UserStatus');
const UserRole = require('../models/enums/UserRole');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
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
        
        // Generate access token (JWT)
        const accessToken = this.generateAccessToken(user.user_id);
        
        // Generate refresh token
        const refreshToken = await this.generateRefreshToken(user.user_id, req);
        
        // Remove password from response
        const userResponse = user.toJSON();
        delete userResponse.password;
        
        return {
            user: userResponse,
            accessToken,
            refreshToken: refreshToken.token,
            tokenType: 'Bearer',
            expiresIn: process.env.JWT_EXPIRATION || '24h'
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
    async verifyToken(token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            return decoded;
        } catch (error) {
            throw new Error('Invalid token');
        }
    }
    
    /**
     * Generate a new access token
     * @param {number} userId - User ID
     * @returns {string} - JWT access token
     */
    generateAccessToken(userId) {
        return jwt.sign(
            { id: userId },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRATION || '24h' }
        );
    }
    
    /**
     * Generate a new refresh token
     * @param {number} userId - User ID
     * @param {Object} req - Express request object (for IP and user agent)
     * @returns {Promise<Object>} - Refresh token object
     */
    async generateRefreshToken(userId, req = null) {
        // Generate a random token
        const refreshToken = crypto.randomBytes(40).toString('hex');
        
        // Set expiration date (30 days)
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);
        
        // Get IP and user agent if available
        const ipAddress = req ? (req.ip || req.headers['x-forwarded-for'] || '') : null;
        const userAgent = req ? (req.headers['user-agent'] || '') : null;
        
        // Create refresh token in database
        const token = await RefreshToken.create({
            user_id: userId,
            token: refreshToken,
            expires_at: expiresAt,
            ip_address: ipAddress,
            user_agent: userAgent
        });
        
        return token;
    }
    
    /**
     * Refresh access token using refresh token
     * @param {string} refreshToken - Refresh token
     * @param {Object} req - Express request object
     * @returns {Promise<Object>} - New tokens
     */
    async refreshToken(refreshToken, req) {
        try {
            // Find the refresh token in the database
            const tokenDoc = await RefreshToken.findOne({
                where: { token: refreshToken }
            });
            
            // Check if token exists and is valid
            if (!tokenDoc) {
                throw new Error('Invalid refresh token');
            }
            
            // Check if token is expired
            if (tokenDoc.isExpired()) {
                throw new Error('Refresh token expired');
            }
            
            // Check if token is revoked
            if (tokenDoc.is_revoked) {
                throw new Error('Refresh token revoked');
            }
            
            // Get user
            const user = await User.findByPk(tokenDoc.user_id);
            
            if (!user) {
                throw new Error('User not found');
            }
            
            // Generate new access token
            const accessToken = this.generateAccessToken(user.user_id);
            
            // Generate new refresh token
            const newRefreshToken = await this.generateRefreshToken(user.user_id, req);
            
            // Revoke old refresh token
            await tokenDoc.update({ is_revoked: true });
            
            return {
                accessToken,
                refreshToken: newRefreshToken.token,
                tokenType: 'Bearer',
                expiresIn: process.env.JWT_EXPIRATION || '24h'
            };
        } catch (error) {
            console.error('Error refreshing token:', error);
            throw error;
        }
    }
    
    /**
     * Revoke all refresh tokens for a user
     * @param {number} userId - User ID
     * @returns {Promise<number>} - Number of tokens revoked
     */
    async revokeAllTokens(userId) {
        try {
            const result = await RefreshToken.update(
                { is_revoked: true },
                { where: { user_id: userId, is_revoked: false } }
            );
            
            return result[0]; // Number of rows affected
        } catch (error) {
            console.error('Error revoking tokens:', error);
            throw error;
        }
    }

}

// Create a singleton instance
const userService = new UserService();

// Export the instance
module.exports = userService;
