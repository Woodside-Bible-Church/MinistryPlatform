-- ===================================================================
-- Alter Table: Project_Campuses - Add Domain_ID
-- ===================================================================
-- Adds Domain_ID field to existing Project_Campuses table
-- ===================================================================

USE [MinistryPlatform]
GO

-- Add Domain_ID column
ALTER TABLE dbo.Project_Campuses
    ADD Domain_ID INT NOT NULL DEFAULT 1;
GO

-- Add Foreign Key constraint
ALTER TABLE dbo.Project_Campuses
    ADD CONSTRAINT FK_Project_Campuses_Domains
        FOREIGN KEY (Domain_ID) REFERENCES dbo.dp_Domains(Domain_ID);
GO

PRINT 'Added Domain_ID field to Project_Campuses table';
