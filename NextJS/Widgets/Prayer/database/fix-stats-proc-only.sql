-- Fix JUST the User Response Stats stored procedure
-- Run this if the full fix script had issues

-- Drop existing procedure
IF OBJECT_ID('[dbo].[api_Custom_User_Response_Stats_JSON]', 'P') IS NOT NULL
    DROP PROCEDURE [dbo].[api_Custom_User_Response_Stats_JSON];
GO

-- Create corrected procedure
-- Uses the JsonResult pattern for nested JSON structure
CREATE PROCEDURE [dbo].[api_Custom_User_Response_Stats_JSON]
    @ContactID INT,
    @ResponseTypeID INT = 1
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @ResponseTypeName NVARCHAR(50);
    SELECT @ResponseTypeName = Response_Type
    FROM Feedback_Response_Types
    WHERE Response_Type_ID = @ResponseTypeID;

    -- Return a single JsonResult column containing the entire nested JSON structure
    -- MP will wrap this in an array: [{"JsonResult": {...}}]
    -- Client-side: const data = response[0].JsonResult;
    SELECT (
        SELECT
            @ContactID AS Contact_ID,
            @ResponseTypeID AS Response_Type_ID,
            @ResponseTypeName AS Response_Type_Name,

            -- Total responses of this type
            (SELECT COUNT(*)
             FROM Feedback_Entry_User_Responses
             WHERE Contact_ID = @ContactID
             AND Response_Type_ID = @ResponseTypeID) AS Total_Responses,

            -- Responses today
            (SELECT COUNT(*)
             FROM Feedback_Entry_User_Responses
             WHERE Contact_ID = @ContactID
             AND Response_Type_ID = @ResponseTypeID
             AND CAST(Response_Date AS DATE) = CAST(GETDATE() AS DATE)) AS Responses_Today,

            -- Current streak (consecutive days with this response type)
            (SELECT COUNT(DISTINCT CAST(Response_Date AS DATE))
             FROM Feedback_Entry_User_Responses r1
             WHERE Contact_ID = @ContactID
             AND Response_Type_ID = @ResponseTypeID
             AND CAST(Response_Date AS DATE) <= CAST(GETDATE() AS DATE)
             AND NOT EXISTS (
                 SELECT 1
                 WHERE CAST(GETDATE() AS DATE) > CAST(r1.Response_Date AS DATE)
                 AND NOT EXISTS (
                     SELECT 1
                     FROM Feedback_Entry_User_Responses r2
                     WHERE r2.Contact_ID = @ContactID
                     AND r2.Response_Type_ID = @ResponseTypeID
                     AND CAST(r2.Response_Date AS DATE) = DATEADD(day, 1, CAST(r1.Response_Date AS DATE))
                 )
             )) AS Current_Streak,

            -- Last response date
            (SELECT MAX(Response_Date)
             FROM Feedback_Entry_User_Responses
             WHERE Contact_ID = @ContactID
             AND Response_Type_ID = @ResponseTypeID) AS Last_Response_Date,

            -- Total unique feedback entries responded to
            (SELECT COUNT(DISTINCT Feedback_Entry_ID)
             FROM Feedback_Entry_User_Responses
             WHERE Contact_ID = @ContactID
             AND Response_Type_ID = @ResponseTypeID) AS Unique_Entries_Responded

        FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
    ) AS JsonResult;
END;
GO

-- Test it
EXEC api_Custom_User_Response_Stats_JSON @ContactID = 228155, @ResponseTypeID = 1;
