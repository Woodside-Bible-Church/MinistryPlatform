-- ===================================================================
-- Stored Procedure: api_Custom_Send_RSVP_Confirmation_Email
-- ===================================================================
-- Sends confirmation and/or reminder emails for RSVP submissions
-- Called automatically by api_Custom_RSVP_Submit_JSON after RSVP creation
-- ===================================================================

CREATE OR ALTER PROCEDURE api_Custom_Send_RSVP_Confirmation_Email
    @Event_RSVP_ID INT,
    @Event_ID INT,
    @Congregation_ID INT,
    @Project_RSVP_ID INT,
    @First_Name NVARCHAR(50),
    @Last_Name NVARCHAR(50),
    @Email_Address NVARCHAR(100),
    @Phone_Number NVARCHAR(25) = NULL,
    @Confirmation_Code NVARCHAR(50),
    @Party_Size INT,
    @Answers_JSON NVARCHAR(MAX) = NULL, -- JSON array of question/answer pairs
    @Author_User_ID INT = 1 -- Default to system user, or pass in authenticated user
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @ErrorMessage NVARCHAR(4000);
    DECLARE @ErrorSeverity INT;
    DECLARE @ErrorState INT;

    BEGIN TRY
        -- ===================================================================
        -- STEP 1: Fetch Email Configuration and Event Details
        -- ===================================================================

        DECLARE @Event_Title NVARCHAR(100);
        DECLARE @Event_Start_Date DATETIME;
        DECLARE @Event_End_Date DATETIME;
        DECLARE @Campus_Name NVARCHAR(100);
        DECLARE @Campus_Location NVARCHAR(255);
        DECLARE @Campus_Address NVARCHAR(255);
        DECLARE @Campus_City NVARCHAR(50);
        DECLARE @Campus_State NVARCHAR(20);
        DECLARE @Campus_Zip NVARCHAR(10);
        DECLARE @RSVP_Title NVARCHAR(255);
        DECLARE @RSVP_Description NVARCHAR(MAX);

        -- Template IDs
        DECLARE @Confirmation_Template_ID INT = NULL;
        DECLARE @Reminder_Template_ID INT = NULL;
        DECLARE @Reminder_Days_Before INT = NULL;

        -- Fetch event and configuration data
        SELECT TOP 1
            @Event_Title = e.Event_Title,
            @Event_Start_Date = e.Event_Start_Date,
            @Event_End_Date = e.Event_End_Date,
            @Campus_Name = c.Congregation_Name,
            @Campus_Location = l.Location_Name,
            @Campus_Address = l.Address_Line_1,
            @Campus_City = l.City,
            @Campus_State = l.[State/Region],
            @Campus_Zip = l.Postal_Code,
            @RSVP_Title = pr.RSVP_Title,
            @RSVP_Description = pr.RSVP_Description,
            -- Template hierarchy: Campus-specific > Project default > NULL
            @Confirmation_Template_ID = COALESCE(c.Confirmation_Email_Template_ID, pr.Default_Confirmation_Template_ID),
            @Reminder_Template_ID = COALESCE(c.Reminder_Email_Template_ID, pr.Default_Reminder_Template_ID),
            @Reminder_Days_Before = pr.Reminder_Days_Before
        FROM Events e
        INNER JOIN Project_RSVPs pr ON e.Event_ID = @Event_ID
        LEFT JOIN Congregations c ON e.Congregation_ID = c.Congregation_ID
        LEFT JOIN Locations l ON c.Location_ID = l.Location_ID
        WHERE e.Event_ID = @Event_ID
          AND pr.Project_RSVP_ID = @Project_RSVP_ID;

        -- Early exit if no templates configured
        IF @Confirmation_Template_ID IS NULL AND @Reminder_Template_ID IS NULL
        BEGIN
            PRINT 'No email templates configured for this RSVP - skipping email send';
            RETURN;
        END

        -- ===================================================================
        -- STEP 2: Build Shortcode Replacement Data
        -- ===================================================================

        DECLARE @Campus_Full_Address NVARCHAR(500);
        SET @Campus_Full_Address = CONCAT(
            COALESCE(@Campus_Address + ', ', ''),
            COALESCE(@Campus_City + ', ', ''),
            COALESCE(@Campus_State + ' ', ''),
            COALESCE(@Campus_Zip, '')
        );

        DECLARE @Google_Maps_URL NVARCHAR(500);
        SET @Google_Maps_URL = CONCAT(
            'https://www.google.com/maps/search/?api=1&query=',
            REPLACE(@Campus_Full_Address, ' ', '+')
        );

        -- Format dates for shortcodes
        DECLARE @Event_Date NVARCHAR(100) = FORMAT(@Event_Start_Date, 'dddd, MMMM d', 'en-US');
        DECLARE @Event_Time NVARCHAR(50) = FORMAT(@Event_Start_Date, 'h:mm tt', 'en-US');
        DECLARE @Event_Day NVARCHAR(20) = FORMAT(@Event_Start_Date, 'dddd', 'en-US');
        DECLARE @Event_Month_Day NVARCHAR(50) = FORMAT(@Event_Start_Date, 'MMMM d', 'en-US');
        DECLARE @Event_Start_Date_ISO NVARCHAR(50) = CONVERT(NVARCHAR(50), @Event_Start_Date, 127);
        DECLARE @Event_End_Date_ISO NVARCHAR(50) = CONVERT(NVARCHAR(50), @Event_End_Date, 127);

        -- Build Answers_List HTML from JSON
        DECLARE @Answers_List NVARCHAR(MAX) = '';
        IF @Answers_JSON IS NOT NULL AND @Answers_JSON != ''
        BEGIN
            -- Parse JSON and build HTML list of question/answer pairs
            -- Expected JSON format: [{"Question_Text":"...", "Answer":"..."},...]
            SELECT @Answers_List = COALESCE(@Answers_List, '') +
                '<p style="margin: 8px 0;"><strong>' +
                Question_Text +
                ':</strong> ' +
                Answer +
                '</p>'
            FROM OPENJSON(@Answers_JSON)
            WITH (
                Question_Text NVARCHAR(500) '$.Question_Text',
                Answer NVARCHAR(MAX) '$.Answer'
            );

            IF @Answers_List != ''
            BEGIN
                SET @Answers_List = '<div style="background: #f9f9f9; padding: 15px; border-radius: 4px; margin: 15px 0;">' +
                                   @Answers_List +
                                   '</div>';
            END
        END

        -- ===================================================================
        -- STEP 3: Send Confirmation Email (Immediate)
        -- ===================================================================

        IF @Confirmation_Template_ID IS NOT NULL
        BEGIN
            DECLARE @Confirmation_Subject NVARCHAR(256);
            DECLARE @Confirmation_Body NVARCHAR(MAX);
            DECLARE @Confirmation_From_Contact INT;
            DECLARE @Confirmation_Reply_To_Contact INT;

            -- Fetch template
            SELECT
                @Confirmation_Subject = Subject_Text,
                @Confirmation_Body = Body_Html,
                @Confirmation_From_Contact = From_Contact,
                @Confirmation_Reply_To_Contact = Reply_to_Contact
            FROM dp_Communication_Templates
            WHERE Communication_Template_ID = @Confirmation_Template_ID;

            -- Replace shortcodes in subject
            SET @Confirmation_Subject = REPLACE(@Confirmation_Subject, '[First_Name]', @First_Name);
            SET @Confirmation_Subject = REPLACE(@Confirmation_Subject, '[Last_Name]', @Last_Name);
            SET @Confirmation_Subject = REPLACE(@Confirmation_Subject, '[Event_Title]', @Event_Title);
            SET @Confirmation_Subject = REPLACE(@Confirmation_Subject, '[Campus_Name]', COALESCE(@Campus_Name, 'Our Church'));
            SET @Confirmation_Subject = REPLACE(@Confirmation_Subject, '[Event_Date]', @Event_Date);
            SET @Confirmation_Subject = REPLACE(@Confirmation_Subject, '[Event_Time]', @Event_Time);

            -- Replace shortcodes in body
            SET @Confirmation_Body = REPLACE(@Confirmation_Body, '[First_Name]', @First_Name);
            SET @Confirmation_Body = REPLACE(@Confirmation_Body, '[Last_Name]', @Last_Name);
            SET @Confirmation_Body = REPLACE(@Confirmation_Body, '[Email_Address]', @Email_Address);
            SET @Confirmation_Body = REPLACE(@Confirmation_Body, '[Phone_Number]', COALESCE(@Phone_Number, 'Not provided'));
            SET @Confirmation_Body = REPLACE(@Confirmation_Body, '[Event_Title]', @Event_Title);
            SET @Confirmation_Body = REPLACE(@Confirmation_Body, '[Event_Date]', @Event_Date);
            SET @Confirmation_Body = REPLACE(@Confirmation_Body, '[Event_Time]', @Event_Time);
            SET @Confirmation_Body = REPLACE(@Confirmation_Body, '[Event_Day]', @Event_Day);
            SET @Confirmation_Body = REPLACE(@Confirmation_Body, '[Event_Month_Day]', @Event_Month_Day);
            SET @Confirmation_Body = REPLACE(@Confirmation_Body, '[Event_Start_Date_ISO]', @Event_Start_Date_ISO);
            SET @Confirmation_Body = REPLACE(@Confirmation_Body, '[Event_End_Date_ISO]', @Event_End_Date_ISO);
            SET @Confirmation_Body = REPLACE(@Confirmation_Body, '[Campus_Name]', COALESCE(@Campus_Name, 'Our Church'));
            SET @Confirmation_Body = REPLACE(@Confirmation_Body, '[Campus_Location]', COALESCE(@Campus_Location, ''));
            SET @Confirmation_Body = REPLACE(@Confirmation_Body, '[Campus_Address]', COALESCE(@Campus_Address, ''));
            SET @Confirmation_Body = REPLACE(@Confirmation_Body, '[Campus_City]', COALESCE(@Campus_City, ''));
            SET @Confirmation_Body = REPLACE(@Confirmation_Body, '[Campus_State]', COALESCE(@Campus_State, ''));
            SET @Confirmation_Body = REPLACE(@Confirmation_Body, '[Campus_Zip]', COALESCE(@Campus_Zip, ''));
            SET @Confirmation_Body = REPLACE(@Confirmation_Body, '[Campus_Full_Address]', @Campus_Full_Address);
            SET @Confirmation_Body = REPLACE(@Confirmation_Body, '[Google_Maps_URL]', @Google_Maps_URL);
            SET @Confirmation_Body = REPLACE(@Confirmation_Body, '[Confirmation_Code]', @Confirmation_Code);
            SET @Confirmation_Body = REPLACE(@Confirmation_Body, '[Party_Size]', CAST(@Party_Size AS NVARCHAR(10)));
            SET @Confirmation_Body = REPLACE(@Confirmation_Body, '[Event_RSVP_ID]', CAST(@Event_RSVP_ID AS NVARCHAR(10)));
            SET @Confirmation_Body = REPLACE(@Confirmation_Body, '[RSVP_Title]', @RSVP_Title);
            SET @Confirmation_Body = REPLACE(@Confirmation_Body, '[RSVP_Description]', COALESCE(@RSVP_Description, ''));
            SET @Confirmation_Body = REPLACE(@Confirmation_Body, '[Answers_List]', @Answers_List);

            -- Create Communication record
            DECLARE @Confirmation_Communication_ID INT;
            INSERT INTO dp_Communications (
                Author_User_ID,
                Subject,
                Body,
                Domain_ID,
                Start_Date,
                From_Contact,
                Reply_to_Contact,
                Communication_Status_ID,
                Communication_Type_ID,
                Active
            )
            VALUES (
                @Author_User_ID,
                @Confirmation_Subject,
                @Confirmation_Body,
                1, -- Domain_ID
                GETDATE(), -- Send immediately
                @Confirmation_From_Contact,
                @Confirmation_Reply_To_Contact,
                1, -- Pending/Draft status
                2, -- Email type (verify this ID in your system)
                1 -- Active
            );

            SET @Confirmation_Communication_ID = SCOPE_IDENTITY();

            -- Create Communication_Message record
            INSERT INTO dp_Communication_Messages (
                Communication_ID,
                [To],
                Action_Status_ID,
                Action_Status_Time
            )
            VALUES (
                @Confirmation_Communication_ID,
                @Email_Address,
                NULL, -- NULL = send immediately via /messages API
                GETDATE()
            );

            PRINT 'Confirmation email queued for ' + @Email_Address;
        END

        -- ===================================================================
        -- STEP 4: Send Reminder Email (Scheduled)
        -- ===================================================================

        IF @Reminder_Template_ID IS NOT NULL AND @Reminder_Days_Before IS NOT NULL
        BEGIN
            DECLARE @Reminder_Send_Date DATETIME;
            SET @Reminder_Send_Date = DATEADD(DAY, -@Reminder_Days_Before, @Event_Start_Date);

            -- Only schedule if send date is in the future
            IF @Reminder_Send_Date > GETDATE()
            BEGIN
                DECLARE @Reminder_Subject NVARCHAR(256);
                DECLARE @Reminder_Body NVARCHAR(MAX);
                DECLARE @Reminder_From_Contact INT;
                DECLARE @Reminder_Reply_To_Contact INT;

                -- Fetch template
                SELECT
                    @Reminder_Subject = Subject_Text,
                    @Reminder_Body = Body_Html,
                    @Reminder_From_Contact = From_Contact,
                    @Reminder_Reply_To_Contact = Reply_to_Contact
                FROM dp_Communication_Templates
                WHERE Communication_Template_ID = @Reminder_Template_ID;

                -- Replace shortcodes (same as confirmation)
                SET @Reminder_Subject = REPLACE(@Reminder_Subject, '[First_Name]', @First_Name);
                SET @Reminder_Subject = REPLACE(@Reminder_Subject, '[Last_Name]', @Last_Name);
                SET @Reminder_Subject = REPLACE(@Reminder_Subject, '[Event_Title]', @Event_Title);
                SET @Reminder_Subject = REPLACE(@Reminder_Subject, '[Campus_Name]', COALESCE(@Campus_Name, 'Our Church'));
                SET @Reminder_Subject = REPLACE(@Reminder_Subject, '[Event_Date]', @Event_Date);
                SET @Reminder_Subject = REPLACE(@Reminder_Subject, '[Event_Time]', @Event_Time);

                SET @Reminder_Body = REPLACE(@Reminder_Body, '[First_Name]', @First_Name);
                SET @Reminder_Body = REPLACE(@Reminder_Body, '[Last_Name]', @Last_Name);
                SET @Reminder_Body = REPLACE(@Reminder_Body, '[Email_Address]', @Email_Address);
                SET @Reminder_Body = REPLACE(@Reminder_Body, '[Phone_Number]', COALESCE(@Phone_Number, 'Not provided'));
                SET @Reminder_Body = REPLACE(@Reminder_Body, '[Event_Title]', @Event_Title);
                SET @Reminder_Body = REPLACE(@Reminder_Body, '[Event_Date]', @Event_Date);
                SET @Reminder_Body = REPLACE(@Reminder_Body, '[Event_Time]', @Event_Time);
                SET @Reminder_Body = REPLACE(@Reminder_Body, '[Event_Day]', @Event_Day);
                SET @Reminder_Body = REPLACE(@Reminder_Body, '[Event_Month_Day]', @Event_Month_Day);
                SET @Reminder_Body = REPLACE(@Reminder_Body, '[Event_Start_Date_ISO]', @Event_Start_Date_ISO);
                SET @Reminder_Body = REPLACE(@Reminder_Body, '[Event_End_Date_ISO]', @Event_End_Date_ISO);
                SET @Reminder_Body = REPLACE(@Reminder_Body, '[Campus_Name]', COALESCE(@Campus_Name, 'Our Church'));
                SET @Reminder_Body = REPLACE(@Reminder_Body, '[Campus_Location]', COALESCE(@Campus_Location, ''));
                SET @Reminder_Body = REPLACE(@Reminder_Body, '[Campus_Address]', COALESCE(@Campus_Address, ''));
                SET @Reminder_Body = REPLACE(@Reminder_Body, '[Campus_City]', COALESCE(@Campus_City, ''));
                SET @Reminder_Body = REPLACE(@Reminder_Body, '[Campus_State]', COALESCE(@Campus_State, ''));
                SET @Reminder_Body = REPLACE(@Reminder_Body, '[Campus_Zip]', COALESCE(@Campus_Zip, ''));
                SET @Reminder_Body = REPLACE(@Reminder_Body, '[Campus_Full_Address]', @Campus_Full_Address);
                SET @Reminder_Body = REPLACE(@Reminder_Body, '[Google_Maps_URL]', @Google_Maps_URL);
                SET @Reminder_Body = REPLACE(@Reminder_Body, '[Confirmation_Code]', @Confirmation_Code);
                SET @Reminder_Body = REPLACE(@Reminder_Body, '[Party_Size]', CAST(@Party_Size AS NVARCHAR(10)));
                SET @Reminder_Body = REPLACE(@Reminder_Body, '[Event_RSVP_ID]', CAST(@Event_RSVP_ID AS NVARCHAR(10)));
                SET @Reminder_Body = REPLACE(@Reminder_Body, '[RSVP_Title]', @RSVP_Title);
                SET @Reminder_Body = REPLACE(@Reminder_Body, '[RSVP_Description]', COALESCE(@RSVP_Description, ''));
                SET @Reminder_Body = REPLACE(@Reminder_Body, '[Answers_List]', @Answers_List);

                -- Create Communication record with future start date
                DECLARE @Reminder_Communication_ID INT;
                INSERT INTO dp_Communications (
                    Author_User_ID,
                    Subject,
                    Body,
                    Domain_ID,
                    Start_Date,
                    From_Contact,
                    Reply_to_Contact,
                    Communication_Status_ID,
                    Communication_Type_ID,
                    Active
                )
                VALUES (
                    @Author_User_ID,
                    @Reminder_Subject,
                    @Reminder_Body,
                    1, -- Domain_ID
                    @Reminder_Send_Date, -- Scheduled send date
                    @Reminder_From_Contact,
                    @Reminder_Reply_To_Contact,
                    1, -- Pending/Draft status
                    2, -- Email type
                    1 -- Active
                );

                SET @Reminder_Communication_ID = SCOPE_IDENTITY();

                -- Create Communication_Message record with "Ready to Send" status
                DECLARE @Ready_To_Send_Status_ID INT;
                SELECT @Ready_To_Send_Status_ID = Action_Status_ID
                FROM dp_Action_Statuses
                WHERE Action_Status = 'Ready to Send';

                INSERT INTO dp_Communication_Messages (
                    Communication_ID,
                    [To],
                    Action_Status_ID,
                    Action_Status_Time
                )
                VALUES (
                    @Reminder_Communication_ID,
                    @Email_Address,
                    @Ready_To_Send_Status_ID, -- "Ready to Send" for scheduled messages
                    @Reminder_Send_Date
                );

                PRINT 'Reminder email scheduled for ' + CONVERT(NVARCHAR(50), @Reminder_Send_Date, 120);
            END
            ELSE
            BEGIN
                PRINT 'Reminder send date is in the past - skipping reminder email';
            END
        END

    END TRY
    BEGIN CATCH
        SET @ErrorMessage = ERROR_MESSAGE();
        SET @ErrorSeverity = ERROR_SEVERITY();
        SET @ErrorState = ERROR_STATE();

        PRINT 'Error sending RSVP confirmation email: ' + @ErrorMessage;
        -- Don't throw error - we don't want email failure to break RSVP submission
        -- Just log it and continue
    END CATCH
END
GO

-- Grant execute permissions
GRANT EXECUTE ON api_Custom_Send_RSVP_Confirmation_Email TO [Public];
GO

PRINT 'Stored procedure api_Custom_Send_RSVP_Confirmation_Email created successfully';
PRINT '';
PRINT 'NEXT STEP: Update api_Custom_RSVP_Submit_JSON to call this procedure after RSVP creation';
PRINT 'Example: EXEC api_Custom_Send_RSVP_Confirmation_Email @Event_RSVP_ID, @Event_ID, ...';
GO
