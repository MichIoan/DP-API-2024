const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const sequelize = require('../config/sequelize');

/**
 * Database backup manager
 * Handles backup and restoration of the PostgreSQL database
 */
class BackupManager {
    constructor() {
        // Database connection info from sequelize config
        this.dbName = sequelize.config.database;
        this.dbUser = sequelize.config.username;
        this.dbPassword = sequelize.config.password;
        this.dbHost = sequelize.config.host;
        
        // Backup directory
        this.backupDir = path.join(__dirname, '../../backups');
        
        // Create backup directory if it doesn't exist
        if (!fs.existsSync(this.backupDir)) {
            fs.mkdirSync(this.backupDir, { recursive: true });
        }
    }
    
    /**
     * Create a database backup
     * @param {string} backupName - Optional name for the backup file
     * @returns {Promise<string>} - Path to the backup file
     */
    async createBackup(backupName = '') {
        return new Promise((resolve, reject) => {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const fileName = backupName 
                ? `${backupName}_${timestamp}.sql` 
                : `backup_${timestamp}.sql`;
            const filePath = path.join(this.backupDir, fileName);
            
            // Set environment variable for password
            const env = { ...process.env, PGPASSWORD: this.dbPassword };
            
            // Create pg_dump command
            const command = `pg_dump -h ${this.dbHost} -U ${this.dbUser} -d ${this.dbName} -f "${filePath}"`;
            
            console.log(`Creating backup: ${fileName}`);
            
            exec(command, { env }, (error, stdout, stderr) => {
                if (error) {
                    console.error(`Backup error: ${error.message}`);
                    reject(error);
                    return;
                }
                
                if (stderr) {
                    console.warn(`Backup warning: ${stderr}`);
                }
                
                console.log(`Backup created successfully: ${filePath}`);
                resolve(filePath);
            });
        });
    }
    
    /**
     * Restore database from a backup file
     * @param {string} backupPath - Path to the backup file
     * @returns {Promise<void>}
     */
    async restoreBackup(backupPath) {
        return new Promise((resolve, reject) => {
            if (!fs.existsSync(backupPath)) {
                reject(new Error(`Backup file not found: ${backupPath}`));
                return;
            }
            
            // Set environment variable for password
            const env = { ...process.env, PGPASSWORD: this.dbPassword };
            
            // Create psql command for restoration
            const command = `psql -h ${this.dbHost} -U ${this.dbUser} -d ${this.dbName} -f "${backupPath}"`;
            
            console.log(`Restoring from backup: ${backupPath}`);
            
            exec(command, { env }, (error, stdout, stderr) => {
                if (error) {
                    console.error(`Restore error: ${error.message}`);
                    reject(error);
                    return;
                }
                
                if (stderr) {
                    console.warn(`Restore warning: ${stderr}`);
                }
                
                console.log('Database restored successfully');
                resolve();
            });
        });
    }
    
    /**
     * List all available backups
     * @returns {Promise<Array>} - List of backup files with metadata
     */
    async listBackups() {
        return new Promise((resolve, reject) => {
            fs.readdir(this.backupDir, (err, files) => {
                if (err) {
                    reject(err);
                    return;
                }
                
                // Filter for .sql files and get stats
                const backups = files
                    .filter(file => file.endsWith('.sql'))
                    .map(file => {
                        const filePath = path.join(this.backupDir, file);
                        const stats = fs.statSync(filePath);
                        
                        return {
                            name: file,
                            path: filePath,
                            size: stats.size,
                            created: stats.mtime
                        };
                    })
                    .sort((a, b) => b.created - a.created); // Sort by date, newest first
                
                resolve(backups);
            });
        });
    }
    
    /**
     * Schedule automatic backups
     * @param {number} intervalHours - Backup interval in hours
     * @returns {NodeJS.Timeout} - Timer reference
     */
    scheduleBackups(intervalHours = 24) {
        console.log(`Scheduling automatic backups every ${intervalHours} hours`);
        
        // Convert hours to milliseconds
        const interval = intervalHours * 60 * 60 * 1000;
        
        // Schedule the backup
        const timer = setInterval(async () => {
            try {
                const backupName = 'auto';
                await this.createBackup(backupName);
                
                // Clean up old backups (keep last 7)
                await this.cleanupOldBackups(7);
            } catch (error) {
                console.error('Scheduled backup failed:', error);
            }
        }, interval);
        
        // Run an initial backup
        this.createBackup('auto').catch(error => {
            console.error('Initial backup failed:', error);
        });
        
        return timer;
    }
    
    /**
     * Clean up old backups, keeping only the most recent ones
     * @param {number} keepCount - Number of backups to keep
     * @returns {Promise<void>}
     */
    async cleanupOldBackups(keepCount = 7) {
        try {
            const backups = await this.listBackups();
            
            // If we have more backups than the keep count
            if (backups.length > keepCount) {
                // Get the backups to delete (oldest first)
                const toDelete = backups.slice(keepCount);
                
                // Delete each backup
                for (const backup of toDelete) {
                    fs.unlinkSync(backup.path);
                    console.log(`Deleted old backup: ${backup.name}`);
                }
            }
        } catch (error) {
            console.error('Error cleaning up old backups:', error);
            throw error;
        }
    }
}

module.exports = new BackupManager();
