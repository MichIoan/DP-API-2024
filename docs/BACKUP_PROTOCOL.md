# Netflix API Database Backup Protocol

This document outlines the backup strategy and procedures for the Netflix API database.

## Backup Strategy

The Netflix API implements a comprehensive backup strategy to ensure data integrity and availability:

1. **Automated Daily Backups**: The system automatically creates daily backups at midnight.
2. **Manual Backups**: Administrators can create manual backups before major changes.
3. **Retention Policy**: The system retains the 7 most recent backups by default.
4. **Backup Storage**: Backups are stored in the `/backups` directory by default.

## Backup Types

### Full Database Backup
- Complete backup of the entire database
- Includes all tables, views, stored procedures, and data
- Uses PostgreSQL's `pg_dump` utility

## Backup Schedule

| Type | Frequency | Retention |
|------|-----------|-----------|
| Automated | Daily at midnight | 7 days |
| Manual | Before major changes | Until manually deleted |

## Backup Procedures

### Creating a Manual Backup

```bash
# Create a backup with default name (timestamp-based)
node src/database/backupScript.js backup

# Create a backup with a custom name
node src/database/backupScript.js backup custom_name
```

### Listing Available Backups

```bash
node src/database/backupScript.js list
```

### Restoring from a Backup

```bash
node src/database/backupScript.js restore /path/to/backup.sql
```

### Cleaning Up Old Backups

```bash
# Keep the 7 most recent backups (default)
node src/database/backupScript.js cleanup

# Keep a custom number of backups
node src/database/backupScript.js cleanup 10
```

## Scheduling Automated Backups

### On Linux/macOS (using cron)

Add the following to your crontab to schedule daily backups at midnight:

```
0 0 * * * cd /path/to/project && node src/database/backupScript.js backup auto
```

### On Windows (using Task Scheduler)

1. Open Task Scheduler
2. Create a new task
3. Set the trigger to run daily at midnight
4. Set the action to run `node src/database/backupScript.js backup auto`
5. Set the start in directory to your project directory

## Backup Verification

It's recommended to periodically verify backups by:

1. Restoring to a test environment
2. Running basic queries to ensure data integrity
3. Checking that all tables and stored procedures are present

## Backup File Format

Backup files are SQL dumps with the following naming convention:

```
[name]_[timestamp].sql
```

Example: `auto_2025-04-28T00-00-00-000Z.sql`

## Implementation Details

The backup system is implemented in:
- `src/database/backupManager.js` - Core backup functionality
- `src/database/backupScript.js` - Command-line interface

## Justification for Backup Choices

- **PostgreSQL pg_dump**: Industry-standard tool for PostgreSQL backups
- **Daily Backups**: Balances data protection with storage requirements
- **7-Day Retention**: Provides sufficient history while managing storage
- **SQL Format**: Ensures portability and ease of restoration
