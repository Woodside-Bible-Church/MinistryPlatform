-- ===================================================================
-- Migration: Migrate Project_RSVPs data to Projects table
-- ===================================================================
-- Date: 2025-11-19
-- Purpose: Copy RSVP configuration from Project_RSVPs to Projects table
--          This allows us to retire the Project_RSVPs table
-- ===================================================================

USE [MinistryPlatform]
GO

PRINT '========================================'
PRINT 'Migrating Project_RSVPs data to Projects'
PRINT '========================================'

-- ===================================================================
-- Update Projects with data from Project_RSVPs
-- ===================================================================

UPDATE p
SET
    p.RSVP_Title = pr.RSVP_Title,
    p.RSVP_Description = pr.RSVP_Description,
    p.RSVP_Slug = pr.RSVP_Slug,
    p.RSVP_Is_Active = pr.Is_Active,
    p.RSVP_Start_Date = pr.Start_Date,
    p.RSVP_End_Date = pr.End_Date,
    p.RSVP_Require_Contact_Lookup = pr.Require_Contact_Lookup,
    p.RSVP_Allow_Guest_Submission = pr.Allow_Guest_Submission
FROM Projects p
INNER JOIN Project_RSVPs pr ON p.Project_ID = pr.Project_ID
WHERE p.RSVP_Title IS NULL  -- Only update if not already set

DECLARE @UpdatedCount INT = @@ROWCOUNT
PRINT '  ✓ Updated ' + CAST(@UpdatedCount AS NVARCHAR) + ' Projects with RSVP data'

GO

-- ===================================================================
-- Verify migration
-- ===================================================================

PRINT ''
PRINT 'Verification:'

DECLARE @ProjectsWithRSVP INT
DECLARE @ProjectRSVPCount INT

SELECT @ProjectsWithRSVP = COUNT(*)
FROM Projects
WHERE RSVP_Title IS NOT NULL

SELECT @ProjectRSVPCount = COUNT(*)
FROM Project_RSVPs

PRINT '  - Projects with RSVP data: ' + CAST(@ProjectsWithRSVP AS NVARCHAR)
PRINT '  - Project_RSVPs records: ' + CAST(@ProjectRSVPCount AS NVARCHAR)

IF @ProjectsWithRSVP = @ProjectRSVPCount
BEGIN
    PRINT '  ✓ All Project_RSVPs migrated successfully'
END
ELSE
BEGIN
    PRINT '  ⚠ Warning: Count mismatch - verify data manually'
END

GO

PRINT ''
PRINT '========================================'
PRINT 'Migration Complete!'
PRINT '========================================'
PRINT ''
PRINT 'Next Steps:'
PRINT '  1. Verify RSVP data in Projects table'
PRINT '  2. Test the new stored procedures'
PRINT '  3. Once verified, Project_RSVPs table can be dropped'
PRINT ''

GO
