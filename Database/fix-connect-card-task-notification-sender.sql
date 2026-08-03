/****************************************************************************************
  fix-connect-card-task-notification-sender.sql

  PROBLEM
  Automated MinistryPlatform notifications were going out From/Reply-To
  Colton Wirgau <coltonwirgau@woodsidebible.org>. Staff receiving them replied to
  Colton (including out-of-office auto-replies), believing a human had assigned
  them the task.

  ROOT CAUSE
  Nothing in the stored procedures hard-codes a person. Both custom "backdoor"
  notification procs resolve the sender entirely from the communication template:

    util_CreateMessageKPM:
      '"' + From_C.Display_Name + '" <' + From_C.Email_Address + '>'   -- CT.From_Contact
      '"' + Reply_C.Display_Name + '" <' + Reply_C.Email_Address + '>' -- CT.Reply_to_Contact

  The templates simply had Colton's Contact_ID (228155) in those fields.

  Likewise service_church_specific_connect_card_task_add sets
  dp_Tasks.Author_User_ID = CT.Template_User, and 13 of the 16 campus connect card
  templates had Template_User = 201 (Colton), making him the apparent author of
  every connect card task inside the MP UI.

  FIX
  Repoint the templates at the neutral house account already used by MP's own
  built-in task digest (config SERVICES/TaskNotificationTemplateID = template 34):

    Contact 7 "Woodside Admin" <no_reply@woodsidebible.org>
    User    5 "churchadmin"            (paired to Contact 7 via User_Account)

  User 5 is already util_CreateMessageKPM's @DefaultMessageAuthorUserID, so this
  aligns the templates with the code's own fallback.

  NOTES
  - Idempotent. Every UPDATE is guarded on the current (old) value, so re-running
    is a no-op.
  - Transactional, with a pre-flight check that the neutral account is valid.
  - Writes dp_Audit_Log + dp_Audit_Detail rows so the change is traceable in MP.
  - Does NOT rewrite history. The 2,651 existing connect card tasks already
    authored by Colton keep their Author_User_ID (only 48 are still open).
  - Troy / Troy Espanol templates keep Joe Crabb (User 68 / Contact 232335) as
    Template_User and From_Contact. That was a deliberate customization; only the
    stray Reply-To pointing at Colton is corrected, by matching it to From.

  See also: SECTION 3, which fixes an identical defect on a sibling notification
  ("One or more people were added to your group."). Delete that section if you
  only want the connect card fix.
****************************************************************************************/

SET NOCOUNT ON;
SET XACT_ABORT ON;

DECLARE @NeutralContact INT = 7;    -- Woodside Admin <no_reply@woodsidebible.org>
DECLARE @NeutralUser    INT = 5;    -- churchadmin
DECLARE @OldContact     INT = 228155; -- Wirgau, Colton
DECLARE @OldUser        INT = 201;    -- coltonwirgau@woodsidebible.org

DECLARE @TaskAssignedTemplate  INT = 16305; -- "Team Task Assigned To You (custom backdoor notification)"
DECLARE @GroupAddedTemplate    INT = 17750; -- "One or more people added to your group (backdoor routine)"

DECLARE @AuditUserID   INT = 201;
DECLARE @AuditUserName NVARCHAR(254) = 'coltonwirgau@woodsidebible.org';
DECLARE @Now DATETIME = (SELECT dbo.dp_ToLocalTime(GETUTCDATE(), Time_Zone) FROM dp_Domains WHERE Domain_ID = 1);

/*--------------------------------------------------------------------------------------
  PRE-FLIGHT: the neutral account must be usable, or the notification silently breaks.
  util_CreateMessageKPM INNER JOINs Contacts on From_Contact/Reply_to_Contact, and
  service_church_specific_connect_card_task_add INNER JOINs dp_Users on Template_User.
  A dangling FK there means "no email" / "no task created" with no error.
--------------------------------------------------------------------------------------*/
IF NOT EXISTS (SELECT 1 FROM Contacts WHERE Contact_ID = @NeutralContact AND Email_Address IS NOT NULL)
BEGIN
    RAISERROR('Aborting: neutral Contact %d is missing or has no Email_Address.', 16, 1, @NeutralContact);
    RETURN;
END

IF NOT EXISTS (SELECT 1 FROM dp_Users WHERE User_ID = @NeutralUser)
BEGIN
    RAISERROR('Aborting: neutral User %d does not exist in dp_Users.', 16, 1, @NeutralUser);
    RETURN;
END

