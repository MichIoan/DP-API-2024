/**
 * Mock ContentClassification for testing
 * This provides the constants used in the Series model's getContentClassification method
 */

const ContentClassification = {
    // Constants used in the Series model
    G: 'G',
    PG: 'PG',
    PG13: 'PG13',
    R: 'R',
    NC17: 'NC17',
    
    // Original constants from the actual ContentClassification
    ALL_AGES: 'all_ages',
    AGE_6: 'age_6_plus',
    AGE_9: 'age_9_plus',
    AGE_12: 'age_12_plus',
    AGE_16: 'age_16_plus',
    AGE_18: 'age_18_plus',
    
    /**
     * Gets all possible values for content classifications
     * @returns {Array} Array of classification values
     */
    getAllValues() {
        return [
            this.ALL_AGES,
            this.AGE_6,
            this.AGE_9,
            this.AGE_12,
            this.AGE_16,
            this.AGE_18,
            this.G,
            this.PG,
            this.PG13,
            this.R,
            this.NC17
        ];
    }
};

module.exports = ContentClassification;
