/**
 * Enum for user account status
 * This provides a consistent way to define user states across the application
 */
class UserStatus {
    static NOT_ACTIVATED = 'not_activated';
    static ACTIVE = 'active';
    static SUSPENDED = 'suspended';
    static LOCKED = 'locked';
    
    /**
     * Gets all possible values for user status
     * @returns {Array} Array of status values
     */
    static getAllValues() {
        return [
            this.NOT_ACTIVATED,
            this.ACTIVE,
            this.SUSPENDED,
            this.LOCKED
        ];
    }
    
    /**
     * Checks if a value is a valid user status
     * @param {string} value - Status value to check
     * @returns {boolean} True if value is valid
     */
    static isValid(value) {
        return this.getAllValues().includes(value);
    }
}

module.exports = UserStatus;
