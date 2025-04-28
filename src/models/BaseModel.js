const { Model } = require('sequelize');

class BaseModel extends Model {
    /**
     * Creates a static init method that can be called by subclasses
     * @param {Object} attributes - The model attributes
     * @param {Object} options - Additional options for the model
     * @param {Object} sequelize - Sequelize instance
     */
    static initialize(attributes, options, sequelize) {
        return this.init(attributes, {
            sequelize,
            ...options
        });
    }

    /**
     * Returns the model data in JSON format
     * This method can be overridden by child classes to customize JSON output
     * @returns {Object} - Model data in JSON format
     */
    toJSON() {
        return { ...this.get() };
    }

    /**
     * Returns the model data in XML format
     * This method can be overridden by child classes to customize XML output
     * @returns {Object} - Model data in a format suitable for XML conversion
     */
    toXML() {
        const data = this.get();
        return { [this.constructor.name.toLowerCase()]: data };
    }
}

module.exports = BaseModel;
