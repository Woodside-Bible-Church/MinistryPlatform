-- ===================================================================
-- Quick Fix: Update api_Custom_RSVP_Submit_JSON error responses
-- This replaces all error responses to use JsonResult alias
-- ===================================================================

USE [MinistryPlatform]
GO

ALTER PROCEDURE [dbo].[api_Custom_RSVP_Submit_JSON]
    @Event_ID INT,
    @Project_ID INT,
    @Contact_ID INT = NULL,
    @Participant_ID INT = NULL,
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
    @Answers NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        -- Audit Logging Setup
        DECLARE @AuditUserName NVARCHAR(254) = 'RSVPWidget'
              , @AuditUserID INT = 0
        DECLARE @ToBeAudited mp_ServiceAuditLog

        SET @AuditUserName = 'RSVPWidget (' + @Email_Address + ')'

        IF @Contact_ID IS NOT NULL
        BEGIN
            SELECT TOP 1 @AuditUserID = User_ID
            FROM dp_Users
            WHERE Contact_ID = @Contact_ID
        END

        -- Validate inputs
        IF @Event_ID IS NULL OR @Project_ID IS NULL
        BEGIN
            DECLARE @Error1 NVARCHAR(MAX) = (
                SELECT 'error' AS status, 'Event_ID and Project_ID are required' AS message
                FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
            );
            SELECT @Error1 AS JsonResult;
            ROLLBACK TRANSACTION;
            RETURN;
        END

        IF @First_Name IS NULL OR @Last_Name IS NULL OR @Email_Address IS NULL
        BEGIN
            DECLARE @Error2 NVARCHAR(MAX) = (
                SELECT 'error' AS status, 'First Name, Last Name, and Email are required' AS message
                FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
            );
            SELECT @Error2 AS JsonResult;
            ROLLBACK TRANSACTION;
            RETURN;
        END

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
            DECLARE @Error3 NVARCHAR(MAX) = (
                SELECT 'error' AS status, 'Event not found or not available for RSVP' AS message
                FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
            );
            SELECT @Error3 AS JsonResult;
            ROLLBACK TRANSACTION;
            RETURN;
        END

        -- Contact Matching for Guest RSVPs
        DECLARE @DefaultContactID INT = 2;

        IF @Contact_ID IS NULL
        BEGIN
            DECLARE @PhoneForMatching NVARCHAR(25);
            SET @PhoneForMatching = CASE
                WHEN @Phone_Number IS NOT NULL
                THEN REPLACE(REPLACE(REPLACE(REPLACE(@Phone_Number,' ',''),'-',''),')',''),'(','')
                ELSE ''
            END;

            SELECT TOP 1 @Contact_ID = C.Contact_ID
            FROM Contacts C
            LEFT OUTER JOIN Households H ON H.Household_ID = C.Household_ID
            WHERE C.Last_Name LIKE @Last_Name
              AND (C.First_Name LIKE @First_Name OR C.Nickname LIKE @First_Name)
              AND (
                  C.Email_Address LIKE @Email_Address
                  OR (@PhoneForMatching != '' AND (
                      REPLACE(REPLACE(REPLACE(REPLACE(C.Mobile_Phone,' ',''),'-',''),')',''),'(','') LIKE @PhoneForMatching
                      OR REPLACE(REPLACE(REPLACE(REPLACE(C.Company_Phone,' ',''),'-',''),')',''),'(','') LIKE @PhoneForMatching
                      OR REPLACE(REPLACE(REPLACE(REPLACE(H.Home_Phone,' ',''),'-',''),')',''),'(','') LIKE @PhoneForMatching
                  ))
              )
            ORDER BY
              CASE WHEN C.Email_Address = @Email_Address THEN 1 ELSE 2 END;

            IF @Contact_ID IS NULL
            BEGIN
                SET @Contact_ID = @DefaultContactID;
            END
        END

        -- Populate address from Contact if logged in
        IF @Contact_ID IS NOT NULL
        BEGIN
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

        -- Get Party Size
        DECLARE @PartySize INT = 1;

        IF @Answers IS NOT NULL AND @Answers != '[]'
        BEGIN
            SELECT TOP 1 @PartySize = ISNULL(TRY_CAST(JSON_VALUE(value, '$.Numeric_Value') AS INT), 1)
            FROM OPENJSON(@Answers)
            WHERE JSON_VALUE(value, '$.Question_ID') = '0';
        END

        IF @PartySize IS NULL OR @PartySize < 1
            SET @PartySize = 1;

        -- Build Notes and Answer Summary
        DECLARE @NotesField NVARCHAR(MAX);
        DECLARE @AnswerSummary NVARCHAR(MAX);
        DECLARE @FormID INT;

        SET @NotesField =
            'First Name: ' + @First_Name + CHAR(13) + CHAR(10) +
            'Last Name: ' + @Last_Name + CHAR(13) + CHAR(10) +
            'Phone: ' + ISNULL(@Phone_Number, '') + CHAR(13) + CHAR(10) +
            'Email: ' + @Email_Address + CHAR(13) + CHAR(10) +
            'Address1: ' + ISNULL(@Address_Line_1, '') + CHAR(13) + CHAR(10) +
            'Address2: ' + ISNULL(@Address_Line_2, '') + CHAR(13) + CHAR(10) +
            'City, State Zip: ' + ISNULL(@City, '') + ', ' + ISNULL(@State, '') + ' ' + ISNULL(@Postal_Code, '') + CHAR(13) + CHAR(10) +
            'Country: ' + ISNULL(@Country, '');

        SET @AnswerSummary = 'How many people?: ' + CAST(@PartySize AS NVARCHAR);

        IF @Answers IS NOT NULL AND @Answers != '[]'
        BEGIN
            SELECT @FormID = Form_ID FROM Projects WHERE Project_ID = @Project_ID;

            IF @FormID IS NOT NULL
            BEGIN
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

                IF @FormAnswers != ''
                    SET @AnswerSummary = @AnswerSummary + '<br>' + @FormAnswers;
            END
        END

        -- Create Event_Participant
        DECLARE @EventParticipantID INT;
        DECLARE @ParticipationStatusID INT = 2;
        DECLARE @DefaultParticipantID INT = 1;  -- Default participant ID from Contact_ID = 2

        IF @Participant_ID IS NULL AND @Contact_ID IS NOT NULL
        BEGIN
            -- Try to get Participant_Record from the matched/provided Contact
            SELECT @Participant_ID = Participant_Record
            FROM Contacts
            WHERE Contact_ID = @Contact_ID;

            -- If Participant_Record is NULL or doesn't exist, use default Participant_ID
            -- This handles cases where contact exists but has no participant record
            IF @Participant_ID IS NULL
            BEGIN
                SET @Participant_ID = @DefaultParticipantID;
            END
            ELSE
            BEGIN
                -- Verify the Participant_ID actually exists in Participants table
                -- If not, fall back to default
                IF NOT EXISTS (SELECT 1 FROM Participants WHERE Participant_ID = @Participant_ID)
                BEGIN
                    SET @Participant_ID = @DefaultParticipantID;
                END
            END
        END

        -- Final validation
        IF @Participant_ID IS NULL
        BEGIN
            SET @Participant_ID = @DefaultParticipantID;
        END

        INSERT INTO Event_Participants (
            Event_ID,
            Participant_ID,
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
            @Participant_ID,
            @ParticipationStatusID,
            @PartySize,
            @NotesField,
            @AnswerSummary,
            1
        );

        SET @EventParticipantID = SCOPE_IDENTITY();

        -- Create Form_Response if needed
        DECLARE @FormResponseID INT;

        SELECT @FormID = Form_ID FROM Projects WHERE Project_ID = @Project_ID;

        IF @FormID IS NOT NULL AND @Answers IS NOT NULL AND @Answers != '[]'
        BEGIN
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
                1
            );

            SET @FormResponseID = SCOPE_IDENTITY();

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
                1
            FROM OPENJSON(@Answers)
            WHERE TRY_CAST(JSON_VALUE(value, '$.Question_ID') AS INT) != 0;
        END

        -- Generate Confirmation Code
        DECLARE @ConfirmationCode NVARCHAR(20);
        SET @ConfirmationCode = RIGHT('00000' + CAST(@Event_ID AS NVARCHAR), 5) + '-' +
                                RIGHT('0000' + CAST(ABS(CHECKSUM(NEWID()) % 10000) AS NVARCHAR), 4);

        -- Get Event Details for Confirmation
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

        -- Write Audit Logs
        IF EXISTS (SELECT 1 FROM @ToBeAudited)
        BEGIN
            EXEC dbo.util_createauditlogentries @ToBeAudited
        END

        COMMIT TRANSACTION;

        -- Return success
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
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;

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

PRINT 'Updated api_Custom_RSVP_Submit_JSON - All error responses now use JsonResult alias';
GO
