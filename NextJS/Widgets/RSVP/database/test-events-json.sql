-- ===================================================================
-- Test: What is @EventsJson actually returning?
-- ===================================================================

USE [MinistryPlatform]
GO

DECLARE @Project_RSVP_ID INT = 1;
DECLARE @Congregation_ID INT = NULL;
DECLARE @EventsJson NVARCHAR(MAX);

-- Run the exact query from the stored procedure
SELECT @EventsJson = (
    SELECT
        e.Event_ID,
        e.Event_Title,
        e.Event_Start_Date,
        e.Event_End_Date,
        e.Event_Type_ID,
        e.Congregation_ID,
        ISNULL(c.Congregation_Name, '') AS Campus_Name,
        ISNULL(l.Location_Name, '') AS Campus_Location,
        ISNULL(e.Participants_Expected, 500) AS Capacity,
        (SELECT COUNT(*) FROM Event_RSVPs er WHERE er.Event_ID = e.Event_ID) AS Current_RSVPs,
        ISNULL(pe.RSVP_Capacity_Modifier, 0) AS RSVP_Capacity_Modifier,
        (SELECT COUNT(*) FROM Event_RSVPs er WHERE er.Event_ID = e.Event_ID) + ISNULL(pe.RSVP_Capacity_Modifier, 0) AS Adjusted_RSVP_Count,
        CASE
            WHEN ISNULL(e.Participants_Expected, 500) = 0 THEN 0
            ELSE CAST(
                ((SELECT COUNT(*) FROM Event_RSVPs er WHERE er.Event_ID = e.Event_ID) + ISNULL(pe.RSVP_Capacity_Modifier, 0)) * 100.0
                / ISNULL(e.Participants_Expected, 500) AS INT
            )
        END AS Capacity_Percentage,
        ISNULL(a.Address_Line_1, '') AS Campus_Address,
        ISNULL(a.City, '') AS Campus_City,
        ISNULL(a.[State/Region], '') AS Campus_State,
        ISNULL(a.Postal_Code, '') AS Campus_Zip
    FROM Project_Events pe
    INNER JOIN Events e ON pe.Event_ID = e.Event_ID
    LEFT JOIN Congregations c ON e.Congregation_ID = c.Congregation_ID
    LEFT JOIN Locations l ON c.Location_ID = l.Location_ID
    LEFT JOIN Addresses a ON l.Address_ID = a.Address_ID
    WHERE pe.Project_ID = (SELECT Project_ID FROM Project_RSVPs WHERE Project_RSVP_ID = @Project_RSVP_ID)
      AND pe.Include_In_RSVP = 1
      AND (@Congregation_ID IS NULL OR e.Congregation_ID = @Congregation_ID)
    ORDER BY e.Event_Start_Date ASC, c.Congregation_Name ASC
    FOR JSON PATH
);

PRINT 'EventsJson variable contents:';
PRINT '=================================================================';

-- Check if it's NULL
IF @EventsJson IS NULL
    PRINT 'EventsJson is NULL!'
ELSE
BEGIN
    PRINT 'EventsJson length: ' + CAST(LEN(@EventsJson) AS NVARCHAR);
    PRINT '';
    PRINT 'First 1000 characters:';
    PRINT SUBSTRING(@EventsJson, 1, 1000);
END

-- Now check what happens with the fallback
IF @EventsJson IS NULL
    SET @EventsJson = '[]';

PRINT '';
PRINT '=================================================================';
PRINT 'After NULL check:';
SELECT @EventsJson AS Final_EventsJson;

GO
