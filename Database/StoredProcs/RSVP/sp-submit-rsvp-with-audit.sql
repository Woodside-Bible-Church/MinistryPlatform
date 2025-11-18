-- ===================================================================
-- Stored Procedure: api_Custom_RSVP_Submit_JSON (with Audit Logging)
-- ===================================================================
-- Submits an RSVP with answers and creates Event_Participant record
-- Returns confirmation data with event details
-- Logs all changes to dp_Audit_Log via util_createauditlogentries
-- ===================================================================

USE [MinistryPlatform]
GO

IF OBJECT_ID('[dbo].[api_Custom_RSVP_Submit_JSON]', 'P') IS NOT NULL
    DROP PROCEDURE [dbo].[api_Custom_RSVP_Submit_JSON];
GO

CREATE PROCEDURE [dbo].[api_Custom_RSVP_Submit_JSON]
    @Event_ID INT,
    @Project_RSVP_ID INT,
    @Contact_ID INT = NULL,
    @First_Name NVARCHAR(50),
    @Last_Name NVARCHAR(50),
    @Email_Address NVARCHAR(100),
    @Phone_Number NVARCHAR(25) = NULL,
    @Answers NVARCHAR(MAX) = NULL  -- JSON array of answers
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        -- ===================================================================
        -- Audit Logging Setup
        -- ===================================================================
        DECLARE @AuditUserName NVARCHAR(254) = 'RSVPWidget'
              , @AuditUserID INT = 0
        DECLARE @ToBeAudited mp_ServiceAuditLog

        -- Set audit username to include submitter email for traceability
        SET @AuditUserName = 'RSVPWidget (' + @Email_Address + ')'

        -- If Contact_ID exists and is linked to a User, use that User_ID for auditing
        IF @Contact_ID IS NOT NULL
        BEGIN
            SELECT TOP 1 @AuditUserID = User_ID
            FROM dp_Users
            WHERE Contact_ID = @Contact_ID
        END

        -- ===================================================================
        -- Validate inputs
        -- ===================================================================
        IF @Event_ID IS NULL OR @Project_RSVP_ID IS NULL
        BEGIN
            SELECT 'error' AS status, 'Event_ID and Project_RSVP_ID are required' AS message
            FOR JSON PATH, WITHOUT_ARRAY_WRAPPER;
            ROLLBACK TRANSACTION;
            RETURN;
        END

        IF @First_Name IS NULL OR @Last_Name IS NULL OR @Email_Address IS NULL
        BEGIN
            SELECT 'error' AS status, 'First Name, Last Name, and Email are required' AS message
            FOR JSON PATH, WITHOUT_ARRAY_WRAPPER;
            ROLLBACK TRANSACTION;
            RETURN;
        END

        -- Check if event exists and is linked to this project
        IF NOT EXISTS (
            SELECT 1
            FROM Project_Events pe
            INNER JOIN Project_RSVPs pr ON pe.Project_ID = pr.Project_ID
            WHERE pe.Event_ID = @Event_ID
              AND pr.Project_RSVP_ID = @Project_RSVP_ID
              AND pe.Include_In_RSVP = 1
        )
        BEGIN
            SELECT 'error' AS status, 'Event not found or not available for RSVP' AS message
            FOR JSON PATH, WITHOUT_ARRAY_WRAPPER;
            ROLLBACK TRANSACTION;
            RETURN;
        END

        -- ===================================================================
        -- Generate Confirmation Code
        -- ===================================================================
        DECLARE @ConfirmationCode NVARCHAR(20);
        DECLARE @CodePrefix NVARCHAR(10);
        DECLARE @CodeSuffix NVARCHAR(10);

        -- Use last 5 digits of Event_ID as prefix
        SET @CodePrefix = RIGHT('00000' + CAST(@Event_ID AS NVARCHAR), 5);

        -- Generate random 4-digit suffix
        SET @CodeSuffix = RIGHT('0000' + CAST(ABS(CHECKSUM(NEWID()) % 10000) AS NVARCHAR), 4);

        SET @ConfirmationCode = @CodePrefix + '-' + @CodeSuffix;

        -- ===================================================================
        -- Determine if this is a guest RSVP
        -- ===================================================================
        DECLARE @IsGuest BIT = 0;

        IF @Contact_ID IS NULL
        BEGIN
            SET @IsGuest = 1;

            -- Check if we should create a Contact for this guest
            -- For now, we'll leave Contact_ID as NULL
            -- Future enhancement: Create Contact record if Allow_Guest_Submission = 1
        END

        -- ===================================================================
        -- Insert Event_RSVP record (WITH AUDIT LOGGING)
        -- ===================================================================
        DECLARE @EventRSVPID INT;

        INSERT INTO Event_RSVPs (
            Event_ID,
            Project_RSVP_ID,
            Contact_ID,
            First_Name,
            Last_Name,
            Email_Address,
            Phone_Number,
            Submission_Date,
            Confirmation_Code,
            Is_Guest,
            Domain_ID
        )
        OUTPUT 'Event_RSVPs',
               INSERTED.Event_RSVP_ID,
               'Created',
               @AuditUserID,
               @AuditUserName,
               NULL,NULL,NULL,NULL,NULL,NULL
        INTO @ToBeAudited
        VALUES (
            @Event_ID,
            @Project_RSVP_ID,
            @Contact_ID,
            @First_Name,
            @Last_Name,
            @Email_Address,
            @Phone_Number,
            GETDATE(),
            @ConfirmationCode,
            @IsGuest,
            1  -- Default Domain_ID
        );

        SET @EventRSVPID = SCOPE_IDENTITY();

        -- ===================================================================
        -- Parse and Insert Answers (WITH AUDIT LOGGING)
        -- ===================================================================
        IF @Answers IS NOT NULL AND @Answers != '[]'
        BEGIN
            -- Parse JSON answers and insert with audit logging
            INSERT INTO Event_RSVP_Answers (
                Event_RSVP_ID,
                Project_RSVP_Question_ID,
                Answer_Text,
                Answer_Numeric,
                Answer_Boolean,
                Answer_Date,
                Domain_ID
            )
            OUTPUT 'Event_RSVP_Answers',
                   INSERTED.Event_RSVP_Answer_ID,
                   'Created',
                   @AuditUserID,
                   @AuditUserName,
                   NULL,NULL,NULL,NULL,NULL,NULL
            INTO @ToBeAudited
            SELECT
                @EventRSVPID,
                JSON_VALUE(value, '$.Question_ID'),
                JSON_VALUE(value, '$.Text_Value'),
                TRY_CAST(JSON_VALUE(value, '$.Numeric_Value') AS INT),
                TRY_CAST(JSON_VALUE(value, '$.Boolean_Value') AS BIT),
                TRY_CAST(JSON_VALUE(value, '$.Date_Value') AS DATETIME),
                1  -- Domain_ID
            FROM OPENJSON(@Answers);
        END

        -- ===================================================================
        -- Create Event_Participant record (WITH AUDIT LOGGING)
        -- ===================================================================
        DECLARE @EventParticipantID INT;
        DECLARE @PartySize INT = 1;

        -- Try to get party size from answers (Question 1 is typically "How many people?")
        SELECT TOP 1 @PartySize = ISNULL(Answer_Numeric, 1)
        FROM Event_RSVP_Answers
        WHERE Event_RSVP_ID = @EventRSVPID
          AND Answer_Numeric IS NOT NULL
        ORDER BY Event_RSVP_Answer_ID ASC;

        -- Only create Event_Participant if we have a Contact_ID
        -- For guest RSVPs, we skip this step (or could create Contact first)
        IF @Contact_ID IS NOT NULL
        BEGIN
            -- Check for Participation_Status_ID
            -- Typically ID 2 = "Registered" or "Attended"
            -- Adjust based on your MP configuration
            DECLARE @ParticipationStatusID INT = 2;

            INSERT INTO Event_Participants (
                Event_ID,
                Participant_ID,  -- This is Contact_ID in MP
                Participation_Status_ID,
                Notes,
                Domain_ID
            )
            OUTPUT 'Event_Participants',
                   INSERTED.Event_Participant_ID,
                   'Created',
                   @AuditUserID,
                   @AuditUserName,
                   NULL,NULL,NULL,NULL,NULL,NULL
            INTO @ToBeAudited
            VALUES (
                @Event_ID,
                @Contact_ID,
                @ParticipationStatusID,
                'RSVP via widget - Party size: ' + CAST(@PartySize AS NVARCHAR),
                1  -- Domain_ID
            );

            SET @EventParticipantID = SCOPE_IDENTITY();

            -- Update Event_RSVP with Event_Participant_ID
            UPDATE Event_RSVPs
            SET Event_Participant_ID = @EventParticipantID
            WHERE Event_RSVP_ID = @EventRSVPID;
        END

        -- ===================================================================
        -- Get Event and Campus Details for Confirmation
        -- ===================================================================
        DECLARE @ConfirmationJson NVARCHAR(MAX);

        SELECT @ConfirmationJson = (
            SELECT
                @EventRSVPID AS Event_RSVP_ID,
                @ConfirmationCode AS Confirmation_Code,
                @EventParticipantID AS Event_Participant_ID,
                @PartySize AS Party_Size,
                e.Event_ID,
                e.Event_Title,
                e.Event_Start_Date,
                e.Event_End_Date,
                c.Congregation_ID,
                c.Congregation_Name AS Campus_Name,
                l.Location_Name AS Campus_Location,
                a.Address_Line_1 AS Campus_Address,
                a.City AS Campus_City,
                a.[State/Region] AS Campus_State,
                a.Postal_Code AS Campus_Zip,
                -- Google Maps URL
                'https://www.google.com/maps/search/?api=1&query=' +
                    REPLACE(REPLACE(
                        ISNULL(a.Address_Line_1, '') + ' ' +
                        ISNULL(a.City, '') + ' ' +
                        ISNULL(a.[State/Region], '') + ' ' +
                        ISNULL(a.Postal_Code, ''),
                    ' ', '+'), ',', '') AS Google_Maps_URL
            FROM Events e
            LEFT JOIN Congregations c ON e.Congregation_ID = c.Congregation_ID
            LEFT JOIN Locations l ON c.Location_ID = l.Location_ID
            LEFT JOIN Addresses a ON l.Address_ID = a.Address_ID
            WHERE e.Event_ID = @Event_ID
            FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
        );

        -- ===================================================================
        -- Schedule Confirmation Email + Campaigns
        -- ===================================================================
        DECLARE @Congregation_ID INT;
        SELECT @Congregation_ID = Congregation_ID FROM Events WHERE Event_ID = @Event_ID;

        -- Build Answers_JSON for email templates
        DECLARE @Answers_JSON NVARCHAR(MAX);
        SELECT @Answers_JSON = (
            SELECT
                a.Project_RSVP_Question_ID AS Question_ID,
                q.Question_Text,
                CASE
                    WHEN a.Answer_Numeric IS NOT NULL THEN CAST(a.Answer_Numeric AS NVARCHAR(100))
                    WHEN a.Answer_Boolean IS NOT NULL THEN CASE WHEN a.Answer_Boolean = 1 THEN 'Yes' ELSE 'No' END
                    WHEN a.Answer_Date IS NOT NULL THEN CONVERT(NVARCHAR(50), a.Answer_Date, 101)
                    WHEN a.Answer_Text IS NOT NULL THEN a.Answer_Text
                    ELSE 'No answer'
                END AS Answer
            FROM Event_RSVP_Answers a
            INNER JOIN Project_RSVP_Questions q ON a.Project_RSVP_Question_ID = q.Project_RSVP_Question_ID
            WHERE a.Event_RSVP_ID = @EventRSVPID
            FOR JSON PATH
        );

        -- Schedule emails (doesn't throw errors - just logs failures)
        EXEC api_Custom_Schedule_RSVP_Emails
            @Event_RSVP_ID = @EventRSVPID,
            @Event_ID = @Event_ID,
            @Congregation_ID = @Congregation_ID,
            @Project_RSVP_ID = @Project_RSVP_ID,
            @First_Name = @First_Name,
            @Last_Name = @Last_Name,
            @Email_Address = @Email_Address,
            @Phone_Number = @Phone_Number,
            @Confirmation_Code = @ConfirmationCode,
            @Party_Size = @PartySize,
            @Answers_JSON = @Answers_JSON,
            @Author_User_ID = COALESCE(@AuditUserID, 1);

        -- ===================================================================
        -- Write Audit Logs to dp_Audit_Log
        -- ===================================================================
        IF EXISTS (SELECT 1 FROM @ToBeAudited)
        BEGIN
            EXEC dbo.util_createauditlogentries @ToBeAudited
        END

        -- ===================================================================
        -- Commit and Return Success
        -- ===================================================================
        COMMIT TRANSACTION;

        -- Return as JsonResult to match expected format
        DECLARE @Result NVARCHAR(MAX);
        SET @Result = (
            SELECT
                'success' AS status,
                @ConfirmationJson AS confirmation
            FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
        );

        SELECT @Result AS JsonResult;

    END TRY
    BEGIN CATCH
        -- Rollback on error
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;

        -- Return error details as JsonResult
        DECLARE @ErrorResult NVARCHAR(MAX);
        SET @ErrorResult = (
            SELECT
                'error' AS status,
                ERROR_MESSAGE() AS message,
                ERROR_NUMBER() AS error_number,
                ERROR_LINE() AS error_line
            FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
        );

        SELECT @ErrorResult AS JsonResult;
    END CATCH
END
GO

-- ===================================================================
-- Grant API Access
-- ===================================================================
-- Uncomment and adjust based on your MP API user configuration
-- Example: GRANT EXECUTE ON [dbo].[api_Custom_RSVP_Submit_JSON] TO [YourAPIUser];

PRINT 'Created stored procedure: api_Custom_RSVP_Submit_JSON (with audit logging)';
PRINT 'NOTE: Remember to grant EXECUTE permission to your API user!';
PRINT 'Audit logs will be written to dp_Audit_Log via util_createauditlogentries';
GO

-- ===================================================================
-- Test Query (Uncomment to test)
-- ===================================================================
/*
-- Test submission
DECLARE @AnswersJson NVARCHAR(MAX) = N'[
    {"Question_ID": 1, "Numeric_Value": 4},
    {"Question_ID": 2, "Boolean_Value": true}
]';

EXEC api_Custom_RSVP_Submit_JSON
    @Event_ID = 101,
    @Project_RSVP_ID = 1,
    @Contact_ID = 228155,
    @First_Name = 'John',
    @Last_Name = 'Doe',
    @Email_Address = 'john.doe@example.com',
    @Phone_Number = '(810) 555-1234',
    @Answers = @AnswersJson;

-- View audit logs for this RSVP
SELECT TOP 10
    al.Audit_Item_ID,
    al.Table_Name,
    al.Record_ID,
    al.Audit_Description,
    al.User_Name,
    al.Date_Time,
    ad.Field_Name,
    ad.Field_Label,
    ad.Previous_Value,
    ad.New_Value
FROM dp_Audit_Log al
LEFT JOIN dp_Audit_Detail ad ON al.Audit_Item_ID = ad.Audit_Item_ID
WHERE al.Table_Name IN ('Event_RSVPs', 'Event_RSVP_Answers', 'Event_Participants')
ORDER BY al.Date_Time DESC;
*/
