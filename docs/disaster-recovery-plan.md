# Disaster Recovery Plan

## Overview

This document outlines the disaster recovery procedures for the Public Website to ensure business continuity in the event of system failures, data loss, or other critical incidents.

## Recovery Objectives

- **Recovery Time Objective (RTO)**: 4 hours (240 minutes)
- **Recovery Point Objective (RPO)**: 1 hour (60 minutes)

## Backup Strategy

### Backup Schedule

1. **Full Backups**
   - Frequency: Weekly (Sundays at 2:00 AM)
   - Retention: 4 weeks
   - Contents: Complete system backup

2. **Incremental Backups**
   - Frequency: Daily (3:00 AM)
   - Retention: 14 days
   - Contents: Changes since last backup

3. **Database Backups**
   - Frequency: Hourly
   - Retention: 7 days
   - Contents: Complete database dump

### Backup Locations

- **Primary Storage**: AWS S3 (us-east-1)
- **Secondary Storage**: AWS S3 (us-west-2)
- Both locations use server-side encryption

### What Gets Backed Up

1. Database (PostgreSQL/MySQL)
2. File uploads (./public/uploads)
3. Configuration files (./config, package.json)
4. Application logs (./logs)

## Disaster Recovery Procedures

### 1. Incident Detection

Monitor for:
- System unavailability
- Data corruption
- Security breaches
- Infrastructure failures

### 2. Incident Assessment

1. Verify the scope of the incident
2. Determine if disaster recovery is needed
3. Notify stakeholders
4. Activate disaster recovery team

### 3. Recovery Steps

#### A. Infrastructure Recovery

```bash
# 1. Provision new infrastructure
# Use IaC tools (Terraform, CloudFormation, etc.)

# 2. Configure networking and security
# Ensure firewall rules, VPC, security groups are set up
```

#### B. Data Restoration

```bash
# 1. Download latest backup
node scripts/restore.js <backup-timestamp>

# 2. Restore database
# Script will automatically restore from latest backup

# 3. Restore file uploads
# Script will restore uploads directory

# 4. Restore configuration
# Script will restore config files
```

#### C. Application Deployment

```bash
# 1. Install dependencies
npm install

# 2. Build application
npm run build

# 3. Run tests
npm test

# 4. Start application
npm start
```

#### D. Verification

1. Test database connectivity
2. Verify file uploads are accessible
3. Test critical user flows
4. Check logs for errors
5. Monitor application performance

#### E. DNS and Traffic Routing

```bash
# 1. Update DNS records to point to new infrastructure
# 2. Monitor traffic routing
# 3. Verify SSL certificates
```

### 4. Post-Recovery

1. Document the incident
2. Conduct post-mortem analysis
3. Update recovery procedures based on lessons learned
4. Test restored system thoroughly
5. Notify stakeholders of recovery completion

## Manual Backup

To create an immediate backup:

```bash
node scripts/backup.js
```

## Manual Restore

To restore from a specific backup:

```bash
# List available backups
ls -la backups/

# Restore from specific timestamp
node scripts/restore.js 2025-10-11T10-30-00-000Z
```

## Testing and Validation

### Monthly Backup Verification

1. Automated restore to staging environment
2. Verify data integrity
3. Test application functionality
4. Document any issues

### Quarterly Disaster Recovery Drill

1. Simulate complete system failure
2. Execute full recovery procedure
3. Measure actual RTO and RPO
4. Update procedures as needed

## Failover Configuration

### Health Checks

- Endpoint: `/health`
- Interval: 60 seconds
- Auto-failover: Disabled (requires manual approval)

### Failover Procedure

1. Detect primary system failure
2. Notify operations team
3. Verify backup system health
4. Get approval for failover
5. Update DNS to point to backup system
6. Monitor traffic routing
7. Investigate primary system issues

## Contact Information

### Disaster Recovery Team

- **Operations Lead**: ops@example.com
- **Database Admin**: dba@example.com
- **DevOps Engineer**: devops@example.com
- **Security Team**: security@example.com

### Escalation Path

1. Level 1: On-call engineer
2. Level 2: Operations manager
3. Level 3: CTO/VP Engineering

## Notification Channels

- Email: ops@example.com
- Slack: #incidents channel
- PagerDuty: Critical alerts

## Environment Variables

Required environment variables for backup/restore:

```env
# AWS S3 Configuration
BACKUP_S3_BUCKET=publicwebsite-backups-primary
BACKUP_S3_REGION=us-east-1
BACKUP_S3_BUCKET_SECONDARY=publicwebsite-backups-secondary
BACKUP_S3_REGION_SECONDARY=us-west-2

# Database
DATABASE_URL=postgresql://user:pass@host:5432/dbname

# Notifications
BACKUP_NOTIFICATION_EMAIL=ops@example.com
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/xxx

# Health Check
HEALTH_CHECK_URL=/health
STAGING_URL=https://staging.example.com
```

## Maintenance

- Review and update this plan quarterly
- Test backup integrity monthly
- Conduct disaster recovery drills quarterly
- Update contact information as needed
- Review and adjust RTO/RPO objectives annually

## Appendix

### Common Issues and Solutions

**Issue**: Backup fails due to disk space
- Solution: Clear old backups, increase storage capacity

**Issue**: Database restore fails
- Solution: Check backup integrity, verify database credentials

**Issue**: File uploads not accessible after restore
- Solution: Verify file permissions, check storage paths

### Useful Commands

```bash
# Check backup size
du -sh backups/*

# List recent backups
ls -lat backups/ | head -10

# Test database connection
psql $DATABASE_URL -c "SELECT 1"

# Verify S3 bucket access
aws s3 ls s3://publicwebsite-backups-primary/
```
