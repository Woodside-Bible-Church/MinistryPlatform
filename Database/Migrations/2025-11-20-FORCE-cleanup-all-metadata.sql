-- ===================================================================
-- FORCE Cleanup ALL MP Metadata for Dropped RSVP Tables
-- Date: 2025-11-20
-- ===================================================================
-- This script FORCES removal of all MinistryPlatform metadata
-- for the dropped RSVP tables.
-- ===================================================================

USE [MinistryPlatform]
GO

PRINT '========================================';
PRINT 'FORCE Cleanup MP Metadata';
PRINT '========================================';
PRINT '';

-- Specific Page IDs we know exist
DECLARE @PageIDsToDelete TABLE (Page_ID INT);
INSERT INTO @PageIDsToDelete VALUES (965), (966), (967), (969), (970);

-- Specific Sub-Page IDs we know exist
DECLARE @SubPageIDsToDelete TABLE (Sub_Page_ID INT);
INSERT INTO @SubPageIDsToDelete VALUES (664), (665), (666), (667), (668);

-- ===================================================================
-- STEP 1: Delete from dp_Selections first (FK dependency)
-- ===================================================================
PRINT 'STEP 1: Deleting selections referencing sub-pages...';
DELETE FROM dp_Selections WHERE Sub_Page_ID IN (SELECT Sub_Page_ID FROM @SubPageIDsToDelete);
PRINT 'Deleted ' + CAST(@@ROWCOUNT AS VARCHAR) + ' selections.';
PRINT '';

-- ===================================================================
-- STEP 1.5: Delete from dp_Role_Sub_Pages (FK dependency)
-- ===================================================================
PRINT 'STEP 1.5: Deleting role sub-page assignments...';
DELETE FROM dp_Role_Sub_Pages WHERE Sub_Page_ID IN (SELECT Sub_Page_ID FROM @SubPageIDsToDelete);
PRINT 'Deleted ' + CAST(@@ROWCOUNT AS VARCHAR) + ' role sub-page assignments.';
PRINT '';

-- ===================================================================
-- STEP 1.6: Delete from dp_User_Preferences (FK dependency)
-- ===================================================================
PRINT 'STEP 1.6: Deleting user preferences referencing sub-pages...';
DELETE FROM dp_User_Preferences WHERE Sub_Page_ID IN (SELECT Sub_Page_ID FROM @SubPageIDsToDelete);
PRINT 'Deleted ' + CAST(@@ROWCOUNT AS VARCHAR) + ' user preferences.';
PRINT '';

-- ===================================================================
-- STEP 2: Delete specific sub-pages
-- ===================================================================
PRINT 'STEP 2: Deleting specific sub-pages...';
DELETE FROM dp_Sub_Pages WHERE Sub_Page_ID IN (SELECT Sub_Page_ID FROM @SubPageIDsToDelete);
PRINT 'Deleted ' + CAST(@@ROWCOUNT AS VARCHAR) + ' sub-pages.';
PRINT '';

-- ===================================================================
-- STEP 2: Delete ANY sub-pages referencing these pages
-- ===================================================================
PRINT 'STEP 2: Deleting sub-pages by parent/target reference...';
DELETE FROM dp_Sub_Pages
WHERE Parent_Page_ID IN (SELECT Page_ID FROM @PageIDsToDelete)
   OR Target_Page_ID IN (SELECT Page_ID FROM @PageIDsToDelete);
PRINT 'Deleted ' + CAST(@@ROWCOUNT AS VARCHAR) + ' sub-pages.';
PRINT '';

-- ===================================================================
-- STEP 3: Delete navigation entries
-- ===================================================================
PRINT 'STEP 3: Deleting navigation entries...';
DELETE FROM dp_Page_Section_Pages WHERE Page_ID IN (SELECT Page_ID FROM @PageIDsToDelete);
PRINT 'Deleted ' + CAST(@@ROWCOUNT AS VARCHAR) + ' navigation entries.';
PRINT '';

