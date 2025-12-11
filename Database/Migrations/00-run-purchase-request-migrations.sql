-- =============================================
-- Run All Purchase Request Migrations
-- Author: Claude Code
-- Date: 2025-12-11
-- Description: Execute all migrations for purchase request feature
-- =============================================

USE [MinistryPlatform]
GO

PRINT '=========================================='
PRINT 'Starting Purchase Request Migration'
PRINT '=========================================='
PRINT ''

-- Migration 25: Create Purchase Requests Table
PRINT 'Step 1: Creating Purchase Requests Table'
PRINT '------------------------------------------'
:r 25-create-purchase-requests-table.sql
PRINT ''

-- Migration 26: Modify Transactions Table
PRINT 'Step 2: Modifying Transactions Table'
PRINT '------------------------------------------'
:r 26-modify-transactions-for-purchase-requests.sql
PRINT ''

-- Migration 27: Migrate Existing Data
PRINT 'Step 3: Migrating Existing Data'
PRINT '------------------------------------------'
:r 27-migrate-existing-transactions-to-purchase-requests.sql
PRINT ''

PRINT '=========================================='
PRINT 'Purchase Request Migration Complete!'
PRINT '=========================================='
GO