/*--------------------------------------------------------------------------------------
  BEFORE SNAPSHOT
--------------------------------------------------------------------------------------*/
DECLARE @ConnectCardTemplates TABLE (Communication_Template_ID INT PRIMARY KEY);
INSERT INTO @ConnectCardTemplates
SELECT DISTINCT Connect_Task_Template
FROM Congregations
WHERE Connect_Task_Template IS NOT NULL;

SELECT '=== BEFORE ===' AS Stage,
       CT.Communication_Template_ID, CT.Template_Name,
       CT.Template_User, TU.User_Name AS Template_User_Name,
       CT.From_Contact,  FC.Email_Address AS From_Email,
       CT.Reply_To_Contact, RC.Email_Address AS Reply_Email
FROM dp_Communication_Templates CT
LEFT JOIN dp_Users TU ON TU.User_ID = CT.Template_User
LEFT JOIN Contacts FC ON FC.Contact_ID = CT.From_Contact
LEFT JOIN Contacts RC ON RC.Contact_ID = CT.Reply_To_Contact
WHERE CT.Communication_Template_ID IN (SELECT Communication_Template_ID FROM @ConnectCardTemplates)
   OR CT.Communication_Template_ID IN (@TaskAssignedTemplate, @GroupAddedTemplate)
ORDER BY CT.Communication_Template_ID;

/*--------------------------------------------------------------------------------------
  APPLY
--------------------------------------------------------------------------------------*/
DECLARE @Changes TABLE (
    Communication_Template_ID INT,
    Field_Name  NVARCHAR(50),
    Previous_ID INT,
    New_ID      INT
);

BEGIN TRANSACTION;

-- SECTION 1: the notification that actually emails staff.
-- Subject: "One or more team tasks were assigned to you."
-- Sent by service_church_specific_notify_user_of_assigned_task (every 15 min)
-- via util_CreateMessageKPM. This is the source of the replies.
UPDATE CT
SET From_Contact = @NeutralContact
OUTPUT INSERTED.Communication_Template_ID, CAST('From_Contact' AS NVARCHAR(50)),
       DELETED.From_Contact, INSERTED.From_Contact
INTO @Changes
FROM dp_Communication_Templates CT
WHERE CT.Communication_Template_ID = @TaskAssignedTemplate
  AND CT.From_Contact = @OldContact;

UPDATE CT
SET Reply_To_Contact = @NeutralContact
OUTPUT INSERTED.Communication_Template_ID, CAST('Reply_To_Contact' AS NVARCHAR(50)),
       DELETED.Reply_To_Contact, INSERTED.Reply_To_Contact
INTO @Changes
FROM dp_Communication_Templates CT
WHERE CT.Communication_Template_ID = @TaskAssignedTemplate
  AND CT.Reply_To_Contact = @OldContact;

-- SECTION 2: campus connect card task templates.
-- These do not send email; Template_User becomes dp_Tasks.Author_User_ID, which is
-- why Colton looks like the author of every connect card task in the MP UI.
UPDATE CT
SET Template_User = @NeutralUser
OUTPUT INSERTED.Communication_Template_ID, CAST('Template_User' AS NVARCHAR(50)),
       DELETED.Template_User, INSERTED.Template_User
INTO @Changes
FROM dp_Communication_Templates CT
WHERE CT.Communication_Template_ID IN (SELECT Communication_Template_ID FROM @ConnectCardTemplates)
  AND CT.Template_User = @OldUser;

UPDATE CT
SET From_Contact = @NeutralContact
OUTPUT INSERTED.Communication_Template_ID, CAST('From_Contact' AS NVARCHAR(50)),
       DELETED.From_Contact, INSERTED.From_Contact
INTO @Changes
FROM dp_Communication_Templates CT
WHERE CT.Communication_Template_ID IN (SELECT Communication_Template_ID FROM @ConnectCardTemplates)
  AND CT.From_Contact = @OldContact;

-- Reply-To follows From, which clears Colton off the Troy templates without
-- disturbing Joe Crabb as their sender.
UPDATE CT
SET Reply_To_Contact = CT.From_Contact
OUTPUT INSERTED.Communication_Template_ID, CAST('Reply_To_Contact' AS NVARCHAR(50)),
       DELETED.Reply_To_Contact, INSERTED.Reply_To_Contact
INTO @Changes
FROM dp_Communication_Templates CT
WHERE CT.Communication_Template_ID IN (SELECT Communication_Template_ID FROM @ConnectCardTemplates)
  AND CT.Reply_To_Contact = @OldContact
  AND CT.From_Contact <> @OldContact;

-- SECTION 3: sibling defect, same pattern, different notification.
-- Subject: "One or more people were added to your group."
-- Sent by service_church_specific_group_participant_ep_fix via util_CreateMessageKPM.
-- Also currently fronted by Colton. Remove this section to leave it alone.
UPDATE CT
SET From_Contact = @NeutralContact
OUTPUT INSERTED.Communication_Template_ID, CAST('From_Contact' AS NVARCHAR(50)),
       DELETED.From_Contact, INSERTED.From_Contact
