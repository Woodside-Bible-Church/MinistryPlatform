-- ===================================================================
-- Stored Procedure: api_Custom_RSVP_Submit_JSON (v2 - Native MP Tables)
-- ===================================================================
-- Submits an RSVP using Event_Participants and Form_Responses
-- Calls api_Common_FindMatchingContact for guest RSVPs
-- Stores all contact info in Event_Participants.Notes
-- Sets RSVP_Party_Size field
-- Returns confirmation data with event details
-- ===================================================================

USE [MinistryPlatform]
GO

IF OBJECT_ID('[dbo].[api_Custom_RSVP_Submit_JSON]', 'P') IS NOT NULL
    DROP PROCEDURE [dbo].[api_Custom_RSVP_Submit_JSON];
GO

CREATE PROCEDURE [dbo].[api_Custom_RSVP_Submit_JSON]
    @Event_ID INT,
    @Project_ID INT,
    @Contact_ID INT = NULL,  -- Person submitting the RSVP
    @Participant_ID INT = NULL,  -- Person actually attending (can be different from Contact_ID for family members)
    @First_Name NVARCHAR(50),
    @Last_Name NVARCHAR(50),
    @Email_Address NVARCHAR(100),
    @Phone_Number NVARCHAR(25) = NULL,
    @Address_Line_1 NVARCHAR(75) = NULL,
    @Address_Line_2 NVARCHAR(75) = NULL,
    @City NVARCHAR(50) = NULL,
    @State NVARCHAR(50) = NULL,
    @Postal_Code NVARCHAR(15) = NULL,
    @Country NVARCHAR(50) = NULL,
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
        IF @Event_ID IS NULL OR @Project_ID IS NULL
        BEGIN
            SELECT 'error' AS status, 'Event_ID and Project_ID are required' AS message
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
            FROM Events e
            INNER JOIN Projects p ON e.Project_ID = p.Project_ID
            WHERE e.Event_ID = @Event_ID
              AND p.Project_ID = @Project_ID
              AND e.Include_In_RSVP = 1
              AND p.RSVP_Is_Active = 1
        )
        BEGIN
            SELECT 'error' AS status, 'Event not found or not available for RSVP' AS message
            FOR JSON PATH, WITHOUT_ARRAY_WRAPPER;
            ROLLBACK TRANSACTION;
            RETURN;
        END

        -- ===================================================================
        -- Contact Matching for Guest RSVPs
        -- Only runs if Contact_ID is NULL (guest submission)
        -- When user is logged in, Contact_ID is already provided
        -- ===================================================================
        DECLARE @MatchedContactCount INT = 0;
        DECLARE @DefaultContactID INT = 2;  -- Default contact for unmatched guests

        IF @Contact_ID IS NULL
        BEGIN
            -- Format phone number for matching (remove all non-digits, then compare)
            DECLARE @PhoneForMatching NVARCHAR(25);
            SET @PhoneForMatching = CASE
                WHEN @Phone_Number IS NOT NULL
                THEN REPLACE(REPLACE(REPLACE(REPLACE(@Phone_Number,' ',''),'-',''),')',''),'(','')
                ELSE ''
            END;

            -- Try to find matching contact directly using same logic as api_Common_FindMatchingContact
            -- Match on email first (most reliable), then try phone
            SELECT TOP 1 @Contact_ID = C.Contact_ID
            FROM Contacts C
            LEFT OUTER JOIN Households H ON H.Household_ID = C.Household_ID
            WHERE C.Last_Name LIKE @Last_Name
              AND (C.First_Name LIKE @First_Name OR C.Nickname LIKE @First_Name)
              AND (
                  -- Match on email (preferred)
                  C.Email_Address LIKE @Email_Address
                  -- OR match on phone if provided
                  OR (@PhoneForMatching != '' AND (
                      REPLACE(REPLACE(REPLACE(REPLACE(C.Mobile_Phone,' ',''),'-',''),')',''),'(','') LIKE @PhoneForMatching
                      OR REPLACE(REPLACE(REPLACE(REPLACE(C.Company_Phone,' ',''),'-',''),')',''),'(','') LIKE @PhoneForMatching
                      OR REPLACE(REPLACE(REPLACE(REPLACE(H.Home_Phone,' ',''),'-',''),')',''),'(','') LIKE @PhoneForMatching
                  ))
              )
            ORDER BY
              -- Prioritize exact email matches
              CASE WHEN C.Email_Address = @Email_Address THEN 1 ELSE 2 END;

            -- If no match found, use default Contact_ID = 2
            IF @Contact_ID IS NULL
            BEGIN
                SET @Contact_ID = @DefaultContactID;
            END
        END
        -- If Contact_ID was provided (user is logged in), skip matching entirely
        -- AND populate address fields from their household if not provided
        IF @Contact_ID IS NOT NULL
        BEGIN
            -- Get address info from Contacts > Household > Address if fields are empty
            IF (@Address_Line_1 IS NULL OR @Address_Line_1 = '') AND
               (@City IS NULL OR @City = '') AND
               (@State IS NULL OR @State = '') AND
               (@Postal_Code IS NULL OR @Postal_Code = '')
            BEGIN
                SELECT TOP 1
                    @Address_Line_1 = ISNULL(@Address_Line_1, a.Address_Line_1),
                    @Address_Line_2 = ISNULL(@Address_Line_2, a.Address_Line_2),
                    @City = ISNULL(@City, a.City),
                    @State = ISNULL(@State, a.[State/Region]),
                    @Postal_Code = ISNULL(@Postal_Code, a.Postal_Code),
                    @Country = ISNULL(@Country, a.Country)
                FROM Contacts c
                INNER JOIN Households h ON c.Household_ID = h.Household_ID
                INNER JOIN Addresses a ON h.Address_ID = a.Address_ID
                WHERE c.Contact_ID = @Contact_ID;
            END
        END

        -- ===================================================================
        -- Get Party Size from Answers
        -- Question_ID = 0 is the implicit "How many people?" question
        -- ===================================================================
        DECLARE @PartySize INT = 1;

        IF @Answers IS NOT NULL AND @Answers != '[]'
        BEGIN
            SELECT TOP 1 @PartySize = ISNULL(TRY_CAST(JSON_VALUE(value, '$.Numeric_Value') AS INT), 1)
            FROM OPENJSON(@Answers)
            WHERE JSON_VALUE(value, '$.Question_ID') = '0';
        END

        -- Default to 1 if not provided
        IF @PartySize IS NULL OR @PartySize < 1
            SET @PartySize = 1;

        -- ===================================================================
        -- Build Notes and Answer Summary Fields
        -- ===================================================================
        DECLARE @NotesField NVARCHAR(MAX);
        DECLARE @AnswerSummary NVARCHAR(MAX);
        DECLARE @FormID INT;

        -- Build Notes field with contact info only (no answer summary)
        SET @NotesField =
            'First Name: ' + @First_Name + CHAR(13) + CHAR(10) +
            'Last Name: ' + @Last_Name + CHAR(13) + CHAR(10) +
            'Phone: ' + ISNULL(@Phone_Number, '') + CHAR(13) + CHAR(10) +
            'Email: ' + @Email_Address + CHAR(13) + CHAR(10) +
            'Address1: ' + ISNULL(@Address_Line_1, '') + CHAR(13) + CHAR(10) +
            'Address2: ' + ISNULL(@Address_Line_2, '') + CHAR(13) + CHAR(10) +
            'City, State Zip: ' + ISNULL(@City, '') + ', ' + ISNULL(@State, '') + ' ' + ISNULL(@Postal_Code, '') + CHAR(13) + CHAR(10) +
            'Country: ' + ISNULL(@Country, '');

        -- Build Answer_Summary field (party size + form answers)
        -- Start with party size
        SET @AnswerSummary = 'How many people?: ' + CAST(@PartySize AS NVARCHAR);

        -- Append form field answers if any exist
        IF @Answers IS NOT NULL AND @Answers != '[]'
        BEGIN
            -- Get Form_ID from Project
            SELECT @FormID = Form_ID FROM Projects WHERE Project_ID = @Project_ID;

            IF @FormID IS NOT NULL
            BEGIN
                -- Append answers from Form_Fields to answer summary
                DECLARE @FormAnswers NVARCHAR(MAX) = '';

                SELECT @FormAnswers = @FormAnswers + ff.Field_Label + ': ' +
                    CASE
                        WHEN j.Numeric_Value IS NOT NULL THEN CAST(j.Numeric_Value AS NVARCHAR)
                        WHEN j.Boolean_Value IS NOT NULL THEN CASE WHEN j.Boolean_Value = 'true' THEN 'True' ELSE 'False' END
                        WHEN j.Date_Value IS NOT NULL THEN j.Date_Value
                        WHEN j.Text_Value IS NOT NULL THEN j.Text_Value
                        ELSE 'No answer'
                    END + CHAR(13) + CHAR(10)
                FROM OPENJSON(@Answers)
                WITH (
                    Question_ID INT '$.Question_ID',
                    Text_Value NVARCHAR(MAX) '$.Text_Value',
                    Numeric_Value INT '$.Numeric_Value',
                    Boolean_Value NVARCHAR(10) '$.Boolean_Value',
                    Date_Value NVARCHAR(50) '$.Date_Value'
                ) j
                INNER JOIN Form_Fields ff ON ff.Form_Field_ID = j.Question_ID
                WHERE ff.Form_ID = @FormID
                ORDER BY ff.Field_Order;

                -- Append to answer summary if we got any answers (with <br> separator)
                IF @FormAnswers != ''
                    SET @AnswerSummary = @AnswerSummary + '<br>' + @FormAnswers;
            END
        END

        -- ===================================================================
        -- Create Event_Participant record (WITH AUDIT LOGGING)
        -- ===================================================================
        DECLARE @EventParticipantID INT;
        DECLARE @ParticipationStatusID INT = 2;  -- 2 = Registered

        -- Get Participant_Record from Contacts table based on Contact_ID
        -- If Participant_ID not provided, look it up from Contact_ID
        IF @Participant_ID IS NULL AND @Contact_ID IS NOT NULL
        BEGIN
            SELECT @Participant_ID = Participant_Record
            FROM Contacts
            WHERE Contact_ID = @Contact_ID;
        END

        -- If still no Participant_ID, fail validation
        IF @Participant_ID IS NULL
        BEGIN
            SELECT 'error' AS status, 'Unable to find participant record for contact' AS message
            FOR JSON PATH, WITHOUT_ARRAY_WRAPPER;
            ROLLBACK TRANSACTION;
            RETURN;
        END

        INSERT INTO Event_Participants (
            Event_ID,
            Participant_ID,  -- Person actually attending the event
            Participation_Status_ID,
            RSVP_Party_Size,
            Notes,
            Answer_Summary,
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
            @Participant_ID,  -- Use Participant_ID from Contacts.Participant_Record
            @ParticipationStatusID,
            @PartySize,
            @NotesField,
            @AnswerSummary,
            1   -- Default Domain_ID
        );

        SET @EventParticipantID = SCOPE_IDENTITY();

        -- ===================================================================
        -- Create Form_Response if Form_ID is linked (WITH AUDIT LOGGING)
        -- ===================================================================
        DECLARE @FormResponseID INT;

        SELECT @FormID = Form_ID FROM Projects WHERE Project_ID = @Project_ID;

        IF @FormID IS NOT NULL AND @Answers IS NOT NULL AND @Answers != '[]'
        BEGIN
            -- Create Form_Response record
            INSERT INTO Form_Responses (
                Form_ID,
                Contact_ID,
                Response_Date,
                Domain_ID
            )
            OUTPUT 'Form_Responses',
                   INSERTED.Form_Response_ID,
                   'Created',
                   @AuditUserID,
                   @AuditUserName,
                   NULL,NULL,NULL,NULL,NULL,NULL
            INTO @ToBeAudited
            VALUES (
                @FormID,
                @Contact_ID,
                GETDATE(),
                1  -- Default Domain_ID
            );

            SET @FormResponseID = SCOPE_IDENTITY();

            -- Insert Form_Response_Answers (excluding Question_ID = 0 which is implicit party size)
            INSERT INTO Form_Response_Answers (
                Form_Response_ID,
                Form_Field_ID,
                Response,
                Domain_ID
            )
            OUTPUT 'Form_Response_Answers',
                   INSERTED.Form_Response_Answer_ID,
                   'Created',
                   @AuditUserID,
                   @AuditUserName,
                   NULL,NULL,NULL,NULL,NULL,NULL
            INTO @ToBeAudited
            SELECT
                @FormResponseID,
                TRY_CAST(JSON_VALUE(value, '$.Question_ID') AS INT),
                CASE
                    WHEN JSON_VALUE(value, '$.Numeric_Value') IS NOT NULL THEN JSON_VALUE(value, '$.Numeric_Value')
                    WHEN JSON_VALUE(value, '$.Boolean_Value') IS NOT NULL THEN JSON_VALUE(value, '$.Boolean_Value')
                    WHEN JSON_VALUE(value, '$.Date_Value') IS NOT NULL THEN JSON_VALUE(value, '$.Date_Value')
                    WHEN JSON_VALUE(value, '$.Text_Value') IS NOT NULL THEN JSON_VALUE(value, '$.Text_Value')
                    ELSE NULL
                END,
                1  -- Domain_ID
            FROM OPENJSON(@Answers)
            WHERE TRY_CAST(JSON_VALUE(value, '$.Question_ID') AS INT) != 0;  -- Exclude party size (Question_ID = 0)
        END

        -- ===================================================================
        -- Generate Confirmation Code
        -- ===================================================================
        DECLARE @ConfirmationCode NVARCHAR(20);
        SET @ConfirmationCode = RIGHT('00000' + CAST(@Event_ID AS NVARCHAR), 5) + '-' +
                                RIGHT('0000' + CAST(ABS(CHECKSUM(NEWID()) % 10000) AS NVARCHAR), 4);

        -- ===================================================================
        -- Get Event and Campus Details for Confirmation
        -- ===================================================================
        DECLARE @ConfirmationJson NVARCHAR(MAX);

        SELECT @ConfirmationJson = (
            SELECT
                @EventParticipantID AS Event_Participant_ID,
                @ConfirmationCode AS Confirmation_Code,
                @FormResponseID AS Form_Response_ID,
                @PartySize AS Party_Size,
                @Contact_ID AS Contact_ID,
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

PRINT 'Created stored procedure: api_Custom_RSVP_Submit_JSON (v2 - Native MP Tables)';
PRINT 'NOTE: Remember to grant EXECUTE permission to your API user!';
PRINT 'Uses Event_Participants, Form_Responses, and api_Common_FindMatchingContact';
GO

-- ===================================================================
-- Test Query (Uncomment to test)
-- ===================================================================
/*
-- Test submission with guest RSVP (will use api_Common_FindMatchingContact)
DECLARE @AnswersJson NVARCHAR(MAX) = N'[
    {"Question_ID": 0, "Numeric_Value": 4},
    {"Question_ID": 1, "Boolean_Value": "true"}
]';

EXEC api_Custom_RSVP_Submit_JSON
    @Event_ID = 101,
    @Project_ID = 1,
    @Contact_ID = NULL,  -- Guest RSVP - will try to match
    @First_Name = 'Amy',
    @Last_Name = 'Johnson',
    @Email_Address = 'amyjohnson51381@gmail.com',
    @Phone_Number = '586-287-0916',
    @Address_Line_1 = '49121 pine glen dr',
    @Address_Line_2 = '',
    @City = 'Chesterfield',
    @State = 'Mi',
    @Postal_Code = '48051',
    @Country = '',
    @Answers = @AnswersJson;

-- View created Event_Participant
SELECT TOP 1 *
FROM Event_Participants
ORDER BY Event_Participant_ID DESC;

-- View Form_Response if created
SELECT TOP 1 fr.*, fra.*
FROM Form_Responses fr
LEFT JOIN Form_Response_Answers fra ON fr.Form_Response_ID = fra.Form_Response_ID
ORDER BY fr.Form_Response_ID DESC;
*/
