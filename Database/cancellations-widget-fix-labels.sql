-- =============================================
-- Cancellations Widget - Fix Application Labels & Stored Procedure
-- =============================================

USE [MinistryPlatform]
GO

-- =============================================
-- PART 1: Insert Application Labels (using English column)
-- =============================================

PRINT '--- Inserting Application Labels ---'

-- Delete existing labels (for re-running)
DELETE FROM dp_Application_Labels
WHERE Label_Name LIKE 'customWidgets.cancellationsWidget.%'
AND Domain_ID = 1;

-- Insert labels using correct column name (API_Client_ID = 16 for TM.Widgets)
INSERT INTO dp_Application_Labels (Label_Name, English, Domain_ID, API_Client_ID)
VALUES
    ('customWidgets.cancellationsWidget.alertTitle', 'Weather Advisory', 1, 16),
    ('customWidgets.cancellationsWidget.mainTitle', 'Cancellations', 1, 16),
    ('customWidgets.cancellationsWidget.alertMessage', 'Due to hazardous conditions, several church activities have been affected. Please check your campus status below before traveling.', 1, 16),
    ('customWidgets.cancellationsWidget.autoRefreshMessage', 'This page refreshes automatically. Check back for the latest updates.', 1, 16),
    ('customWidgets.cancellationsWidget.lastUpdatedPrefix', 'Last updated:', 1, 16),
    ('customWidgets.cancellationsWidget.openStatusMessage', 'All activities are proceeding as scheduled', 1, 16),
    ('customWidgets.cancellationsWidget.openStatusSubtext', 'No cancellations or modifications at this time', 1, 16);

PRINT 'Inserted 7 Application Labels.'
GO

-- =============================================
-- PART 2: Recreate Stored Procedure (using English column)
-- =============================================

PRINT '--- Recreating Stored Procedure ---'

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
        (SELECT ISNULL(English, 'Weather Advisory') FROM dp_Application_Labels WHERE Label_Name = 'customWidgets.cancellationsWidget.alertTitle' AND Domain_ID = @DomainID),
        (SELECT ISNULL(English, 'Cancellations') FROM dp_Application_Labels WHERE Label_Name = 'customWidgets.cancellationsWidget.mainTitle' AND Domain_ID = @DomainID),
        (SELECT ISNULL(English, 'Due to hazardous conditions, several church activities have been affected. Please check your campus status below before traveling.') FROM dp_Application_Labels WHERE Label_Name = 'customWidgets.cancellationsWidget.alertMessage' AND Domain_ID = @DomainID),
        (SELECT ISNULL(English, 'This page refreshes automatically. Check back for the latest updates.') FROM dp_Application_Labels WHERE Label_Name = 'customWidgets.cancellationsWidget.autoRefreshMessage' AND Domain_ID = @DomainID),
        (SELECT ISNULL(English, 'Last updated:') FROM dp_Application_Labels WHERE Label_Name = 'customWidgets.cancellationsWidget.lastUpdatedPrefix' AND Domain_ID = @DomainID),
        (SELECT ISNULL(English, 'All activities are proceeding as scheduled') FROM dp_Application_Labels WHERE Label_Name = 'customWidgets.cancellationsWidget.openStatusMessage' AND Domain_ID = @DomainID),
        (SELECT ISNULL(English, 'No cancellations or modifications at this time') FROM dp_Application_Labels WHERE Label_Name = 'customWidgets.cancellationsWidget.openStatusSubtext' AND Domain_ID = @DomainID);

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

PRINT 'Stored procedure recreated successfully.'
PRINT ''

-- =============================================
-- VERIFICATION
-- =============================================

PRINT '--- Verification ---'

SELECT Label_Name, English
FROM dp_Application_Labels
WHERE Label_Name LIKE 'customWidgets.cancellationsWidget.%'
ORDER BY Label_Name;

PRINT ''
PRINT 'Testing stored procedure...'
EXEC api_custom_CancellationsWidget_JSON @DomainID = 1;

PRINT ''
PRINT 'Fix complete!'
GO
