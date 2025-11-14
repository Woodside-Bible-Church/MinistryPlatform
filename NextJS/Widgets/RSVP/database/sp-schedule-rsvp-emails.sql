-- ===================================================================
-- Stored Procedure: api_Custom_Schedule_RSVP_Emails
-- ===================================================================
-- Schedules confirmation email + optional campaigns for an RSVP
-- Called automatically by api_Custom_RSVP_Submit_JSON after RSVP creation
-- MP's email processor automatically sends based on Start_Date + Action_Status_ID
-- ===================================================================

CREATE OR ALTER PROCEDURE api_Custom_Schedule_RSVP_Emails
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
    @Author_User_ID INT = 1 -- Default to system user
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @ErrorMessage NVARCHAR(4000);
    DECLARE @ErrorSeverity INT;
    DECLARE @ErrorState INT;

    BEGIN TRY
        -- ===================================================================
        -- STEP 1: Fetch Event and Project Configuration
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
        DECLARE @Confirmation_Template_ID INT = NULL;

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
            @Confirmation_Template_ID = pr.Confirmation_Template_ID
        FROM Events e
        INNER JOIN Project_RSVPs pr ON pr.Project_RSVP_ID = @Project_RSVP_ID
        LEFT JOIN Congregations c ON e.Congregation_ID = c.Congregation_ID
        LEFT JOIN Locations l ON c.Location_ID = l.Location_ID
        WHERE e.Event_ID = @Event_ID;

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
            SELECT @Answers_List = COALESCE(@Answers_List, '') +
                '<p style="margin: 8px 0;"><strong>' +
                JSON_VALUE(value, '$.Question_Text') +
                ':</strong> ' +
                JSON_VALUE(value, '$.Answer') +
                '</p>'
            FROM OPENJSON(@Answers_JSON);

            IF @Answers_List != ''
            BEGIN
                SET @Answers_List = '<div style="background: #f9f9f9; padding: 15px; border-radius: 4px; margin: 15px 0;">' +
                                   @Answers_List +
                                   '</div>';
            END
        END

        -- ===================================================================
        -- HELPER: Replace All Shortcodes in Text
        -- ===================================================================

        DECLARE @ShortcodeReplacer TABLE (
            Shortcode NVARCHAR(100),
            ReplaceValue NVARCHAR(MAX)
        );

        INSERT INTO @ShortcodeReplacer VALUES
            ('[First_Name]', @First_Name),
            ('[Last_Name]', @Last_Name),
            ('[Email_Address]', @Email_Address),
            ('[Phone_Number]', COALESCE(@Phone_Number, 'Not provided')),
            ('[Event_Title]', @Event_Title),
            ('[Event_Date]', @Event_Date),
            ('[Event_Time]', @Event_Time),
            ('[Event_Day]', @Event_Day),
            ('[Event_Month_Day]', @Event_Month_Day),
            ('[Event_Start_Date_ISO]', @Event_Start_Date_ISO),
            ('[Event_End_Date_ISO]', @Event_End_Date_ISO),
            ('[Campus_Name]', COALESCE(@Campus_Name, 'Our Church')),
            ('[Campus_Location]', COALESCE(@Campus_Location, '')),
            ('[Campus_Address]', COALESCE(@Campus_Address, '')),
            ('[Campus_City]', COALESCE(@Campus_City, '')),
            ('[Campus_State]', COALESCE(@Campus_State, '')),
            ('[Campus_Zip]', COALESCE(@Campus_Zip, '')),
            ('[Campus_Full_Address]', @Campus_Full_Address),
            ('[Google_Maps_URL]', @Google_Maps_URL),
            ('[Confirmation_Code]', @Confirmation_Code),
            ('[Party_Size]', CAST(@Party_Size AS NVARCHAR(10))),
            ('[Event_RSVP_ID]', CAST(@Event_RSVP_ID AS NVARCHAR(10))),
            ('[RSVP_Title]', @RSVP_Title),
            ('[RSVP_Description]', COALESCE(@RSVP_Description, '')),
            ('[Answers_List]', @Answers_List);

        -- ===================================================================
        -- STEP 3: Send Confirmation Email (Always, Immediate)
        -- ===================================================================

        IF @Confirmation_Template_ID IS NOT NULL
        BEGIN
            DECLARE @Conf_Subject NVARCHAR(256);
            DECLARE @Conf_Body NVARCHAR(MAX);
            DECLARE @Conf_From_Contact INT;
            DECLARE @Conf_Reply_To_Contact INT;

            -- Fetch template
            SELECT
                @Conf_Subject = Subject_Text,
                @Conf_Body = Body_Html,
                @Conf_From_Contact = From_Contact,
                @Conf_Reply_To_Contact = Reply_to_Contact
            FROM dp_Communication_Templates
            WHERE Communication_Template_ID = @Confirmation_Template_ID;

            -- Replace shortcodes
            SELECT @Conf_Subject = REPLACE(@Conf_Subject, Shortcode, ReplaceValue)
            FROM @ShortcodeReplacer;

            SELECT @Conf_Body = REPLACE(@Conf_Body, Shortcode, ReplaceValue)
            FROM @ShortcodeReplacer;

            -- Create Communication record (MP will send immediately because Start_Date = now)
            DECLARE @Conf_Communication_ID INT;
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
                @Conf_Subject,
                @Conf_Body,
                1,
                GETDATE(), -- Send immediately
                @Conf_From_Contact,
                @Conf_Reply_To_Contact,
                1, -- Status
                2, -- Email type
                1
            );

            SET @Conf_Communication_ID = SCOPE_IDENTITY();

            -- Create Communication_Message record (Action_Status_ID = NULL for immediate send)
            INSERT INTO dp_Communication_Messages (
                Communication_ID,
                [To],
                Action_Status_ID,
                Action_Status_Time
            )
            VALUES (
                @Conf_Communication_ID,
                @Email_Address,
                NULL, -- NULL = send immediately
                GETDATE()
            );

            -- Log it
            INSERT INTO RSVP_Email_Campaign_Log (
                Event_RSVP_ID,
                Campaign_ID,
                Communication_ID,
                Campaign_Type,
                Scheduled_Send_Date
            )
            VALUES (
                @Event_RSVP_ID,
                NULL, -- No campaign ID for confirmation
                @Conf_Communication_ID,
                'Confirmation',
                GETDATE()
            );

            PRINT 'Confirmation email scheduled for ' + @Email_Address;
        END
        ELSE
        BEGIN
            PRINT 'No confirmation template configured - skipping confirmation email';
        END

        -- ===================================================================
        -- STEP 4: Schedule Email Campaigns (Conditional, Based on Answers)
        -- ===================================================================

        DECLARE @CampaignID INT;
        DECLARE @CampaignName NVARCHAR(100);
        DECLARE @TemplateID INT;
        DECLARE @TimingType NVARCHAR(50);
        DECLARE @DaysOffset INT;
        DECLARE @SpecificDateTime DATETIME;
        DECLARE @SendDate DATETIME;

        -- Get all active campaigns for this project/campus
        DECLARE CampaignCursor CURSOR FOR
        SELECT
            Campaign_ID,
            Campaign_Name,
            Communication_Template_ID,
            Send_Timing_Type,
            Send_Days_Offset,
            Send_Specific_DateTime
        FROM RSVP_Email_Campaigns
        WHERE Project_RSVP_ID = @Project_RSVP_ID
          AND Is_Active = 1
          AND (Congregation_ID IS NULL OR Congregation_ID = @Congregation_ID)
        ORDER BY Display_Order;

        OPEN CampaignCursor;
        FETCH NEXT FROM CampaignCursor INTO @CampaignID, @CampaignName, @TemplateID, @TimingType, @DaysOffset, @SpecificDateTime;

        WHILE @@FETCH_STATUS = 0
        BEGIN
            -- Check if all conditions for this campaign are met
            DECLARE @ConditionsMet BIT = 1;

            -- If campaign has conditions, check them
            IF EXISTS (SELECT 1 FROM RSVP_Email_Campaign_Conditions WHERE Campaign_ID = @CampaignID)
            BEGIN
                DECLARE @ConditionID INT;
                DECLARE @QuestionID INT;
                DECLARE @ConditionType NVARCHAR(50);
                DECLARE @ConditionValue NVARCHAR(500);
                DECLARE @UserAnswer NVARCHAR(MAX);

                DECLARE ConditionCursor CURSOR FOR
                SELECT
                    Condition_ID,
                    Question_ID,
                    Condition_Type,
                    Condition_Value
                FROM RSVP_Email_Campaign_Conditions
                WHERE Campaign_ID = @CampaignID;

                OPEN ConditionCursor;
                FETCH NEXT FROM ConditionCursor INTO @ConditionID, @QuestionID, @ConditionType, @ConditionValue;

                WHILE @@FETCH_STATUS = 0 AND @ConditionsMet = 1
                BEGIN
                    -- Get user's answer from JSON
                    SET @UserAnswer = (
                        SELECT TOP 1 JSON_VALUE(value, '$.Answer')
                        FROM OPENJSON(@Answers_JSON)
                        WHERE JSON_VALUE(value, '$.Question_ID') = CAST(@QuestionID AS NVARCHAR(10))
                    );

                    -- Evaluate condition
                    IF @ConditionType = 'Equals' AND @UserAnswer != @ConditionValue SET @ConditionsMet = 0;
                    IF @ConditionType = 'Not_Equals' AND @UserAnswer = @ConditionValue SET @ConditionsMet = 0;
                    IF @ConditionType = 'Contains' AND CHARINDEX(@ConditionValue, @UserAnswer) = 0 SET @ConditionsMet = 0;
                    IF @ConditionType = 'Not_Contains' AND CHARINDEX(@ConditionValue, @UserAnswer) > 0 SET @ConditionsMet = 0;
                    IF @ConditionType = 'Greater_Than' AND TRY_CAST(@UserAnswer AS DECIMAL(18,2)) <= TRY_CAST(@ConditionValue AS DECIMAL(18,2)) SET @ConditionsMet = 0;
                    IF @ConditionType = 'Less_Than' AND TRY_CAST(@UserAnswer AS DECIMAL(18,2)) >= TRY_CAST(@ConditionValue AS DECIMAL(18,2)) SET @ConditionsMet = 0;
                    IF @ConditionType = 'Greater_Or_Equal' AND TRY_CAST(@UserAnswer AS DECIMAL(18,2)) < TRY_CAST(@ConditionValue AS DECIMAL(18,2)) SET @ConditionsMet = 0;
                    IF @ConditionType = 'Less_Or_Equal' AND TRY_CAST(@UserAnswer AS DECIMAL(18,2)) > TRY_CAST(@ConditionValue AS DECIMAL(18,2)) SET @ConditionsMet = 0;
                    IF @ConditionType = 'Is_True' AND (@UserAnswer IS NULL OR @UserAnswer NOT IN ('Yes', 'True', '1')) SET @ConditionsMet = 0;
                    IF @ConditionType = 'Is_False' AND (@UserAnswer IS NULL OR @UserAnswer NOT IN ('No', 'False', '0')) SET @ConditionsMet = 0;
                    IF @ConditionType = 'Is_Null' AND @UserAnswer IS NOT NULL SET @ConditionsMet = 0;
                    IF @ConditionType = 'Is_Not_Null' AND @UserAnswer IS NULL SET @ConditionsMet = 0;

                    FETCH NEXT FROM ConditionCursor INTO @ConditionID, @QuestionID, @ConditionType, @ConditionValue;
                END

                CLOSE ConditionCursor;
                DEALLOCATE ConditionCursor;
            END

            -- If conditions are met, schedule the campaign
            IF @ConditionsMet = 1
            BEGIN
                -- Calculate send date based on timing type
                SET @SendDate = CASE
                    WHEN @TimingType = 'Days_Before_Event' THEN DATEADD(DAY, -@DaysOffset, @Event_Start_Date)
                    WHEN @TimingType = 'Days_After_Event' THEN DATEADD(DAY, @DaysOffset, @Event_Start_Date)
                    WHEN @TimingType = 'Specific_DateTime' THEN @SpecificDateTime
                    ELSE GETDATE()
                END;

                -- Only schedule if send date is in the future
                IF @SendDate > GETDATE()
                BEGIN
                    DECLARE @Camp_Subject NVARCHAR(256);
                    DECLARE @Camp_Body NVARCHAR(MAX);
                    DECLARE @Camp_From_Contact INT;
                    DECLARE @Camp_Reply_To_Contact INT;

                    -- Fetch template
                    SELECT
                        @Camp_Subject = Subject_Text,
                        @Camp_Body = Body_Html,
                        @Camp_From_Contact = From_Contact,
                        @Camp_Reply_To_Contact = Reply_to_Contact
                    FROM dp_Communication_Templates
                    WHERE Communication_Template_ID = @TemplateID;

                    -- Replace shortcodes
                    SELECT @Camp_Subject = REPLACE(@Camp_Subject, Shortcode, ReplaceValue)
                    FROM @ShortcodeReplacer;

                    SELECT @Camp_Body = REPLACE(@Camp_Body, Shortcode, ReplaceValue)
                    FROM @ShortcodeReplacer;

                    -- Create Communication record with future send date
                    DECLARE @Camp_Communication_ID INT;
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
                        @Camp_Subject,
                        @Camp_Body,
                        1,
                        @SendDate, -- Scheduled send date
                        @Camp_From_Contact,
                        @Camp_Reply_To_Contact,
                        1,
                        2,
                        1
                    );

                    SET @Camp_Communication_ID = SCOPE_IDENTITY();

                    -- Get "Ready to Send" status ID
                    DECLARE @Ready_To_Send_Status_ID INT;
                    SELECT @Ready_To_Send_Status_ID = Action_Status_ID
                    FROM dp_Action_Statuses
                    WHERE Action_Status = 'Ready to Send';

                    -- Create Communication_Message record
                    INSERT INTO dp_Communication_Messages (
                        Communication_ID,
                        [To],
                        Action_Status_ID,
                        Action_Status_Time
                    )
                    VALUES (
                        @Camp_Communication_ID,
                        @Email_Address,
                        @Ready_To_Send_Status_ID,
                        @SendDate
                    );

                    -- Log it
                    INSERT INTO RSVP_Email_Campaign_Log (
                        Event_RSVP_ID,
                        Campaign_ID,
                        Communication_ID,
                        Campaign_Type,
                        Scheduled_Send_Date
                    )
                    VALUES (
                        @Event_RSVP_ID,
                        @CampaignID,
                        @Camp_Communication_ID,
                        'Campaign',
                        @SendDate
                    );

                    PRINT 'Campaign "' + @CampaignName + '" scheduled for ' + CONVERT(NVARCHAR(50), @SendDate, 120);
                END
                ELSE
                BEGIN
                    PRINT 'Campaign "' + @CampaignName + '" send date is in the past - skipping';
                END
            END
            ELSE
            BEGIN
                PRINT 'Campaign "' + @CampaignName + '" conditions not met - skipping';
            END

            FETCH NEXT FROM CampaignCursor INTO @CampaignID, @CampaignName, @TemplateID, @TimingType, @DaysOffset, @SpecificDateTime;
        END

        CLOSE CampaignCursor;
        DEALLOCATE CampaignCursor;

    END TRY
    BEGIN CATCH
        SET @ErrorMessage = ERROR_MESSAGE();
        SET @ErrorSeverity = ERROR_SEVERITY();
        SET @ErrorState = ERROR_STATE();

        PRINT 'Error scheduling RSVP emails: ' + @ErrorMessage;
        -- Don't throw - we don't want email failure to break RSVP submission
    END CATCH
END
GO

-- Grant permissions
GRANT EXECUTE ON api_Custom_Schedule_RSVP_Emails TO [Public];
GO

PRINT 'Stored procedure api_Custom_Schedule_RSVP_Emails created successfully';
PRINT '';
PRINT 'NEXT STEP: Update api_Custom_RSVP_Submit_JSON to call this procedure after RSVP creation';
GO
