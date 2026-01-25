-- Fix double-encoded JSON in Information object
-- Wrap the nested JSON with JSON_QUERY() so it's treated as raw JSON

USE [MinistryPlatform]
GO

ALTER PROCEDURE [dbo].[api_custom_CancellationsWidget_JSON]
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

    -- Build final JSON output (use JSON_QUERY to prevent double-encoding)
    SELECT (
        SELECT
            JSON_QUERY((SELECT alertTitle, mainTitle, alertMessage, autoRefreshMessage, lastUpdatedPrefix, openStatusMessage, openStatusSubtext
             FROM @Information
             FOR JSON PATH, WITHOUT_ARRAY_WRAPPER)) AS Information,

            FORMAT(
                ISNULL(
                    (SELECT MAX(Update_Timestamp) FROM Congregation_Cancellation_Updates WHERE Domain_ID = @DomainID),
                    @Now
                ),
                'yyyy-MM-ddTHH:mm:ssZ'
            ) AS LastUpdated,

            JSON_QUERY((
                SELECT
                    cd.id,
                    cd.name,
                    cd.slug,
                    cd.status,
                    cd.reason,
                    cd.expectedResumeTime,
                    JSON_QUERY((
                        SELECT
                            ccs.Service_Name AS name,
                            ccs.Service_Status AS status,
                            ccs.Details AS details
                        FROM Congregation_Cancellation_Services ccs
                        WHERE ccs.Congregation_Cancellation_ID = cd.Congregation_Cancellation_ID
                        ORDER BY ccs.Sort_Order, ccs.Service_Name
                        FOR JSON PATH
                    )) AS affectedServices,
                    JSON_QUERY((
                        SELECT
                            FORMAT(ccu.Update_Timestamp, 'MMM d, h:mm tt') AS timestamp,
                            ccu.Update_Message AS message
                        FROM Congregation_Cancellation_Updates ccu
                        WHERE ccu.Congregation_Cancellation_ID = cd.Congregation_Cancellation_ID
                        ORDER BY ccu.Update_Timestamp DESC
                        FOR JSON PATH
                    )) AS updates
                FROM CampusData cd
                ORDER BY cd.name
                FOR JSON PATH
            )) AS Campuses
        FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
    ) AS JsonResult;
END
GO

PRINT 'Stored procedure updated.'

-- Test it
EXEC api_custom_CancellationsWidget_JSON @DomainID = 1;
GO
