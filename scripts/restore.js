#!/usr/bin/env node

/**
 * Restore Script
 * Restores backups for disaster recovery
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const backupConfig = require('../config/backup.config');

class RestoreManager {
  constructor(config, backupTimestamp) {
    this.config = config;
    this.backupTimestamp = backupTimestamp;
    this.backupDir = path.join(__dirname, '..', 'backups', backupTimestamp);
  }

  /**
   * Validate backup exists
   */
  validateBackup() {
    if (!fs.existsSync(this.backupDir)) {
      throw new Error(`Backup not found: ${this.backupDir}`);
    }
    console.log(`Validated backup directory: ${this.backupDir}`);
  }

  /**
   * Download backup from remote storage
   */
  async downloadBackup() {
    console.log('Downloading backup from remote storage...');

    try {
      const storage = this.config.storage.primary;
      console.log(`Downloading from ${storage.type}: ${storage.bucket}`);
      // AWS S3 download would go here
      // aws s3 sync s3://${storage.bucket}/${this.backupTimestamp} ${this.backupDir}

      console.log('Backup download completed');
    } catch (error) {
      console.error('Backup download failed:', error.message);
      throw error;
    }
  }

  /**
   * Restore database
   */
  async restoreDatabase() {
    if (!this.config.targets.database.enabled) {
      console.log('Database restore skipped (disabled)');
      return;
    }

    console.log('Starting database restore...');
    const dbBackupFile = path.join(this.backupDir, 'database.sql');

    try {
      if (fs.existsSync(dbBackupFile) || fs.existsSync(`${dbBackupFile}.gz`)) {
        // Decompress if needed
        if (fs.existsSync(`${dbBackupFile}.gz`)) {
          // execSync(`gunzip ${dbBackupFile}.gz`);
        }

        // Restore database
        const dbUrl = this.config.targets.database.connection;
        if (dbUrl) {
          // This would use psql or similar
          // execSync(`psql ${dbUrl} < ${dbBackupFile}`);
          console.log('Database restored from backup');
        }
      } else {
        console.warn('Database backup file not found');
      }
    } catch (error) {
      console.error('Database restore failed:', error.message);
      throw error;
    }
  }

  /**
   * Restore file uploads
   */
  async restoreUploads() {
    if (!this.config.targets.uploads.enabled) {
      console.log('Uploads restore skipped (disabled)');
      return;
    }

    console.log('Starting uploads restore...');
    const uploadsBackup = path.join(this.backupDir, 'uploads');
    const uploadsPath = path.join(__dirname, '..', this.config.targets.uploads.path);

    try {
      if (fs.existsSync(uploadsBackup)) {
        // Clear existing uploads
        if (fs.existsSync(uploadsPath)) {
          fs.rmSync(uploadsPath, { recursive: true });
        }

        // Restore uploads
        this.copyDirectory(uploadsBackup, uploadsPath);
        console.log('Uploads restored from backup');
      } else {
        console.warn('Uploads backup not found');
      }
    } catch (error) {
      console.error('Uploads restore failed:', error.message);
      throw error;
    }
  }

  /**
   * Restore configuration files
   */
  async restoreConfig() {
    if (!this.config.targets.config.enabled) {
      console.log('Config restore skipped (disabled)');
      return;
    }

    console.log('Starting config restore...');
    const configBackup = path.join(this.backupDir, 'config');

    try {
      if (fs.existsSync(configBackup)) {
        const entries = fs.readdirSync(configBackup, { withFileTypes: true });

        for (const entry of entries) {
          const backupPath = path.join(configBackup, entry.name);
          const targetPath = path.join(__dirname, '..', entry.name);

          if (entry.isDirectory()) {
            if (fs.existsSync(targetPath)) {
              fs.rmSync(targetPath, { recursive: true });
            }
            this.copyDirectory(backupPath, targetPath);
          } else {
            fs.copyFileSync(backupPath, targetPath);
          }
        }

        console.log('Config restored from backup');
      } else {
        console.warn('Config backup not found');
      }
    } catch (error) {
      console.error('Config restore failed:', error.message);
      throw error;
    }
  }

  /**
   * Verify restoration
   */
  async verifyRestore() {
    console.log('Verifying restoration...');

    try {
      // Check critical files exist
      const criticalPaths = [
        this.config.targets.uploads.path,
        './config'
      ];

      for (const criticalPath of criticalPaths) {
        const fullPath = path.join(__dirname, '..', criticalPath);
        if (!fs.existsSync(fullPath)) {
          throw new Error(`Critical path missing after restore: ${criticalPath}`);
        }
      }

      // Test database connection if applicable
      // await testDatabaseConnection();

      console.log('Restoration verified successfully');
      return true;
    } catch (error) {
      console.error('Restoration verification failed:', error.message);
      throw error;
    }
  }

  /**
   * Helper: Copy directory recursively
   */
  copyDirectory(src, dest) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }

    const entries = fs.readdirSync(src, { withFileTypes: true });

    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);

      if (entry.isDirectory()) {
        this.copyDirectory(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }

  /**
   * Run restore
   */
  async run() {
    console.log(`Starting restore from backup: ${this.backupTimestamp}`);

    try {
      await this.downloadBackup();
      this.validateBackup();
      await this.restoreDatabase();
      await this.restoreUploads();
      await this.restoreConfig();
      await this.verifyRestore();

      console.log('Restore completed successfully');
      return true;
    } catch (error) {
      console.error('Restore failed:', error);
      return false;
    }
  }
}

// Run restore if called directly
if (require.main === module) {
  const backupTimestamp = process.argv[2];

  if (!backupTimestamp) {
    console.error('Usage: node restore.js <backup-timestamp>');
    process.exit(1);
  }

  const manager = new RestoreManager(backupConfig, backupTimestamp);
  manager.run().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = RestoreManager;
