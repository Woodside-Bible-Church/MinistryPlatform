-- ===================================================================
-- Stored Procedure: api_Custom_RSVP_Submit_JSON (v2)
-- ===================================================================
-- Submits an RSVP with Form_Response, Form_Response_Answers, Event_Participant
-- Populates Answer_Summary field with all form answers
-- Returns confirmation data with event details
-- ===================================================================

USE [MinistryPlatform]
GO

IF OBJECT_ID('[dbo].[api_Custom_RSVP_Submit_JSON]', 'P') IS NOT NULL
    DROP PROCEDURE [dbo].[api_Custom_RSVP_Submit_JSON];
GO

CREATE PROCEDURE [dbo].[api_Custom_RSVP_Submit_JSON]
    @Event_ID INT,
    @Project_ID INT,              -- Changed from @Project_RSVP_ID
    @Contact_ID INT = NULL,
    @Participant_ID INT = NULL,   -- Person attending (from household dropdown)
    @First_Name NVARCHAR(50),
    @Last_Name NVARCHAR(50),
    @Email_Address NVARCHAR(100),
    @Phone_Number NVARCHAR(25) = NULL,
    @Answers NVARCHAR(MAX) = NULL  -- JSON array: [{Question_ID, Numeric_Value, Boolean_Value, Text_Value, Date_Value}]
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        -- ===================================================================
        -- Audit Logging Setup
        -- ===================================================================
        DECLARE @AuditRecords TABLE (
            Table_Name VARCHAR(75),
            Record_ID INT,
            Audit_Description VARCHAR(50)
        );

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

        -- Get Form_ID from Projects table
        DECLARE @Form_ID INT;
        SELECT @Form_ID = Form_ID
        FROM Projects
        WHERE Project_ID = @Project_ID;

        -- Check if event exists and is linked to this project
        IF NOT EXISTS (
            SELECT 1
            FROM Events e
            WHERE e.Event_ID = @Event_ID
              AND e.Project_ID = @Project_ID
              AND e.Include_In_RSVP = 1
        )
        BEGIN
            SELECT 'error' AS status, 'Event not found or not available for RSVP' AS message
            FOR JSON PATH, WITHOUT_ARRAY_WRAPPER;
            ROLLBACK TRANSACTION;
            RETURN;
        END

        -- ===================================================================
        -- Determine Contact_ID and Participant_ID
        -- ===================================================================
        -- @Contact_ID = Person submitting the form (logged in user or null for guest)
        -- @Participant_ID = Person attending the event (from household dropdown)
        -- If @Participant_ID is null, default to @Contact_ID
        IF @Participant_ID IS NULL
            SET @Participant_ID = @Contact_ID;

        -- Look up Participant_Record from Contacts table
        -- This is the correct ID to use for Event_Participants.Participant_ID
        IF @Participant_ID IS NOT NULL
        BEGIN
            DECLARE @ParticipantRecordID INT;
            SELECT @ParticipantRecordID = Participant_Record
            FROM Contacts
            WHERE Contact_ID = @Participant_ID;

            -- Use Participant_Record if it exists, otherwise use Contact_ID
            IF @ParticipantRecordID IS NOT NULL
                SET @Participant_ID = @ParticipantRecordID;
        END

        -- ===================================================================
        -- Get Party Size from Answers (first numeric answer, typically "How many people?")
        -- ===================================================================
        DECLARE @PartySize INT = 1;

        IF @Answers IS NOT NULL AND @Answers != '[]'
        BEGIN
            SELECT TOP 1 @PartySize = ISNULL(CAST(JSON_VALUE(value, '$.Numeric_Value') AS INT), 1)
            FROM OPENJSON(@Answers)
            WHERE JSON_VALUE(value, '$.Numeric_Value') IS NOT NULL;
        END

        -- ===================================================================
        -- Create Event_Participant record
        -- ===================================================================
        DECLARE @EventParticipantID INT;

        -- Only create Event_Participant if we have a Participant_ID
        IF @Participant_ID IS NOT NULL
        BEGIN
            -- Check for Participation_Status_ID (2 = "Registered" or "Attended")
            DECLARE @ParticipationStatusID INT = 2;

            INSERT INTO Event_Participants (
                Event_ID,
                Participant_ID,
                Participation_Status_ID,
                RSVP_Party_Size,    -- Store party size in dedicated field
                Notes,
                Domain_ID
            )
            VALUES (
                @Event_ID,
                @Participant_ID,
                @ParticipationStatusID,
                @PartySize,
                'RSVP via widget',
                1  -- Default Domain_ID
            );

            SET @EventParticipantID = SCOPE_IDENTITY();

            -- Add to audit records
            INSERT INTO @AuditRecords (Table_Name, Record_ID, Audit_Description)
            VALUES ('Event_Participants', @EventParticipantID, 'Created');
        END

        -- ===================================================================
        -- Create Form_Response record
        -- ===================================================================
        DECLARE @FormResponseID INT;

        IF @Form_ID IS NOT NULL
        BEGIN
            INSERT INTO Form_Responses (
                Form_ID,
                Response_Date,
                Contact_ID,
                First_Name,
                Last_Name,
                Email_Address,
                Phone_Number,
                Event_ID,
                Event_Participant_ID,  -- Link to Event_Participant
                Domain_ID
            )
            VALUES (
                @Form_ID,
                GETDATE(),
                @Contact_ID,
                @First_Name,
                @Last_Name,
                @Email_Address,
                @Phone_Number,
                @Event_ID,
                @EventParticipantID,
                1  -- Default Domain_ID
            );

            SET @FormResponseID = SCOPE_IDENTITY();

            -- Add to audit records
            INSERT INTO @AuditRecords (Table_Name, Record_ID, Audit_Description)
            VALUES ('Form_Responses', @FormResponseID, 'Created');
        END

        -- ===================================================================
        -- Insert Form_Response_Answers and build Answer_Summary
        -- ===================================================================
        DECLARE @AnswerSummary NVARCHAR(MAX) = '';

        IF @Form_ID IS NOT NULL AND @Answers IS NOT NULL AND @Answers != '[]'
        BEGIN
            -- Insert Form_Response_Answers and capture inserted IDs for audit logging
            -- Question_ID from widget corresponds to Form_Field_ID in database
            INSERT INTO Form_Response_Answers (
                Form_Response_ID,
                Form_Field_ID,      -- This is the Question_ID from the widget
                Response,           -- Store all values as text in Response field
                Event_Participant_ID,
                Domain_ID
            )
            OUTPUT 'Form_Response_Answers', INSERTED.Form_Response_Answer_ID, 'Created'
            INTO @AuditRecords (Table_Name, Record_ID, Audit_Description)
            SELECT
                @FormResponseID,
                CAST(JSON_VALUE(value, '$.Question_ID') AS INT) AS Form_Field_ID,
                -- Convert various value types to text
                CASE
                    WHEN JSON_VALUE(value, '$.Text_Value') IS NOT NULL
                        THEN JSON_VALUE(value, '$.Text_Value')
                    WHEN JSON_VALUE(value, '$.Numeric_Value') IS NOT NULL
                        THEN JSON_VALUE(value, '$.Numeric_Value')
                    WHEN JSON_VALUE(value, '$.Boolean_Value') IS NOT NULL
                        THEN CASE WHEN CAST(JSON_VALUE(value, '$.Boolean_Value') AS BIT) = 1 THEN 'True' ELSE 'False' END
                    WHEN JSON_VALUE(value, '$.Date_Value') IS NOT NULL
                        THEN CONVERT(NVARCHAR, CAST(JSON_VALUE(value, '$.Date_Value') AS DATETIME), 101)
                    ELSE NULL
                END AS Response,
                @EventParticipantID,
                1  -- Domain_ID
            FROM OPENJSON(@Answers)
            WHERE CAST(JSON_VALUE(value, '$.Question_ID') AS INT) IS NOT NULL
              AND CAST(JSON_VALUE(value, '$.Question_ID') AS INT) > 0;  -- Skip Question_ID = 0 (party size)

            -- Build Answer_Summary from Form_Response_Answers
            -- Join with Form_Fields to get Field_Label for each answer
            -- Only include non-hidden fields
            -- Use STUFF with FOR XML PATH to properly concatenate in order
            SELECT @AnswerSummary = STUFF((
                SELECT '<br>' + ff.Field_Label + ': ' + fra.Response
                FROM Form_Response_Answers fra
                INNER JOIN Form_Fields ff ON fra.Form_Field_ID = ff.Form_Field_ID
                WHERE fra.Form_Response_ID = @FormResponseID
                  AND ff.Is_Hidden = 0
                ORDER BY ff.Field_Order
                FOR XML PATH(''), TYPE
            ).value('.', 'NVARCHAR(MAX)'), 1, 4, '');  -- Remove leading <br>
        END

        -- Build final Answer_Summary for Event_Participant
        -- Start with "How many people?" then add form field answers
        IF @EventParticipantID IS NOT NULL
        BEGIN
            DECLARE @FinalAnswerSummary NVARCHAR(MAX) = '';
            DECLARE @OldAnswerSummary NVARCHAR(MAX) = NULL;

            -- Add party size as first line
            SET @FinalAnswerSummary = 'How many people? ' + CAST(@PartySize AS NVARCHAR);

            -- Append form field answers if they exist
            IF @AnswerSummary IS NOT NULL AND @AnswerSummary != ''
                SET @FinalAnswerSummary = @FinalAnswerSummary + '<br>' + @AnswerSummary;

            -- Capture old Answer_Summary value before update
            SELECT @OldAnswerSummary = Answer_Summary
            FROM Event_Participants
            WHERE Event_Participant_ID = @EventParticipantID;

            -- Update Event_Participant with complete Answer_Summary
            UPDATE Event_Participants
            SET Answer_Summary = @FinalAnswerSummary
            WHERE Event_Participant_ID = @EventParticipantID;

            -- Add to audit records
            INSERT INTO @AuditRecords (Table_Name, Record_ID, Audit_Description)
            VALUES ('Event_Participants', @EventParticipantID, 'Updated');
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
        -- Get Event and Campus Details for Confirmation
        -- ===================================================================
        DECLARE @ConfirmationJson NVARCHAR(MAX);

        SELECT @ConfirmationJson = (
            SELECT
                @EventParticipantID AS Event_Participant_ID,
                @FormResponseID AS Form_Response_ID,
                @ConfirmationCode AS Confirmation_Code,
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
        -- Insert Audit Log Records
        -- ===================================================================
        -- Table to capture inserted Audit_Item_IDs
        DECLARE @InsertedAuditItems TABLE (
            Audit_Item_ID INT,
            Table_Name VARCHAR(75),
            Record_ID INT,
            Audit_Description VARCHAR(50)
        );

        INSERT INTO dp_Audit_Log (
            Table_Name,
            Record_ID,
            Audit_Description,
            User_Name,
            User_ID,
            Date_Time
        )
        OUTPUT
            INSERTED.Audit_Item_ID,
            INSERTED.Table_Name,
            INSERTED.Record_ID,
            INSERTED.Audit_Description
        INTO @InsertedAuditItems
        SELECT
            Table_Name,
            Record_ID,
            Audit_Description,
            @First_Name + ' ' + @Last_Name + ' (RSVP Widget)',
            ISNULL(@Contact_ID, 0),
            GETDATE()
        FROM @AuditRecords;

        -- Insert Audit Detail for UPDATE operations (Answer_Summary change)
        -- Allow NULL previous values for new records
        IF @EventParticipantID IS NOT NULL
        BEGIN
            DECLARE @UpdateAuditItemID INT;

            SELECT @UpdateAuditItemID = Audit_Item_ID
            FROM @InsertedAuditItems
            WHERE Table_Name = 'Event_Participants'
              AND Record_ID = @EventParticipantID
              AND Audit_Description = 'Updated';

            IF @UpdateAuditItemID IS NOT NULL
            BEGIN
                INSERT INTO dp_Audit_Detail (
                    Audit_Item_ID,
                    Field_Name,
                    Field_Label,
                    Previous_Value,
                    New_Value
                )
                VALUES (
                    @UpdateAuditItemID,
                    'Answer_Summary',
                    'Answer Summary',
                    @OldAnswerSummary,  -- Can be NULL for new records
                    @FinalAnswerSummary
                );
            END
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
-- GRANT EXECUTE ON [dbo].[api_Custom_RSVP_Submit_JSON] TO [apiuser];

PRINT 'Created stored procedure: api_Custom_RSVP_Submit_JSON (v2)';
PRINT 'NOTE: Remember to grant EXECUTE permission to your API user!';
GO

-- ===================================================================
-- Test Query (Uncomment to test)
-- ===================================================================
/*
-- Test submission
DECLARE @AnswersJson NVARCHAR(MAX) = N'[
    {"Question_ID": 22691, "Numeric_Value": 2},
    {"Question_ID": 22656, "Boolean_Value": false}
]';

EXEC api_Custom_RSVP_Submit_JSON
    @Event_ID = 6480963,
    @Project_ID = 1,
    @Contact_ID = 228155,
    @Participant_ID = 228155,
    @First_Name = 'John',
    @Last_Name = 'Doe',
    @Email_Address = 'john.doe@example.com',
    @Phone_Number = '(810) 555-1234',
    @Answers = @AnswersJson;
*/
