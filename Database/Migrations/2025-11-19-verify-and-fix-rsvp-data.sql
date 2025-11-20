-- ===================================================================
-- Verification and Fix: Check RSVP data in Projects table
-- ===================================================================
-- Date: 2025-11-19
-- Purpose: Verify migration and fix slug typo
-- ===================================================================

USE [MinistryPlatform]
GO

PRINT '========================================'
PRINT 'Verifying RSVP Data in Projects Table'
PRINT '========================================'
PRINT ''

-- ===================================================================
-- Check what RSVP data exists in Projects table
-- ===================================================================

PRINT 'Projects with RSVP data:'
PRINT ''

SELECT
    Project_ID,
    RSVP_Title,
    RSVP_Slug,
    RSVP_Is_Active,
    RSVP_Primary_Color,
    RSVP_Secondary_Color,
    RSVP_Accent_Color,
    Form_ID,
    RSVP_Start_Date,
    RSVP_End_Date
FROM Projects
WHERE RSVP_Title IS NOT NULL
ORDER BY Project_ID

PRINT ''
PRINT '========================================'
PRINT 'Checking for image files in dp_Files'
PRINT '========================================'
PRINT ''

SELECT
    p.Project_ID,
    p.RSVP_Title,
    f.File_ID,
    f.File_Name,
    f.Unique_Name,
    f.Extension,
    f.Description
FROM Projects p
LEFT JOIN dp_Files f ON f.Record_ID = p.Project_ID
    AND f.Table_Name = 'Projects'
    AND f.File_Name IN ('RSVP_Background', 'RSVP_Header')
WHERE p.RSVP_Title IS NOT NULL
ORDER BY p.Project_ID, f.File_Name

PRINT ''
PRINT '========================================'
PRINT 'Fixing slug typo for Project_ID 5'
PRINT '========================================'
PRINT ''

-- Fix the slug typo from "chistmas-2025" to "christmas-2025"
UPDATE Projects
SET RSVP_Slug = 'christmas-2025'
WHERE Project_ID = 5
  AND RSVP_Slug = 'chistmas-2025'

IF @@ROWCOUNT > 0
    PRINT '  ✓ Fixed slug from "chistmas-2025" to "christmas-2025"'
ELSE
    PRINT '  - No slug typo found to fix'

PRINT ''
PRINT 'Migration verification complete!'
GO
