/**
 * Database initialization script for Netflix API
 * This script initializes the database connection and syncs models
 */

const sequelize = require('./sequelize');
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config(); // Load environment variables from .env file
require('../models/associations');

// Database connection parameters from environment
const dbConfig = {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
};

/**
 * Initialize the database connection and sync models
 * @param {boolean} force - If true, drop tables before creating them
 * @returns {Promise<void>}
 */
async function initDatabase(force = false) {
    try {
        console.log('Testing database connection...');
        await sequelize.authenticate();
        console.log('Database connection established successfully.');
        
        if (force) {
            console.log('Force sync requested, dropping all tables...');
            await sequelize.sync({ force: true });
            console.log('All tables dropped and recreated.');
            
            // After force sync, run the schema SQL
            await runSchemaSql();
        } else {
            console.log('Syncing models with database...');
            await sequelize.sync({ alter: true });
            console.log('Models synchronized with database.');
        }
    } catch (error) {
        console.error('Error initializing database:', error);
        throw error;
    }
}

/**
 * Run the improved schema SQL file to set up stored procedures, views, etc.
 * @returns {Promise<void>}
 */
async function runSchemaSql() {
    const pool = new Pool(dbConfig);
    
    try {
        console.log('Running improved schema SQL...');
        
        // Read the SQL file
        const schemaPath = path.join(__dirname, '../../docs/improved_netflix_schema.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');
        
        // Execute the SQL
        await pool.query(schemaSql);
        
        console.log('Schema SQL executed successfully.');
        
        // Run additional SQL files
        await runAdditionalSql('roles.sql');
        await runAdditionalSql('additional_views.sql');
        await runAdditionalSql('additional_procedures.sql');
        
    } catch (error) {
        console.error('Error running schema SQL:', error);
        throw error;
    } finally {
        await pool.end();
    }
}

/**
 * Run additional SQL files
 * @param {string} filename - SQL file name in docs directory
 * @returns {Promise<void>}
 */
async function runAdditionalSql(filename) {
    const pool = new Pool(dbConfig);
    
    try {
        console.log(`Running ${filename}...`);
        
        // Read the SQL file
        const filePath = path.join(__dirname, `../../docs/${filename}`);
        
        // Check if file exists
        if (!fs.existsSync(filePath)) {
            console.log(`File ${filename} not found, skipping.`);
            return;
        }
        
        const sql = fs.readFileSync(filePath, 'utf8');
        
        // Execute the SQL
        await pool.query(sql);
        
        console.log(`${filename} executed successfully.`);
        
    } catch (error) {
        console.error(`Error running ${filename}:`, error);
        throw error;
    } finally {
        await pool.end();
    }
}

/**
 * Test database connection and features
 * @returns {Promise<void>}
 */
async function testDatabaseFeatures() {
    const pool = new Pool(dbConfig);
    
    try {
        console.log('Testing database features...');
        
        // Test a simple query
        const result = await pool.query('SELECT NOW() as time');
        console.log('Database time:', result.rows[0].time);
        
        // Test a view
        try {
            const viewResult = await pool.query('SELECT * FROM safe_user_profiles LIMIT 1');
            console.log('View safe_user_profiles is accessible.');
        } catch (error) {
            console.log('View safe_user_profiles not found or not accessible.');
        }
        
        // Test a stored procedure
        try {
            await pool.query('CALL "UpdateUserSubscription"(1, \'premium\', NOW())');
            console.log('Stored procedure UpdateUserSubscription is callable.');
        } catch (error) {
            console.log('Stored procedure UpdateUserSubscription not found or not callable.');
        }
        
        console.log('Database feature tests completed.');
        
    } catch (error) {
        console.error('Error testing database features:', error);
    } finally {
        await pool.end();
    }
}

module.exports = {
    initDatabase,
    runSchemaSql,
    testDatabaseFeatures
};
