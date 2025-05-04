/**
 * Database Backup Script
 * This script can be run manually or scheduled via cron/task scheduler
 * to create backups of the Netflix database
 */

const backupManager = require('./backupManager');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2);
const command = args[0] || 'backup';

async function main() {
    try {
        switch (command) {
            case 'backup':
                // Create a manual backup
                const backupName = args[1] || 'manual';
                const backupPath = await backupManager.createBackup(backupName);
                console.log(`Backup created: ${backupPath}`);
                break;
                
            case 'restore':
                // Restore from a backup file
                const restorePath = args[1];
                if (!restorePath) {
                    console.error('Error: Backup file path is required for restore');
                    process.exit(1);
                }
                
                // Resolve relative path if needed
                const fullPath = path.isAbsolute(restorePath) 
                    ? restorePath 
                    : path.resolve(process.cwd(), restorePath);
                    
                await backupManager.restoreBackup(fullPath);
                console.log('Database restored successfully');
                break;
                
            case 'list':
                // List available backups
                const backups = await backupManager.listBackups();
                
                if (backups.length === 0) {
                    console.log('No backups found');
                } else {
                    console.log('Available backups:');
                    backups.forEach((backup, index) => {
                        const date = backup.created.toLocaleString();
                        const size = (backup.size / 1024 / 1024).toFixed(2); // Convert to MB
                        console.log(`${index + 1}. ${backup.name} (${size} MB) - Created: ${date}`);
                    });
                }
                break;
                
            case 'cleanup':
                // Clean up old backups
                const keepCount = parseInt(args[1]) || 7;
                await backupManager.cleanupOldBackups(keepCount);
                console.log(`Cleaned up old backups, keeping ${keepCount} most recent`);
                break;
                
            default:
                console.error(`Unknown command: ${command}`);
                console.log('Available commands: backup, restore, list, cleanup');
                process.exit(1);
        }
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

// Run the main function
main();
