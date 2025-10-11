#!/usr/bin/env node

/**
 * Backup Script
 * Performs backups according to backup.config.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const backupConfig = require('../config/backup.config');

class BackupManager {
  constructor(config) {
    this.config = config;
    this.timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    this.backupDir = path.join(__dirname, '..', 'backups', this.timestamp);
  }

  /**
   * Initialize backup directory
   */
  initBackupDir() {
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
    console.log(`Backup directory created: ${this.backupDir}`);
  }

  /**
   * Backup database
   */
  async backupDatabase() {
    if (!this.config.targets.database.enabled) {
      console.log('Database backup disabled');
      return;
    }

    console.log('Starting database backup...');
    const dbBackupFile = path.join(this.backupDir, 'database.sql');

    try {
      // Example for PostgreSQL - adjust for your database
      const dbUrl = this.config.targets.database.connection;
      if (dbUrl) {
        // This would use pg_dump or similar
        // execSync(`pg_dump ${dbUrl} > ${dbBackupFile}`);

        // Placeholder for demonstration
        fs.writeFileSync(dbBackupFile, `-- Database backup ${this.timestamp}\n`);

        if (this.config.targets.database.compress) {
          this.compressFile(dbBackupFile);
        }

        console.log('Database backup completed');
      }
    } catch (error) {
      console.error('Database backup failed:', error.message);
      throw error;
    }
  }

  /**
   * Backup file uploads
   */
  async backupUploads() {
    if (!this.config.targets.uploads.enabled) {
      console.log('Uploads backup disabled');
      return;
    }

    console.log('Starting uploads backup...');
    const uploadsPath = path.join(__dirname, '..', this.config.targets.uploads.path);
    const uploadsBackup = path.join(this.backupDir, 'uploads');

    try {
      if (fs.existsSync(uploadsPath)) {
        this.copyDirectory(uploadsPath, uploadsBackup);

        if (this.config.targets.uploads.compress) {
          this.compressDirectory(uploadsBackup);
        }

        console.log('Uploads backup completed');
      }
    } catch (error) {
      console.error('Uploads backup failed:', error.message);
      throw error;
    }
  }

  /**
   * Backup configuration files
   */
  async backupConfig() {
    if (!this.config.targets.config.enabled) {
      console.log('Config backup disabled');
      return;
    }

    console.log('Starting config backup...');
    const configBackup = path.join(this.backupDir, 'config');

    try {
      fs.mkdirSync(configBackup, { recursive: true });

      this.config.targets.config.paths.forEach(configPath => {
        const fullPath = path.join(__dirname, '..', configPath);
        if (fs.existsSync(fullPath)) {
          const targetPath = path.join(configBackup, path.basename(configPath));
          if (fs.statSync(fullPath).isDirectory()) {
            this.copyDirectory(fullPath, targetPath);
          } else {
            fs.copyFileSync(fullPath, targetPath);
          }
        }
      });

      console.log('Config backup completed');
    } catch (error) {
      console.error('Config backup failed:', error.message);
      throw error;
    }
  }

  /**
   * Backup logs
   */
  async backupLogs() {
    if (!this.config.targets.logs.enabled) {
      console.log('Logs backup disabled');
      return;
    }

    console.log('Starting logs backup...');
    const logsPath = path.join(__dirname, '..', this.config.targets.logs.path);
    const logsBackup = path.join(this.backupDir, 'logs');

    try {
      if (fs.existsSync(logsPath)) {
        this.copyDirectory(logsPath, logsBackup);

        if (this.config.targets.logs.compress) {
          this.compressDirectory(logsBackup);
        }

        console.log('Logs backup completed');
      }
    } catch (error) {
      console.error('Logs backup failed:', error.message);
      throw error;
    }
  }

  /**
   * Upload backup to remote storage
   */
  async uploadBackup() {
    console.log('Uploading backup to remote storage...');

    try {
      const storages = [this.config.storage.primary];
      if (this.config.storage.secondary) {
        storages.push(this.config.storage.secondary);
      }

      for (const storage of storages) {
        console.log(`Uploading to ${storage.type}: ${storage.bucket}`);
        // AWS S3 upload would go here
        // aws s3 sync ${this.backupDir} s3://${storage.bucket}/${this.timestamp}
      }

      console.log('Backup upload completed');
    } catch (error) {
      console.error('Backup upload failed:', error.message);
      throw error;
    }
  }

  /**
   * Send notification
   */
  async notify(success, error = null) {
    const message = success
      ? `Backup completed successfully at ${this.timestamp}`
      : `Backup failed at ${this.timestamp}: ${error}`;

    console.log(message);

    if (this.config.notifications.email) {
      // Send email notification
      console.log(`Would send email to: ${this.config.notifications.email}`);
    }

    if (this.config.notifications.slack?.enabled && this.config.notifications.slack?.webhook) {
      // Send Slack notification
      console.log('Would send Slack notification');
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
   * Helper: Compress file
   */
  compressFile(filePath) {
    console.log(`Compressing ${filePath}...`);
    // Would use gzip or similar
    // execSync(`gzip ${filePath}`);
  }

  /**
   * Helper: Compress directory
   */
  compressDirectory(dirPath) {
    console.log(`Compressing ${dirPath}...`);
    // Would use tar or similar
    // execSync(`tar -czf ${dirPath}.tar.gz ${dirPath}`);
  }

  /**
   * Run full backup
   */
  async run() {
    console.log(`Starting backup at ${this.timestamp}`);

    try {
      this.initBackupDir();
      await this.backupDatabase();
      await this.backupUploads();
      await this.backupConfig();
      await this.backupLogs();
      await this.uploadBackup();
      await this.notify(true);

      console.log('Backup completed successfully');
      return true;
    } catch (error) {
      await this.notify(false, error.message);
      console.error('Backup failed:', error);
      return false;
    }
  }
}

// Run backup if called directly
if (require.main === module) {
  const manager = new BackupManager(backupConfig);
  manager.run().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = BackupManager;
