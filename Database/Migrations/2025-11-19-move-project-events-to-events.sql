/*
 * Migration: Move Project_Events fields to Events table
 * Date: 2025-11-19
 *
 * Purpose: Eliminate the Project_Events junction table by moving its fields
 * directly to the Events table, since events are only ever part of one project.
 *
 * Changes:
 * 1. Add three new fields to Events table:
 *    - Project_ID (nullable int, FK to Projects)
 *    - Include_In_RSVP (nullable bit)
 *    - RSVP_Capacity_Modifier (nullable int)
 * 2. Migrate data from Project_Events to Events
 * 3. Drop the Project_Events table
 */

-- ============================================================
-- STEP 1: Add new columns to Events table
-- ============================================================
PRINT 'Adding new columns to Events table...'

-- Add Project_ID column
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Events') AND name = 'Project_ID')
BEGIN
    EXEC('ALTER TABLE Events ADD Project_ID INT NULL')
    PRINT '  ✓ Added Project_ID column'
END
ELSE
BEGIN
    PRINT '  ℹ Project_ID column already exists'
END

-- Add Include_In_RSVP column
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Events') AND name = 'Include_In_RSVP')
BEGIN
    EXEC('ALTER TABLE Events ADD Include_In_RSVP BIT NULL')
    PRINT '  ✓ Added Include_In_RSVP column'
END
ELSE
BEGIN
    PRINT '  ℹ Include_In_RSVP column already exists'
END

-- Add RSVP_Capacity_Modifier column
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Events') AND name = 'RSVP_Capacity_Modifier')
BEGIN
    EXEC('ALTER TABLE Events ADD RSVP_Capacity_Modifier INT NULL')
    PRINT '  ✓ Added RSVP_Capacity_Modifier column'
END
ELSE
BEGIN
    PRINT '  ℹ RSVP_Capacity_Modifier column already exists'
END

GO

-- ============================================================
-- STEP 2: Migrate data from Project_Events to Events
-- ============================================================
PRINT ''
PRINT 'Migrating data from Project_Events to Events...'

-- Check if Project_Events table exists
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'Project_Events')
BEGIN
    DECLARE @rowCount INT
    DECLARE @totalProjectEvents INT

    -- Count total records in Project_Events
    SELECT @totalProjectEvents = COUNT(*) FROM Project_Events
    PRINT '  Found ' + CAST(@totalProjectEvents AS VARCHAR) + ' records in Project_Events table'

    -- Update Events table with data from Project_Events
    UPDATE e
    SET
        e.Project_ID = pe.Project_ID,
        e.Include_In_RSVP = pe.Include_In_RSVP,
        e.RSVP_Capacity_Modifier = pe.RSVP_Capacity_Modifier
    FROM Events e
    INNER JOIN Project_Events pe ON e.Event_ID = pe.Event_ID

    SELECT @rowCount = @@ROWCOUNT
    PRINT '  ✓ Migrated ' + CAST(@rowCount AS VARCHAR) + ' events from Project_Events to Events'

    -- Check for events that are in multiple projects (should not happen based on requirements)
    IF EXISTS (
        SELECT Event_ID, COUNT(DISTINCT Project_ID) as ProjectCount
        FROM Project_Events
        GROUP BY Event_ID
        HAVING COUNT(DISTINCT Project_ID) > 1
    )
    BEGIN
        PRINT ''
        PRINT '  ⚠ WARNING: Found events linked to multiple projects!'
        PRINT '  The following events are in multiple projects:'

        SELECT
            pe.Event_ID,
            e.Event_Title,
            COUNT(DISTINCT pe.Project_ID) as Project_Count
        FROM Project_Events pe
        INNER JOIN Events e ON pe.Event_ID = e.Event_ID
        GROUP BY pe.Event_ID, e.Event_Title
        HAVING COUNT(DISTINCT pe.Project_ID) > 1

        PRINT ''
        PRINT '  Note: Only the last project relationship will be preserved in Events table.'
        PRINT '  Please review these events manually if needed.'
    END
END
ELSE
BEGIN
    PRINT '  ℹ Project_Events table does not exist, skipping data migration'
END

GO

-- ============================================================
-- STEP 3: Add foreign key constraint
-- ============================================================
PRINT ''
PRINT 'Adding foreign key constraint...'

IF NOT EXISTS (
    SELECT * FROM sys.foreign_keys
    WHERE name = 'FK_Events_Projects'
    AND parent_object_id = OBJECT_ID('Events')
)
BEGIN
    ALTER TABLE Events
    ADD CONSTRAINT FK_Events_Projects
    FOREIGN KEY (Project_ID) REFERENCES Projects(Project_ID)
    PRINT '  ✓ Added FK_Events_Projects constraint'
END
ELSE
BEGIN
    PRINT '  ℹ FK_Events_Projects constraint already exists'
END

GO

-- ============================================================
-- STEP 4: Create index for performance
-- ============================================================
PRINT ''
PRINT 'Creating index for performance...'

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Events_Project_ID' AND object_id = OBJECT_ID('Events'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_Events_Project_ID
    ON Events(Project_ID)
    WHERE Project_ID IS NOT NULL
    PRINT '  ✓ Created index IX_Events_Project_ID'
END
ELSE
BEGIN
    PRINT '  ℹ Index IX_Events_Project_ID already exists'
END

GO

-- ============================================================
-- STEP 5: Show summary statistics
-- ============================================================
PRINT ''
PRINT 'Migration Summary:'
PRINT '=================='

DECLARE @totalEvents INT
DECLARE @eventsWithProject INT
DECLARE @eventsWithRSVP INT

SELECT @totalEvents = COUNT(*) FROM Events
SELECT @eventsWithProject = COUNT(*) FROM Events WHERE Project_ID IS NOT NULL
SELECT @eventsWithRSVP = COUNT(*) FROM Events WHERE Include_In_RSVP = 1

PRINT '  Total Events: ' + CAST(@totalEvents AS VARCHAR)
PRINT '  Events linked to Projects: ' + CAST(@eventsWithProject AS VARCHAR)
PRINT '  Events with RSVP enabled: ' + CAST(@eventsWithRSVP AS VARCHAR)

-- ============================================================
-- STEP 6: Drop Project_Events table (commented out for safety)
-- ============================================================
PRINT ''
PRINT 'Project_Events table cleanup:'
PRINT '=============================='
PRINT '  ⚠ Project_Events table has NOT been dropped for safety.'
PRINT '  Once you have verified the migration is successful, you can manually drop it with:'
PRINT '  DROP TABLE Project_Events'
PRINT ''
PRINT '  Or uncomment the DROP TABLE statement at the end of this script.'

-- Uncomment the following lines after verifying the migration
/*
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'Project_Events')
BEGIN
    DROP TABLE Project_Events
    PRINT '  ✓ Dropped Project_Events table'
END
*/

PRINT ''
PRINT '✓ Migration completed successfully!'
