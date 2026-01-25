-- =============================================
-- Cancellations Widget - Complete Database Setup
-- Date: 2026-01-25
-- Description: Creates tables, registers pages, and API procedure
-- =============================================

USE [MinistryPlatform]
GO

PRINT '============================================='
PRINT 'CANCELLATIONS WIDGET - DATABASE SETUP'
PRINT '============================================='
PRINT ''

-- =============================================
-- PART 1: CREATE TABLES
-- =============================================

PRINT '--- PART 1: Creating Tables ---'
PRINT ''

-- 1a. Lookup Table: __CancellationStatuses
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = '__CancellationStatuses')
BEGIN
    PRINT 'Creating table __CancellationStatuses...'
    CREATE TABLE [dbo].[__CancellationStatuses] (
        [Cancellation_Status_ID] INT IDENTITY(1,1) NOT NULL,
        [Status_Name] NVARCHAR(50) NOT NULL,
        [Domain_ID] INT NOT NULL CONSTRAINT [DF___CancellationStatuses_Domain_ID] DEFAULT (1),
        CONSTRAINT [PK___CancellationStatuses] PRIMARY KEY CLUSTERED ([Cancellation_Status_ID] ASC),
        CONSTRAINT [FK___CancellationStatuses_dp_Domains] FOREIGN KEY ([Domain_ID]) REFERENCES [dbo].[dp_Domains] ([Domain_ID])
    );

    -- Seed data
    INSERT INTO [dbo].[__CancellationStatuses] ([Status_Name], [Domain_ID])
    VALUES
        ('Open', 1),
        ('Modified', 1),
        ('Closed', 1);

    PRINT 'Created __CancellationStatuses with seed data.'
END
ELSE
BEGIN
    PRINT '__CancellationStatuses already exists.'
END
GO

-- 1b. Main Table: Congregation_Cancellations
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Congregation_Cancellations')
BEGIN
    PRINT 'Creating table Congregation_Cancellations...'
    CREATE TABLE [dbo].[Congregation_Cancellations] (
        [Congregation_Cancellation_ID] INT IDENTITY(1,1) NOT NULL,
        [Congregation_ID] INT NOT NULL,
        [Cancellation_Status_ID] INT NOT NULL,
        [Reason] NVARCHAR(500) NULL,
        [Expected_Resume_Time] NVARCHAR(200) NULL,
        [Start_Date] DATETIME NOT NULL,
        [End_Date] DATETIME NULL,
        [Domain_ID] INT NOT NULL CONSTRAINT [DF_Congregation_Cancellations_Domain_ID] DEFAULT (1),
        CONSTRAINT [PK_Congregation_Cancellations] PRIMARY KEY CLUSTERED ([Congregation_Cancellation_ID] ASC),
        CONSTRAINT [FK_Congregation_Cancellations_Congregations] FOREIGN KEY ([Congregation_ID]) REFERENCES [dbo].[Congregations] ([Congregation_ID]),
        CONSTRAINT [FK_Congregation_Cancellations_CancellationStatuses] FOREIGN KEY ([Cancellation_Status_ID]) REFERENCES [dbo].[__CancellationStatuses] ([Cancellation_Status_ID]),
        CONSTRAINT [FK_Congregation_Cancellations_dp_Domains] FOREIGN KEY ([Domain_ID]) REFERENCES [dbo].[dp_Domains] ([Domain_ID])
    );

    CREATE NONCLUSTERED INDEX [IX_Congregation_Cancellations_Active]
    ON [dbo].[Congregation_Cancellations] ([Congregation_ID], [Start_Date], [End_Date])
    INCLUDE ([Cancellation_Status_ID], [Reason], [Expected_Resume_Time]);

    PRINT 'Created Congregation_Cancellations.'
END
ELSE
BEGIN
    PRINT 'Congregation_Cancellations already exists.'
END
GO

