/**
 * Enum for content viewing classifications
 * This provides a consistent way to define age ratings across the application
 */
class ContentClassification {
    static ALL_AGES = 'all_ages';
    static AGE_6 = 'age_6_plus';
    static AGE_9 = 'age_9_plus';
    static AGE_12 = 'age_12_plus';
    static AGE_16 = 'age_16_plus';
    static AGE_18 = 'age_18_plus';
    
    /**
     * Gets all possible values for content classifications
     * @returns {Array} Array of classification values
     */
    static getAllValues() {
        return [
            this.ALL_AGES,
            this.AGE_6,
            this.AGE_9,
            this.AGE_12,
            this.AGE_16,
            this.AGE_18
        ];
    }
    
    /**
     * Get minimum age for a classification
     * @param {string} classification - Content classification
     * @returns {number} Minimum age requirement
     */
    static getMinimumAge(classification) {
        switch(classification) {
            case this.ALL_AGES: return 0;
            case this.AGE_6: return 6;
            case this.AGE_9: return 9;
            case this.AGE_12: return 12;
            case this.AGE_16: return 16;
            case this.AGE_18: return 18;
            default: throw new Error('Invalid content classification');
        }
    }
    
    /**
     * Checks if a value is a valid content classification
     * @param {string} value - Classification value to check
     * @returns {boolean} True if value is valid
     */
    static isValid(value) {
        return this.getAllValues().includes(value);
    }
}

module.exports = ContentClassification;
