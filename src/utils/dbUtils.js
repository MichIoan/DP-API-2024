const sequelize = require('../config/sequelize');
const { QueryTypes } = require('sequelize');

/**
 * Database utilities for working with stored procedures, views, and transactions
 */
class DbUtils {
    /**
     * Execute a stored procedure with parameters
     * @param {string} procedureName - Name of the stored procedure
     * @param {Array} params - Parameters for the stored procedure
     * @param {Object} options - Additional options
     * @returns {Promise<any>} - Result of the stored procedure
     */
    static async callProcedure(procedureName, params = [], options = {}) {
        const paramPlaceholders = params.map((_, index) => `$${index + 1}`).join(',');
        const query = `CALL public."${procedureName}"(${paramPlaceholders})`;
        
        try {
            const result = await sequelize.query(query, {
                bind: params,
                type: QueryTypes.RAW,
                ...options
            });
            
            return result;
        } catch (error) {
            console.error(`Error calling procedure ${procedureName}:`, error);
            throw error;
        }
    }
    
    /**
     * Execute a function that returns a result
     * @param {string} functionName - Name of the function
     * @param {Array} params - Parameters for the function
     * @param {Object} options - Additional options
     * @returns {Promise<any>} - Result of the function
     */
    static async callFunction(functionName, params = [], options = {}) {
        const paramPlaceholders = params.map((_, index) => `$${index + 1}`).join(',');
        const query = `SELECT * FROM public."${functionName}"(${paramPlaceholders})`;
        
        try {
            const result = await sequelize.query(query, {
                bind: params,
                type: QueryTypes.SELECT,
                ...options
            });
            
            return result;
        } catch (error) {
            console.error(`Error calling function ${functionName}:`, error);
            throw error;
        }
    }
    
    /**
     * Query a database view
     * @param {string} viewName - Name of the view
     * @param {Object} where - Where conditions
     * @param {Object} options - Additional options
     * @returns {Promise<Array>} - Results from the view
     */
    static async queryView(viewName, where = {}, options = {}) {
        let whereClause = '';
        const params = [];
        
        // Build WHERE clause if conditions are provided
        if (Object.keys(where).length > 0) {
            const conditions = [];
            let paramIndex = 1;
            
            for (const [key, value] of Object.entries(where)) {
                conditions.push(`"${key}" = $${paramIndex}`);
                params.push(value);
                paramIndex++;
            }
            
            whereClause = `WHERE ${conditions.join(' AND ')}`;
        }
        
        const query = `SELECT * FROM public.${viewName} ${whereClause}`;
        
        try {
            const result = await sequelize.query(query, {
                bind: params,
                type: QueryTypes.SELECT,
                ...options
            });
            
            return result;
        } catch (error) {
            console.error(`Error querying view ${viewName}:`, error);
            throw error;
        }
    }
    
    /**
     * Execute a transaction with automatic commit/rollback
     * @param {Function} callback - Function to execute within transaction
     * @returns {Promise<any>} - Result of the callback
     */
    static async withTransaction(callback) {
        const transaction = await sequelize.transaction();
        
        try {
            const result = await callback(transaction);
            await transaction.commit();
            return result;
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }
}

module.exports = DbUtils;