-- 1c. Child Table: Congregation_Cancellation_Services
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Congregation_Cancellation_Services')
BEGIN
    PRINT 'Creating table Congregation_Cancellation_Services...'
    CREATE TABLE [dbo].[Congregation_Cancellation_Services] (
        [Congregation_Cancellation_Service_ID] INT IDENTITY(1,1) NOT NULL,
        [Congregation_Cancellation_ID] INT NOT NULL,
        [Service_Name] NVARCHAR(200) NOT NULL,
        [Service_Status] NVARCHAR(50) NOT NULL,
        [Details] NVARCHAR(500) NULL,
        [Sort_Order] INT NOT NULL CONSTRAINT [DF_Congregation_Cancellation_Services_Sort_Order] DEFAULT (0),
        [Domain_ID] INT NOT NULL CONSTRAINT [DF_Congregation_Cancellation_Services_Domain_ID] DEFAULT (1),
        CONSTRAINT [PK_Congregation_Cancellation_Services] PRIMARY KEY CLUSTERED ([Congregation_Cancellation_Service_ID] ASC),
        CONSTRAINT [FK_Congregation_Cancellation_Services_Congregation_Cancellations] FOREIGN KEY ([Congregation_Cancellation_ID]) REFERENCES [dbo].[Congregation_Cancellations] ([Congregation_Cancellation_ID]) ON DELETE CASCADE,
        CONSTRAINT [FK_Congregation_Cancellation_Services_dp_Domains] FOREIGN KEY ([Domain_ID]) REFERENCES [dbo].[dp_Domains] ([Domain_ID]),
        CONSTRAINT [CK_Congregation_Cancellation_Services_Status] CHECK ([Service_Status] IN ('cancelled', 'modified', 'delayed'))
    );

    PRINT 'Created Congregation_Cancellation_Services.'
END
ELSE
BEGIN
    PRINT 'Congregation_Cancellation_Services already exists.'
END
GO

-- 1d. Child Table: Congregation_Cancellation_Updates
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Congregation_Cancellation_Updates')
BEGIN
    PRINT 'Creating table Congregation_Cancellation_Updates...'
    CREATE TABLE [dbo].[Congregation_Cancellation_Updates] (
        [Congregation_Cancellation_Update_ID] INT IDENTITY(1,1) NOT NULL,
        [Congregation_Cancellation_ID] INT NOT NULL,
        [Update_Message] NVARCHAR(1000) NOT NULL,
        [Update_Timestamp] DATETIME NOT NULL CONSTRAINT [DF_Congregation_Cancellation_Updates_Timestamp] DEFAULT (GETDATE()),
        [Domain_ID] INT NOT NULL CONSTRAINT [DF_Congregation_Cancellation_Updates_Domain_ID] DEFAULT (1),
        CONSTRAINT [PK_Congregation_Cancellation_Updates] PRIMARY KEY CLUSTERED ([Congregation_Cancellation_Update_ID] ASC),
        CONSTRAINT [FK_Congregation_Cancellation_Updates_Congregation_Cancellations] FOREIGN KEY ([Congregation_Cancellation_ID]) REFERENCES [dbo].[Congregation_Cancellations] ([Congregation_Cancellation_ID]) ON DELETE CASCADE,
        CONSTRAINT [FK_Congregation_Cancellation_Updates_dp_Domains] FOREIGN KEY ([Domain_ID]) REFERENCES [dbo].[dp_Domains] ([Domain_ID])
    );

    CREATE NONCLUSTERED INDEX [IX_Congregation_Cancellation_Updates_Timestamp]
    ON [dbo].[Congregation_Cancellation_Updates] ([Congregation_Cancellation_ID], [Update_Timestamp] DESC);

    PRINT 'Created Congregation_Cancellation_Updates.'
END
ELSE
BEGIN
    PRINT 'Congregation_Cancellation_Updates already exists.'
END
GO

PRINT ''

-- =============================================
-- PART 2: REGISTER TABLES IN dp_Pages
-- =============================================

PRINT '--- PART 2: Registering Tables in dp_Pages ---'
PRINT ''

