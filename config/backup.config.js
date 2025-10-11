/**
 * Backup and Disaster Recovery Configuration
 * Defines backup strategies for business continuity
 */

module.exports = {
  // Backup scheduling configuration
  schedule: {
    // Full backups - complete system backup
    full: {
      frequency: 'weekly',
      dayOfWeek: 0, // Sunday
      time: '02:00',
      retention: 4 // Keep 4 weeks
    },
    // Incremental backups - changes only
    incremental: {
      frequency: 'daily',
      time: '03:00',
      retention: 14 // Keep 14 days
    },
    // Database backups
    database: {
      frequency: 'hourly',
      retention: 7 // Keep 7 days
    }
  },

  // Storage locations for backups
  storage: {
    primary: {
      type: 's3',
      bucket: process.env.BACKUP_S3_BUCKET || 'publicwebsite-backups-primary',
      region: process.env.BACKUP_S3_REGION || 'us-east-1',
      encryption: true
    },
    secondary: {
      type: 's3',
      bucket: process.env.BACKUP_S3_BUCKET_SECONDARY || 'publicwebsite-backups-secondary',
      region: process.env.BACKUP_S3_REGION_SECONDARY || 'us-west-2',
      encryption: true
    }
  },

  // What to backup
  targets: {
    database: {
      enabled: true,
      connection: process.env.DATABASE_URL,
      compress: true
    },
    uploads: {
      enabled: true,
      path: './public/uploads',
      compress: true
    },
    config: {
      enabled: true,
      paths: [
        './config',
        './.env.example',
        './package.json'
      ],
      compress: false
    },
    logs: {
      enabled: true,
      path: './logs',
      compress: true,
      retention: 30 // Keep 30 days
    }
  },

  // Disaster recovery settings
  disaster_recovery: {
    // Recovery Time Objective (RTO) in minutes
    rto: 240,
    // Recovery Point Objective (RPO) in minutes
    rpo: 60,
    // Failover configuration
    failover: {
      enabled: true,
      healthCheckInterval: 60, // seconds
      healthCheckUrl: process.env.HEALTH_CHECK_URL || '/health',
      autoFailover: false // Require manual approval
    },
    // Recovery procedures
    procedures: [
      'Verify backup integrity',
      'Provision new infrastructure',
      'Restore database from latest backup',
      'Restore file uploads',
      'Update DNS records',
      'Verify application functionality'
    ]
  },

  // Notification settings
  notifications: {
    email: process.env.BACKUP_NOTIFICATION_EMAIL || 'ops@example.com',
    slack: {
      enabled: true,
      webhook: process.env.SLACK_WEBHOOK_URL
    },
    onSuccess: false, // Only notify on failures
    onFailure: true
  },

  // Verification and testing
  verification: {
    enabled: true,
    schedule: 'monthly',
    autoRestore: true, // Test restore to staging environment
    stagingEnv: process.env.STAGING_URL
  }
};
