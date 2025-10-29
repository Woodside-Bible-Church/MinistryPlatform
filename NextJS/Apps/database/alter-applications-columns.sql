-- =============================================
-- ALTER TABLE: Remove Application_ prefix from select columns
-- =============================================
-- Run this script AFTER platform-schema.sql if tables already exist
-- This renames columns in the Applications table
-- Keeps: Application_Name, Application_Key
-- Renames: Application_Description -> Description, Application_Icon -> Icon, Application_Route -> Route
-- =============================================

USE [MinistryPlatform]
GO

PRINT 'Starting column rename migration for Applications table...';
GO

-- Rename Application_Description to Description
EXEC sp_rename 'Applications.Application_Description', 'Description', 'COLUMN';
GO

-- Rename Application_Icon to Icon
EXEC sp_rename 'Applications.Application_Icon', 'Icon', 'COLUMN';
GO

-- Rename Application_Route to Route
EXEC sp_rename 'Applications.Application_Route', 'Route', 'COLUMN';
GO

PRINT 'Column rename migration completed successfully!';
PRINT 'Remember to update stored procedures using the updated platform-schema.sql';
GO