-- 2a. Register __CancellationStatuses
IF NOT EXISTS (SELECT 1 FROM dp_Pages WHERE Table_Name = '__CancellationStatuses')
BEGIN
    PRINT 'Registering __CancellationStatuses in dp_Pages...'
    INSERT INTO dp_Pages (
        Display_Name,
        Singular_Name,
        View_Order,
        Table_Name,
        Primary_Key,
        Default_Field_List,
        Selected_Record_Expression,
        Suppress_New_Button,
        Display_Copy
    ) VALUES (
        'Cancellation Statuses',
        'Cancellation Status',
        710,
        '__CancellationStatuses',
        'Cancellation_Status_ID',
        '__CancellationStatuses.Status_Name',
        '__CancellationStatuses.Status_Name',
        0,
        1
    );
    PRINT 'Registered __CancellationStatuses.'
END
ELSE
BEGIN
    PRINT '__CancellationStatuses already registered.'
END

-- Grant Administrator permissions for __CancellationStatuses
DECLARE @StatusPageID INT;
SELECT @StatusPageID = Page_ID FROM dp_Pages WHERE Table_Name = '__CancellationStatuses';

IF @StatusPageID IS NOT NULL AND NOT EXISTS (SELECT 1 FROM dp_Role_Pages WHERE Role_ID = 2 AND Page_ID = @StatusPageID)
BEGIN
    INSERT INTO dp_Role_Pages (Role_ID, Page_ID, Access_Level, Scope_All, Approver, File_Attacher, Data_Importer, Data_Exporter, Secure_Records, Allow_Comments, Quick_Add)
    VALUES (2, @StatusPageID, 3, 0, 0, 1, 0, 1, 0, 0, 0);
    PRINT 'Administrator permissions granted for __CancellationStatuses.'
END
GO

-- 2b. Register Congregation_Cancellations
IF NOT EXISTS (SELECT 1 FROM dp_Pages WHERE Table_Name = 'Congregation_Cancellations')
BEGIN
    PRINT 'Registering Congregation_Cancellations in dp_Pages...'
    INSERT INTO dp_Pages (
        Display_Name,
        Singular_Name,
        View_Order,
        Table_Name,
        Primary_Key,
        Default_Field_List,
        Selected_Record_Expression,
        Suppress_New_Button,
        Display_Copy
    ) VALUES (
        'Congregation Cancellations',
        'Congregation Cancellation',
        505,
        'Congregation_Cancellations',
        'Congregation_Cancellation_ID',
        'Congregation_ID_Table.Congregation_Name, Cancellation_Status_ID_Table.Status_Name, Congregation_Cancellations.Reason, Congregation_Cancellations.Expected_Resume_Time, Congregation_Cancellations.Start_Date, Congregation_Cancellations.End_Date',
        'Congregation_ID_Table.Congregation_Name',
        0,
        1
    );
    PRINT 'Registered Congregation_Cancellations.'
END
ELSE
BEGIN
    PRINT 'Congregation_Cancellations already registered.'
END

-- Grant Administrator permissions for Congregation_Cancellations
DECLARE @CancellationsPageID INT;
SELECT @CancellationsPageID = Page_ID FROM dp_Pages WHERE Table_Name = 'Congregation_Cancellations';

IF @CancellationsPageID IS NOT NULL AND NOT EXISTS (SELECT 1 FROM dp_Role_Pages WHERE Role_ID = 2 AND Page_ID = @CancellationsPageID)
BEGIN
    INSERT INTO dp_Role_Pages (Role_ID, Page_ID, Access_Level, Scope_All, Approver, File_Attacher, Data_Importer, Data_Exporter, Secure_Records, Allow_Comments, Quick_Add)
    VALUES (2, @CancellationsPageID, 3, 0, 0, 1, 0, 1, 0, 0, 0);
    PRINT 'Administrator permissions granted for Congregation_Cancellations.'
END
GO

