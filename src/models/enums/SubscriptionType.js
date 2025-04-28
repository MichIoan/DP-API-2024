/**
 * Enum for subscription types
 * This provides a consistent way to define subscription types across the application
 */
class SubscriptionType {
    static SD = 'SD';
    static HD = 'HD';
    static UHD = 'UHD';
    
    /**
     * Gets all possible values for subscription types
     * @returns {Array} Array of subscription type values
     */
    static getAllValues() {
        return [
            this.SD,
            this.HD,
            this.UHD
        ];
    }
    
    /**
     * Get the price for a given subscription type
     * @param {string} type - Subscription type
     * @returns {number} Price of the subscription
     */
    static getPrice(type) {
        switch(type) {
            case this.SD: return 7.99;
            case this.HD: return 10.99;
            case this.UHD: return 13.99;
            default: throw new Error('Invalid subscription type');
        }
    }
    
    /**
     * Checks if a value is a valid subscription type
     * @param {string} value - Type value to check
     * @returns {boolean} True if value is valid
     */
    static isValid(value) {
        return this.getAllValues().includes(value);
    }
}

module.exports = SubscriptionType;
