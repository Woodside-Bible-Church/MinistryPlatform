-- ===================================================================
-- Table: Project_Campuses
-- ===================================================================
-- Links RSVP Projects to Campuses with optional public-facing events
-- for campus-specific content (meeting instructions, etc.)
-- ===================================================================

USE [MinistryPlatform]
GO

-- Drop table if it exists (for development/testing)
-- IF OBJECT_ID('dbo.Project_Campuses', 'U') IS NOT NULL
--     DROP TABLE dbo.Project_Campuses;
-- GO

CREATE TABLE dbo.Project_Campuses (
    Project_Campus_ID INT PRIMARY KEY IDENTITY(1,1),
    Project_ID INT NOT NULL,
    Congregation_ID INT NOT NULL,
    Public_Event_ID INT NULL,  -- Optional: Public-facing event with campus-specific content
    Is_Active BIT NOT NULL DEFAULT 1,
    Display_Order INT NULL,
    Domain_ID INT NOT NULL DEFAULT 1,

    CONSTRAINT FK_Project_Campuses_Projects
        FOREIGN KEY (Project_ID) REFERENCES dbo.Projects(Project_ID),
    CONSTRAINT FK_Project_Campuses_Congregations
        FOREIGN KEY (Congregation_ID) REFERENCES dbo.Congregations(Congregation_ID),
    CONSTRAINT FK_Project_Campuses_Events
        FOREIGN KEY (Public_Event_ID) REFERENCES dbo.Events(Event_ID),
    CONSTRAINT FK_Project_Campuses_Domains
        FOREIGN KEY (Domain_ID) REFERENCES dbo.dp_Domains(Domain_ID),
    CONSTRAINT UQ_Project_Campuses_Project_Congregation
        UNIQUE (Project_ID, Congregation_ID)
);
GO

-- Create indexes for performance
CREATE INDEX IX_Project_Campuses_Project_ID
    ON dbo.Project_Campuses(Project_ID);

CREATE INDEX IX_Project_Campuses_Congregation_ID
    ON dbo.Project_Campuses(Congregation_ID);

CREATE INDEX IX_Project_Campuses_Public_Event_ID
    ON dbo.Project_Campuses(Public_Event_ID)
    WHERE Public_Event_ID IS NOT NULL;
GO

PRINT 'Created table: Project_Campuses';
PRINT 'NOTE: This table will be automatically audit logged by MinistryPlatform';
PRINT '';
PRINT 'Next steps:';
PRINT '1. Add this table to MinistryPlatform Admin → Tables';
PRINT '2. Configure audit logging (should be automatic)';
PRINT '3. Grant appropriate permissions to API user';
PRINT '4. Create a sub-page for Projects to display/manage campus associations';