-- 2c. Register Congregation_Cancellation_Services
IF NOT EXISTS (SELECT 1 FROM dp_Pages WHERE Table_Name = 'Congregation_Cancellation_Services')
BEGIN
    PRINT 'Registering Congregation_Cancellation_Services in dp_Pages...'
    INSERT INTO dp_Pages (
        Display_Name,
        Singular_Name,
        View_Order,
        Table_Name,
        Primary_Key,
        Default_Field_List,
        Selected_Record_Expression,
        Suppress_New_Button,
        Display_Copy
    ) VALUES (
        'Cancellation Services',
        'Cancellation Service',
        506,
        'Congregation_Cancellation_Services',
        'Congregation_Cancellation_Service_ID',
        'Congregation_Cancellation_Services.Service_Name, Congregation_Cancellation_Services.Service_Status, Congregation_Cancellation_Services.Details, Congregation_Cancellation_Services.Sort_Order',
        'Congregation_Cancellation_Services.Service_Name',
        0,
        1
    );
    PRINT 'Registered Congregation_Cancellation_Services.'
END
ELSE
BEGIN
    PRINT 'Congregation_Cancellation_Services already registered.'
END

-- Grant Administrator permissions
DECLARE @ServicesPageID INT;
SELECT @ServicesPageID = Page_ID FROM dp_Pages WHERE Table_Name = 'Congregation_Cancellation_Services';

IF @ServicesPageID IS NOT NULL AND NOT EXISTS (SELECT 1 FROM dp_Role_Pages WHERE Role_ID = 2 AND Page_ID = @ServicesPageID)
BEGIN
    INSERT INTO dp_Role_Pages (Role_ID, Page_ID, Access_Level, Scope_All, Approver, File_Attacher, Data_Importer, Data_Exporter, Secure_Records, Allow_Comments, Quick_Add)
    VALUES (2, @ServicesPageID, 3, 0, 0, 1, 0, 1, 0, 0, 0);
    PRINT 'Administrator permissions granted for Congregation_Cancellation_Services.'
END
GO

-- 2d. Register Congregation_Cancellation_Updates
IF NOT EXISTS (SELECT 1 FROM dp_Pages WHERE Table_Name = 'Congregation_Cancellation_Updates')
BEGIN
    PRINT 'Registering Congregation_Cancellation_Updates in dp_Pages...'
    INSERT INTO dp_Pages (
        Display_Name,
        Singular_Name,
        View_Order,
        Table_Name,
        Primary_Key,
        Default_Field_List,
        Selected_Record_Expression,
        Suppress_New_Button,
        Display_Copy
    ) VALUES (
        'Cancellation Updates',
        'Cancellation Update',
        507,
        'Congregation_Cancellation_Updates',
        'Congregation_Cancellation_Update_ID',
        'Congregation_Cancellation_Updates.Update_Timestamp, Congregation_Cancellation_Updates.Update_Message',
        'Congregation_Cancellation_Updates.Update_Message',
        0,
        1
    );
    PRINT 'Registered Congregation_Cancellation_Updates.'
END
ELSE
BEGIN
    PRINT 'Congregation_Cancellation_Updates already registered.'
END

-- Grant Administrator permissions
DECLARE @UpdatesPageID INT;
SELECT @UpdatesPageID = Page_ID FROM dp_Pages WHERE Table_Name = 'Congregation_Cancellation_Updates';

IF @UpdatesPageID IS NOT NULL AND NOT EXISTS (SELECT 1 FROM dp_Role_Pages WHERE Role_ID = 2 AND Page_ID = @UpdatesPageID)
BEGIN
    INSERT INTO dp_Role_Pages (Role_ID, Page_ID, Access_Level, Scope_All, Approver, File_Attacher, Data_Importer, Data_Exporter, Secure_Records, Allow_Comments, Quick_Add)
    VALUES (2, @UpdatesPageID, 3, 0, 0, 1, 0, 1, 0, 0, 0);
    PRINT 'Administrator permissions granted for Congregation_Cancellation_Updates.'
END
GO

PRINT ''

-- =============================================
-- PART 3: APPLICATION LABELS
-- =============================================

PRINT '--- PART 3: Application Labels ---'
PRINT ''

-- Delete existing labels (for re-running)
DELETE FROM dp_Application_Labels
WHERE Label_Name LIKE 'customWidgets.cancellationsWidget.%'
AND Domain_ID = 1;

