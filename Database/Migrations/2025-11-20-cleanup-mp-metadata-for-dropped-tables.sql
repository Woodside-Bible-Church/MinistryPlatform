-- ===================================================================
-- Migration: Clean Up MP Metadata for Dropped RSVP Tables
-- Date: 2025-11-20
-- ===================================================================
-- This script removes MinistryPlatform metadata (Pages, Sub_Pages,
-- Security Roles, Navigation) for the dropped RSVP tables.
--
-- This fixes the "Parent page is not found" error that prevents MP
-- from loading.
--
-- IMPORTANT: This cleans up MP's internal metadata, not application data.
-- ===================================================================

USE [MinistryPlatform]
GO

PRINT '========================================';
PRINT 'Cleanup MP Metadata for Dropped Tables';
PRINT 'Starting: ' + CONVERT(VARCHAR, GETDATE(), 120);
PRINT '========================================';
PRINT '';

-- ===================================================================
-- STEP 1: Find Page IDs for dropped tables
-- ===================================================================
PRINT 'STEP 1: Finding Page IDs for dropped tables...';
PRINT '';

DECLARE @PageIDs TABLE (Page_ID INT, Table_Name NVARCHAR(255));

INSERT INTO @PageIDs (Page_ID, Table_Name)
SELECT
    Page_ID,
    Table_Name
FROM dp_Pages
WHERE Table_Name IN (
    'Project_RSVPs',
    'Event_RSVPs',
    'Event_RSVP_Answers',
    'Project_RSVP_Questions',
    'Question_Options',
    'RSVP_Email_Campaigns',
    'RSVP_Email_Campaign_Conditions',
    'RSVP_Email_Campaign_Log'
    -- Note: NOT including RSVP_Statuses - it's a valid table
);

SELECT * FROM @PageIDs;

PRINT '';

-- ===================================================================
-- STEP 2: Remove from Navigation (Page_Section_Pages)
-- ===================================================================
PRINT 'STEP 2: Removing pages from navigation...';
PRINT '';

DELETE FROM dp_Page_Section_Pages
WHERE Page_ID IN (SELECT Page_ID FROM @PageIDs);

PRINT 'Removed ' + CAST(@@ROWCOUNT AS VARCHAR) + ' navigation entries.';
PRINT '';

-- ===================================================================
-- STEP 3: Remove Security Role Page assignments
-- ===================================================================
PRINT 'STEP 3: Removing security role page assignments...';
PRINT '';

DELETE FROM dp_Role_Pages
WHERE Page_ID IN (SELECT Page_ID FROM @PageIDs);

PRINT 'Removed ' + CAST(@@ROWCOUNT AS VARCHAR) + ' role page assignments.';
PRINT '';

-- ===================================================================
-- STEP 4: Remove Sub_Pages
-- ===================================================================
PRINT 'STEP 4: Removing sub-pages...';
PRINT '';

-- Remove sub-pages where the parent page is one we're deleting
DELETE FROM dp_Sub_Pages
WHERE Parent_Page_ID IN (SELECT Page_ID FROM @PageIDs);

PRINT 'Removed ' + CAST(@@ROWCOUNT AS VARCHAR) + ' sub-pages (by parent).';
PRINT '';

-- Remove sub-pages where the target page is one we're deleting
DELETE FROM dp_Sub_Pages
WHERE Target_Page_ID IN (SELECT Page_ID FROM @PageIDs);

PRINT 'Removed ' + CAST(@@ROWCOUNT AS VARCHAR) + ' sub-pages (by target).';
PRINT '';

-- ===================================================================
-- STEP 5: Remove Page Views
-- ===================================================================
PRINT 'STEP 5: Removing page views...';
PRINT '';

IF OBJECT_ID('dp_Page_Views', 'U') IS NOT NULL
BEGIN
    DELETE FROM dp_Page_Views
    WHERE Page_ID IN (SELECT Page_ID FROM @PageIDs);

    PRINT 'Removed ' + CAST(@@ROWCOUNT AS VARCHAR) + ' page views.';
END
ELSE
    PRINT 'dp_Page_Views table does not exist - skipped.';

PRINT '';

-- ===================================================================
-- STEP 6: Remove Pages themselves
-- ===================================================================
PRINT 'STEP 6: Removing pages...';
PRINT '';

DELETE FROM dp_Pages
WHERE Page_ID IN (SELECT Page_ID FROM @PageIDs);

PRINT 'Removed ' + CAST(@@ROWCOUNT AS VARCHAR) + ' pages.';
PRINT '';

-- ===================================================================
-- STEP 7: Verification
-- ===================================================================
PRINT 'STEP 7: Verifying cleanup...';
PRINT '';

PRINT 'Remaining pages for RSVP-related tables:';
SELECT
    Page_ID,
    Display_Name,
    Table_Name
FROM dp_Pages
WHERE Table_Name LIKE '%RSVP%'
   OR Table_Name LIKE '%Question%'
ORDER BY Table_Name;

PRINT '';
PRINT '========================================';
PRINT 'Metadata cleanup complete!';
PRINT 'Finished: ' + CONVERT(VARCHAR, GETDATE(), 120);
PRINT '========================================';
PRINT '';
PRINT 'NEXT STEPS:';
PRINT '1. Try restarting MP Internal application pool again';
PRINT '2. The "Parent page is not found" error should be resolved';
PRINT '3. MinistryPlatform should load normally';
PRINT '';

GO
