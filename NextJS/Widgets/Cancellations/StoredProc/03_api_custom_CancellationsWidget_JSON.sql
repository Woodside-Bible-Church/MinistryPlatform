-- =============================================
-- Stored Procedure: api_custom_CancellationsWidget_JSON
-- Purpose: Returns cancellation data for the Cancellations Widget
-- =============================================

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

    -- =============================================
    -- Build Information object from Application Labels
    -- =============================================
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

    -- =============================================
    -- Get active cancellations with campus data
    -- =============================================
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
            -- Build Campus SVG URL from dp_files
            CASE
                WHEN F.File_ID IS NOT NULL AND CS.Value IS NOT NULL AND D.Domain_GUID IS NOT NULL
                THEN CONCAT(CS.Value, '?dn=', CONVERT(varchar(40), D.Domain_GUID), '&fn=', F.Unique_Name, '.', F.Extension)
                ELSE NULL
            END AS svgUrl,
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
        -- Join to dp_files to get Campus.svg file
        LEFT OUTER JOIN dp_files F ON F.Record_ID = c.Congregation_ID
            AND F.Table_Name = 'Congregations'
            AND F.File_Name = 'Campus.svg'
        -- Join to get ImageURL configuration setting
        LEFT OUTER JOIN dp_Configuration_Settings CS
            ON CS.Domain_ID = COALESCE(c.Domain_ID, 1)
            AND CS.Key_Name = 'ImageURL'
            AND CS.Application_Code = 'Common'
        -- Join to get Domain GUID
        LEFT OUTER JOIN dp_Domains D
            ON D.Domain_ID = COALESCE(c.Domain_ID, 1)
        WHERE c.Domain_ID = @DomainID
            AND c.End_Date IS NULL  -- Only active congregations
            AND (
                @CongregationID IS NULL
                OR c.Congregation_ID = @CongregationID
            )
            AND (
                @Campus IS NULL
                OR LOWER(REPLACE(REPLACE(c.Congregation_Name, ' ', '-'), '''', '')) = LOWER(@Campus)
            )
    )

    -- =============================================
    -- Build final JSON output (use JSON_QUERY to prevent double-encoding)
    -- =============================================
    SELECT (
        SELECT
            -- Information object
            JSON_QUERY((SELECT alertTitle, mainTitle, alertMessage, autoRefreshMessage, lastUpdatedPrefix, openStatusMessage, openStatusSubtext
             FROM @Information
             FOR JSON PATH, WITHOUT_ARRAY_WRAPPER)) AS Information,

            -- LastUpdated timestamp (max of all relevant timestamps)
            FORMAT(
                ISNULL(
                    (SELECT MAX(Update_Timestamp) FROM Congregation_Cancellation_Updates WHERE Domain_ID = @DomainID),
                    @Now
                ),
                'yyyy-MM-ddTHH:mm:ssZ'
            ) AS LastUpdated,

            -- Campuses array
            JSON_QUERY((
                SELECT
                    cd.id,
                    cd.name,
                    cd.slug,
                    cd.svgUrl,
                    cd.status,
                    cd.reason,
                    cd.expectedResumeTime,
                    -- Affected Services subarray
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
                    -- Updates subarray
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

-- =============================================
-- Register in dp_API_Procedures
-- =============================================
IF NOT EXISTS (SELECT 1 FROM dp_API_Procedures WHERE Procedure_Name = 'api_custom_CancellationsWidget_JSON')
BEGIN
    INSERT INTO dp_API_Procedures (Procedure_Name, Description)
    VALUES ('api_custom_CancellationsWidget_JSON', 'Returns cancellation status data for the Cancellations Widget including campus statuses, affected services, and updates.');
    PRINT 'Registered api_custom_CancellationsWidget_JSON in dp_API_Procedures';
END
GO

-- Grant permissions to Administrators (Role 2)
DECLARE @API_Procedure_ID INT;
SELECT @API_Procedure_ID = API_Procedure_ID FROM dp_API_Procedures WHERE Procedure_Name = 'api_custom_CancellationsWidget_JSON';

IF NOT EXISTS (SELECT 1 FROM dp_Role_API_Procedures WHERE Role_ID = 2 AND API_Procedure_ID = @API_Procedure_ID)
BEGIN
    INSERT INTO dp_Role_API_Procedures (Role_ID, API_Procedure_ID, Domain_ID)
    VALUES (2, @API_Procedure_ID, 1);
    PRINT 'Permission granted to Administrators (Role 2)';
END
GO

PRINT 'Created stored procedure api_custom_CancellationsWidget_JSON';
GO