-- Insert labels
INSERT INTO dp_Application_Labels (Label_Name, Default_Value, Domain_ID)
VALUES
    ('customWidgets.cancellationsWidget.alertTitle', 'Weather Advisory', 1),
    ('customWidgets.cancellationsWidget.mainTitle', 'Cancellations', 1),
    ('customWidgets.cancellationsWidget.alertMessage', 'Due to hazardous conditions, several church activities have been affected. Please check your campus status below before traveling.', 1),
    ('customWidgets.cancellationsWidget.autoRefreshMessage', 'This page refreshes automatically. Check back for the latest updates.', 1),
    ('customWidgets.cancellationsWidget.lastUpdatedPrefix', 'Last updated:', 1),
    ('customWidgets.cancellationsWidget.openStatusMessage', 'All activities are proceeding as scheduled', 1),
    ('customWidgets.cancellationsWidget.openStatusSubtext', 'No cancellations or modifications at this time', 1);

PRINT 'Inserted 7 Application Labels.'
GO

PRINT ''

-- =============================================
-- PART 4: CREATE STORED PROCEDURE
-- =============================================

PRINT '--- PART 4: Creating Stored Procedure ---'
PRINT ''

IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'api_custom_CancellationsWidget_JSON')
    DROP PROCEDURE [dbo].[api_custom_CancellationsWidget_JSON];
GO