-- ===================================================================
-- STEP 4: Delete security role page assignments
-- ===================================================================
PRINT 'STEP 4: Deleting security role page assignments...';
DELETE FROM dp_Role_Pages WHERE Page_ID IN (SELECT Page_ID FROM @PageIDsToDelete);
PRINT 'Deleted ' + CAST(@@ROWCOUNT AS VARCHAR) + ' role page assignments.';
PRINT '';

-- ===================================================================
-- STEP 5: Delete page views
-- ===================================================================
PRINT 'STEP 5: Deleting page views...';
IF OBJECT_ID('dp_Page_Views', 'U') IS NOT NULL
BEGIN
    DELETE FROM dp_Page_Views WHERE Page_ID IN (SELECT Page_ID FROM @PageIDsToDelete);
    PRINT 'Deleted ' + CAST(@@ROWCOUNT AS VARCHAR) + ' page views.';
END
ELSE
    PRINT 'dp_Page_Views table does not exist.';
PRINT '';

-- ===================================================================
-- STEP 6: Check for any other FK relationships
-- ===================================================================
PRINT 'STEP 6: Checking for other references...';

-- dp_Page_Section_Pages might have other columns
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dp_Page_Section_Pages') AND name = 'Page_Section_ID')
BEGIN
    -- Check if there are Page_Sections that only contain these pages
    PRINT 'Checking dp_Page_Sections...';
    SELECT ps.Page_Section_ID, ps.Page_Section
    FROM dp_Page_Sections ps
    WHERE ps.Page_Section_ID IN (
        SELECT DISTINCT Page_Section_ID
        FROM dp_Page_Section_Pages
        WHERE Page_ID IN (SELECT Page_ID FROM @PageIDsToDelete)
    );
END
PRINT '';

-- ===================================================================
-- STEP 6.5: Delete from dp_Selections referencing pages (FK dependency)
-- ===================================================================
PRINT 'STEP 6.5: Deleting selections referencing pages...';
DELETE FROM dp_Selections WHERE Page_ID IN (SELECT Page_ID FROM @PageIDsToDelete);
PRINT 'Deleted ' + CAST(@@ROWCOUNT AS VARCHAR) + ' selections.';
PRINT '';

-- ===================================================================
-- STEP 6.6: Delete from dp_User_Preferences referencing pages (FK dependency)
-- ===================================================================
PRINT 'STEP 6.6: Deleting user preferences referencing pages...';
DELETE FROM dp_User_Preferences WHERE Page_ID IN (SELECT Page_ID FROM @PageIDsToDelete);
PRINT 'Deleted ' + CAST(@@ROWCOUNT AS VARCHAR) + ' user preferences.';
PRINT '';

-- ===================================================================
-- STEP 7: FORCE delete the pages themselves
-- ===================================================================
PRINT 'STEP 7: FORCE deleting pages...';
DELETE FROM dp_Pages WHERE Page_ID IN (SELECT Page_ID FROM @PageIDsToDelete);
PRINT 'Deleted ' + CAST(@@ROWCOUNT AS VARCHAR) + ' pages.';
PRINT '';

-- ===================================================================
-- STEP 8: Final verification
-- ===================================================================
PRINT 'STEP 8: Final verification...';
PRINT '';

PRINT 'Pages that still exist (should be 0):';
SELECT COUNT(*) AS remaining_pages FROM dp_Pages WHERE Page_ID IN (SELECT Page_ID FROM @PageIDsToDelete);

PRINT 'Sub-pages that still exist (should be 0):';
SELECT COUNT(*) AS remaining_subpages FROM dp_Sub_Pages
WHERE Parent_Page_ID IN (SELECT Page_ID FROM @PageIDsToDelete)
   OR Target_Page_ID IN (SELECT Page_ID FROM @PageIDsToDelete);

PRINT '';
PRINT '========================================';
PRINT 'FORCE cleanup complete!';
PRINT '========================================';
PRINT '';
PRINT 'NEXT STEPS:';
PRINT '1. Restart MP Internal application pool';
PRINT '2. Wait 1-2 minutes for MP to rebuild cache';
PRINT '3. Try accessing MinistryPlatform';
PRINT '';

GO
