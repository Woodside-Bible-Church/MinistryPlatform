-- =============================================
-- Add Budget Field to Events Table
-- Author: Claude Code
-- Date: 2025-12-09
-- Description: Add Include_Registrations_In_Project_Budgets field to Events table
-- =============================================

USE [MinistryPlatform]
GO

-- Add Include_Registrations_In_Project_Budgets field
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Events') AND name = 'Include_Registrations_In_Project_Budgets')
BEGIN
    PRINT 'Adding Include_Registrations_In_Project_Budgets column to Events table...'
    ALTER TABLE dbo.Events ADD Include_Registrations_In_Project_Budgets BIT NOT NULL DEFAULT 0
    PRINT 'Include_Registrations_In_Project_Budgets column added.'
END
ELSE
    PRINT 'Include_Registrations_In_Project_Budgets column already exists, skipping.'

GO
