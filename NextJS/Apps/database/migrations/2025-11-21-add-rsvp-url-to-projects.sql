-- Add RSVP_URL field to Projects table
-- This will store the base URL for the RSVP page (e.g., woodsidebible.org/christmas)

-- Check if column already exists
IF NOT EXISTS (
    SELECT 1
    FROM sys.columns
    WHERE object_id = OBJECT_ID('dbo.Projects')
    AND name = 'RSVP_URL'
)
BEGIN
    ALTER TABLE dbo.Projects
    ADD RSVP_URL NVARCHAR(500) NULL;

    PRINT 'Successfully added RSVP_URL column to Projects table';
END
ELSE
BEGIN
    PRINT 'RSVP_URL column already exists in Projects table';
END
GO

-- Example usage:
-- UPDATE Projects SET RSVP_URL = 'woodsidebible.org/christmas' WHERE Project_ID = 5;