INTO @Changes
FROM dp_Communication_Templates CT
WHERE CT.Communication_Template_ID = @GroupAddedTemplate
  AND CT.From_Contact = @OldContact;

UPDATE CT
SET Reply_To_Contact = @NeutralContact
OUTPUT INSERTED.Communication_Template_ID, CAST('Reply_To_Contact' AS NVARCHAR(50)),
       DELETED.Reply_To_Contact, INSERTED.Reply_To_Contact
INTO @Changes
FROM dp_Communication_Templates CT
WHERE CT.Communication_Template_ID = @GroupAddedTemplate
  AND CT.Reply_To_Contact = @OldContact;

/*--------------------------------------------------------------------------------------
  AUDIT LOG
--------------------------------------------------------------------------------------*/
DECLARE @AuditItems TABLE (Audit_Item_ID INT, Record_ID INT);

INSERT INTO dp_Audit_Log (Table_Name, Record_ID, Audit_Description, User_Name, User_ID, Date_Time)
OUTPUT INSERTED.Audit_Item_ID, INSERTED.Record_ID INTO @AuditItems
SELECT DISTINCT 'dp_Communication_Templates', C.Communication_Template_ID, 'Updated',
       @AuditUserName, @AuditUserID, @Now
FROM @Changes C;

INSERT INTO dp_Audit_Detail (Audit_Item_ID, Field_Name, Field_Label, Previous_Value, New_Value, Previous_ID, New_ID)
SELECT A.Audit_Item_ID,
       C.Field_Name,
       C.Field_Name,
       CASE WHEN C.Field_Name = 'Template_User' THEN PU.User_Name ELSE PC.Display_Name END,
       CASE WHEN C.Field_Name = 'Template_User' THEN NU.User_Name ELSE NC.Display_Name END,
       C.Previous_ID,
       C.New_ID
FROM @Changes C
JOIN @AuditItems A       ON A.Record_ID   = C.Communication_Template_ID
LEFT JOIN dp_Users PU    ON PU.User_ID    = C.Previous_ID AND C.Field_Name = 'Template_User'
LEFT JOIN dp_Users NU    ON NU.User_ID    = C.New_ID      AND C.Field_Name = 'Template_User'
LEFT JOIN Contacts PC    ON PC.Contact_ID = C.Previous_ID AND C.Field_Name <> 'Template_User'
LEFT JOIN Contacts NC    ON NC.Contact_ID = C.New_ID      AND C.Field_Name <> 'Template_User';

COMMIT TRANSACTION;

/*--------------------------------------------------------------------------------------
  RESULTS
--------------------------------------------------------------------------------------*/
SELECT '=== CHANGES APPLIED ===' AS Stage,
       C.Communication_Template_ID, CT.Template_Name, C.Field_Name,
       C.Previous_ID, C.New_ID
FROM @Changes C
JOIN dp_Communication_Templates CT ON CT.Communication_Template_ID = C.Communication_Template_ID
ORDER BY C.Communication_Template_ID, C.Field_Name;

SELECT '=== AFTER ===' AS Stage,
       CT.Communication_Template_ID, CT.Template_Name,
       CT.Template_User, TU.User_Name AS Template_User_Name,
       CT.From_Contact,  FC.Email_Address AS From_Email,
       CT.Reply_To_Contact, RC.Email_Address AS Reply_Email
FROM dp_Communication_Templates CT
LEFT JOIN dp_Users TU ON TU.User_ID = CT.Template_User
LEFT JOIN Contacts FC ON FC.Contact_ID = CT.From_Contact
LEFT JOIN Contacts RC ON RC.Contact_ID = CT.Reply_To_Contact
WHERE CT.Communication_Template_ID IN (SELECT Communication_Template_ID FROM @ConnectCardTemplates)
   OR CT.Communication_Template_ID IN (@TaskAssignedTemplate, @GroupAddedTemplate)
ORDER BY CT.Communication_Template_ID;

-- Anything still pointing at Colton across ALL templates, for follow-up.
SELECT '=== REMAINING REFERENCES TO COLTON ===' AS Stage,
       CT.Communication_Template_ID, CT.Template_Name, CT.Subject_Text,
       CT.From_Contact, CT.Reply_To_Contact, CT.Template_User
FROM dp_Communication_Templates CT
WHERE CT.From_Contact = @OldContact
   OR CT.Reply_To_Contact = @OldContact
   OR CT.Template_User = @OldUser
ORDER BY CT.Communication_Template_ID DESC;