CREATE PROCEDURE [dbo].[api_custom_CancellationsWidget_JSON]
    @CongregationID INT = NULL,
    @Campus NVARCHAR(100) = NULL,
    @DomainID INT = 1,
    @UserName NVARCHAR(75) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @Now DATETIME = GETDATE();

    -- Build Information object from Application Labels
    DECLARE @Information TABLE (
        alertTitle NVARCHAR(500),
        mainTitle NVARCHAR(500),
        alertMessage NVARCHAR(1000),
        autoRefreshMessage NVARCHAR(500),
        lastUpdatedPrefix NVARCHAR(100),
        openStatusMessage NVARCHAR(500),
        openStatusSubtext NVARCHAR(500)
    );

    INSERT INTO @Information
    SELECT
        (SELECT ISNULL(Default_Value, 'Weather Advisory') FROM dp_Application_Labels WHERE Label_Name = 'customWidgets.cancellationsWidget.alertTitle' AND Domain_ID = @DomainID),
        (SELECT ISNULL(Default_Value, 'Cancellations') FROM dp_Application_Labels WHERE Label_Name = 'customWidgets.cancellationsWidget.mainTitle' AND Domain_ID = @DomainID),
        (SELECT ISNULL(Default_Value, 'Due to hazardous conditions, several church activities have been affected. Please check your campus status below before traveling.') FROM dp_Application_Labels WHERE Label_Name = 'customWidgets.cancellationsWidget.alertMessage' AND Domain_ID = @DomainID),
        (SELECT ISNULL(Default_Value, 'This page refreshes automatically. Check back for the latest updates.') FROM dp_Application_Labels WHERE Label_Name = 'customWidgets.cancellationsWidget.autoRefreshMessage' AND Domain_ID = @DomainID),
        (SELECT ISNULL(Default_Value, 'Last updated:') FROM dp_Application_Labels WHERE Label_Name = 'customWidgets.cancellationsWidget.lastUpdatedPrefix' AND Domain_ID = @DomainID),
        (SELECT ISNULL(Default_Value, 'All activities are proceeding as scheduled') FROM dp_Application_Labels WHERE Label_Name = 'customWidgets.cancellationsWidget.openStatusMessage' AND Domain_ID = @DomainID),
        (SELECT ISNULL(Default_Value, 'No cancellations or modifications at this time') FROM dp_Application_Labels WHERE Label_Name = 'customWidgets.cancellationsWidget.openStatusSubtext' AND Domain_ID = @DomainID);

    -- Get active cancellations with campus data
    ;WITH ActiveCancellations AS (
        SELECT
            cc.Congregation_Cancellation_ID,
            cc.Congregation_ID,
            cc.Cancellation_Status_ID,
            cs.Status_Name,
            cc.Reason,
            cc.Expected_Resume_Time,
            cc.Start_Date,
            cc.End_Date
        FROM Congregation_Cancellations cc
        INNER JOIN __CancellationStatuses cs ON cc.Cancellation_Status_ID = cs.Cancellation_Status_ID
        WHERE cc.Domain_ID = @DomainID
            AND cc.Start_Date <= @Now
            AND (cc.End_Date IS NULL OR cc.End_Date > @Now)
    ),
    CampusData AS (
        SELECT
            c.Congregation_ID AS id,
            c.Congregation_Name AS name,
            LOWER(REPLACE(REPLACE(c.Congregation_Name, ' ', '-'), '''', '')) AS slug,
            CASE
                WHEN ac.Status_Name IS NULL THEN 'open'
                WHEN ac.Status_Name = 'Open' THEN 'open'
                WHEN ac.Status_Name = 'Modified' THEN 'modified'
                WHEN ac.Status_Name = 'Closed' THEN 'closed'
            END AS status,
            ac.Reason AS reason,
            ac.Expected_Resume_Time AS expectedResumeTime,
            ac.Congregation_Cancellation_ID
        FROM Congregations c
        LEFT JOIN ActiveCancellations ac ON c.Congregation_ID = ac.Congregation_ID
        WHERE c.Domain_ID = @DomainID
            AND c.End_Date IS NULL
            AND (
                @CongregationID IS NULL
                OR c.Congregation_ID = @CongregationID
            )
            AND (
                @Campus IS NULL
                OR LOWER(REPLACE(REPLACE(c.Congregation_Name, ' ', '-'), '''', '')) = LOWER(@Campus)
            )
    )

    -- Build final JSON output
    SELECT (
        SELECT
            (SELECT alertTitle, mainTitle, alertMessage, autoRefreshMessage, lastUpdatedPrefix, openStatusMessage, openStatusSubtext
             FROM @Information
             FOR JSON PATH, WITHOUT_ARRAY_WRAPPER) AS Information,

            FORMAT(
                ISNULL(
                    (SELECT MAX(Update_Timestamp) FROM Congregation_Cancellation_Updates WHERE Domain_ID = @DomainID),
                    @Now
                ),
                'yyyy-MM-ddTHH:mm:ssZ'
            ) AS LastUpdated,

            (
                SELECT
                    cd.id,
                    cd.name,
                    cd.slug,
                    cd.status,
                    cd.reason,
                    cd.expectedResumeTime,
                    (
                        SELECT
                            ccs.Service_Name AS name,
                            ccs.Service_Status AS status,
                            ccs.Details AS details
                        FROM Congregation_Cancellation_Services ccs
                        WHERE ccs.Congregation_Cancellation_ID = cd.Congregation_Cancellation_ID
                        ORDER BY ccs.Sort_Order, ccs.Service_Name
                        FOR JSON PATH
                    ) AS affectedServices,
                    (
                        SELECT
                            FORMAT(ccu.Update_Timestamp, 'MMM d, h:mm tt') AS timestamp,
                            ccu.Update_Message AS message
                        FROM Congregation_Cancellation_Updates ccu
                        WHERE ccu.Congregation_Cancellation_ID = cd.Congregation_Cancellation_ID
                        ORDER BY ccu.Update_Timestamp DESC
                        FOR JSON PATH
                    ) AS updates
                FROM CampusData cd
                ORDER BY cd.name
                FOR JSON PATH
            ) AS Campuses
        FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
    ) AS JsonResult;
END
GO

PRINT 'Created stored procedure api_custom_CancellationsWidget_JSON.'
PRINT ''

-- =============================================
-- PART 5: REGISTER API PROCEDURE
-- =============================================

PRINT '--- PART 5: Registering API Procedure ---'
PRINT ''

IF NOT EXISTS (SELECT 1 FROM dp_API_Procedures WHERE Procedure_Name = 'api_custom_CancellationsWidget_JSON')
BEGIN
    INSERT INTO dp_API_Procedures (Procedure_Name, Description)
    VALUES ('api_custom_CancellationsWidget_JSON', 'Returns cancellation status data for the Cancellations Widget including campus statuses, affected services, and updates.');
    PRINT 'API Procedure registered successfully.'
END
ELSE
BEGIN
    PRINT 'API Procedure already exists.'
END
GO

-- Grant permissions to Administrators
DECLARE @API_Procedure_ID INT;
SELECT @API_Procedure_ID = API_Procedure_ID FROM dp_API_Procedures WHERE Procedure_Name = 'api_custom_CancellationsWidget_JSON';

IF NOT EXISTS (SELECT 1 FROM dp_Role_API_Procedures WHERE Role_ID = 2 AND API_Procedure_ID = @API_Procedure_ID)
BEGIN
    INSERT INTO dp_Role_API_Procedures (Role_ID, API_Procedure_ID, Domain_ID)
    VALUES (2, @API_Procedure_ID, 1);
    PRINT 'Permission granted to Administrators (Role 2).'
END
ELSE
BEGIN
    PRINT 'Permission already exists for Administrators.'
END
GO

PRINT ''

-- =============================================
-- VERIFICATION
-- =============================================

PRINT '============================================='
PRINT 'VERIFICATION'
PRINT '============================================='
PRINT ''

PRINT '--- Tables Created ---'
SELECT
    t.name AS Table_Name,
    COUNT(c.column_id) AS Column_Count
FROM sys.tables t
INNER JOIN sys.columns c ON t.object_id = c.object_id
WHERE t.name IN ('__CancellationStatuses', 'Congregation_Cancellations', 'Congregation_Cancellation_Services', 'Congregation_Cancellation_Updates')
GROUP BY t.name
ORDER BY t.name;

PRINT ''
PRINT '--- Pages Registered ---'
SELECT
    p.Page_ID,
    p.Display_Name,
    p.Table_Name,
    rp.Access_Level,
    r.Role_Name
FROM dp_Pages p
LEFT JOIN dp_Role_Pages rp ON p.Page_ID = rp.Page_ID
LEFT JOIN dp_Roles r ON rp.Role_ID = r.Role_ID
WHERE p.Table_Name IN ('__CancellationStatuses', 'Congregation_Cancellations', 'Congregation_Cancellation_Services', 'Congregation_Cancellation_Updates');

PRINT ''
PRINT '--- API Procedure Registered ---'
SELECT
    ap.Procedure_Name,
    ap.Description,
    r.Role_Name,
    rap.Role_API_Procedure_ID
FROM dp_API_Procedures ap
LEFT JOIN dp_Role_API_Procedures rap ON ap.API_Procedure_ID = rap.API_Procedure_ID
LEFT JOIN dp_Roles r ON rap.Role_ID = r.Role_ID
WHERE ap.Procedure_Name = 'api_custom_CancellationsWidget_JSON';

PRINT ''
PRINT '--- Application Labels ---'
SELECT Label_Name, Default_Value
FROM dp_Application_Labels
WHERE Label_Name LIKE 'customWidgets.cancellationsWidget.%'
ORDER BY Label_Name;

PRINT ''
PRINT '============================================='
PRINT 'SETUP COMPLETE!'
PRINT '============================================='
PRINT ''
PRINT 'API Endpoint: https://my.woodsidebible.org/ministryplatformapi/procs/api_custom_CancellationsWidget_JSON'
PRINT ''
PRINT 'Tables accessible at:'
PRINT '  https://my.woodsidebible.org/ministryplatformapi/tables/__CancellationStatuses'
PRINT '  https://my.woodsidebible.org/ministryplatformapi/tables/Congregation_Cancellations'
PRINT '  https://my.woodsidebible.org/ministryplatformapi/tables/Congregation_Cancellation_Services'
PRINT '  https://my.woodsidebible.org/ministryplatformapi/tables/Congregation_Cancellation_Updates'
PRINT ''
GO
