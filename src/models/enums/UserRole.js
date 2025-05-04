/**
 * Enum for user roles in the system
 * Defines different access levels for users
 */
class UserRole {
    static ADMIN = 'admin';
    static MODERATOR = 'moderator';
    static USER = 'user';
    
    /**
     * Get all available role values
     * @returns {Array} Array of all role values
     */
    static getAllValues() {
        return [
            this.ADMIN,
            this.MODERATOR,
            this.USER
        ];
    }
    
    /**
     * Get role hierarchy level (higher number means more permissions)
     * @param {string} role - Role to get level for
     * @returns {number} Role hierarchy level
     */
    static getRoleLevel(role) {
        switch (role) {
            case this.ADMIN:
                return 3;
            case this.MODERATOR:
                return 2;
            case this.USER:
                return 1;
            default:
                return 0;
        }
    }
    
    /**
     * Check if a role has permission for a minimum required role
     * @param {string} userRole - User's role
     * @param {string} requiredRole - Minimum required role
     * @returns {boolean} True if user has sufficient permissions
     */
    static hasPermission(userRole, requiredRole) {
        return this.getRoleLevel(userRole) >= this.getRoleLevel(requiredRole);
    }
    
    /**
     * Validate if a value is a valid role
     * @param {string} value - Value to validate
     * @returns {boolean} True if value is a valid role
     */
    static isValid(value) {
        return this.getAllValues().includes(value);
    }
}

module.exports = UserRole;
