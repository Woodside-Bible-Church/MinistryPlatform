/****************************************************************************************
  fix-remaining-colton-template-references.sql

  Follow-up to fix-connect-card-task-notification-sender.sql, which cleared Colton
  Wirgau off the two live "backdoor" notifications and the campus connect card
  templates. This handles the leftovers that surfaced in that script's
  "REMAINING REFERENCES TO COLTON" output.

  Neutral account, same as before:
    Contact 7 "Woodside Admin" <no_reply@woodsidebible.org>
    User    5 "churchadmin"

  ---------------------------------------------------------------------------------
  WHAT THIS CHANGES

  A) Orphaned duplicate Troy connect card templates: 18019, 18020
     Reply_To_Contact Colton -> Joe Crabb (232335), matching their own From_Contact.
     Same rule already applied to live templates 15669 and 16681. These rows are
     unreferenced dead config; this just gets Colton's name off them without
     deleting anything.

  B) Template_User only: 17320, 16530, 12155
     Template_User 201 -> 5.
     Template_User does NOT affect the visible sender. util_CreateMessageKPM and
     service_notification_tasks both derive From/Reply-To from From_Contact /
     Reply_to_Contact; Template_User only lands in dp_Communications.Author_User_ID.
     All three already have a non-Colton From/Reply, so nothing about the emails
     themselves changes. This only stops Colton being recorded as the author of
     the generated communication records.

       17320  Plan Your Visit Notification   (staff notification, From = Contact 2)
       16530  Royal Oak | Students 4.0       (historical one-off, From = Corey Svrcina)
       12155  Email Subscription             (live system template, From = Contact 2)

  C) Genuinely mis-attached, From/Reply -> neutral: 15729
       15729  Connect Card Follow-Ups
     Internal connect-card staff template. Dormant: no foreign key references it
     and it has never been sent (no dp_Communications.Likely_Template rows). Would
     have gone out as Colton if anyone used it, so it belongs with the connect card
     fix.

  ---------------------------------------------------------------------------------
  DELIBERATELY NOT CHANGED: the four Flag Football templates

    17506  Mens Flag Football 2025
    17441  Mens Flag Football 2025 Registration Completed USED BY A NOTIFICATION
    16391  Collective Flag Football 2024 Registration Completed USED BY A NOTIFICATION
    15695  Collective Flag Football Recap

  These are From/Reply Colton, but that appears to be CORRECT rather than
  accidental. Program 5487 "Collective Flag Football" has Primary_Contact = Colton
  (228155), as do all three flag football events (285093, 301519, 317431).
  He owns the ministry, so participant mail replying to him is the desired
  behaviour.

  They are also congregant-facing, not staff notifications. 17441 is wired to
  Events.Registrant_Message on event 317431, so it fires on registration and goes
  to the registrant. Repointing those at no_reply@ would silently swallow replies
  from people trying to ask about a game.

  If flag football has been handed off, change these to the new owner's contact
  (or a monitored ministry mailbox such as adults@woodsidebible.org / Contact
  357309), NOT to no_reply@.

  ---------------------------------------------------------------------------------
  SAFETY
  - Idempotent: every UPDATE is guarded on the current (old) value.
  - Transactional, with the same neutral-account pre-flight check.
  - Writes dp_Audit_Log + dp_Audit_Detail rows.
  - No deletes.
****************************************************************************************/

SET NOCOUNT ON;
SET XACT_ABORT ON;

DECLARE @NeutralContact INT = 7;      -- Woodside Admin <no_reply@woodsidebible.org>
DECLARE @NeutralUser    INT = 5;      -- churchadmin
DECLARE @OldContact     INT = 228155; -- Wirgau, Colton
DECLARE @OldUser        INT = 201;    -- coltonwirgau@woodsidebible.org
DECLARE @JoeContact     INT = 232335; -- Crabb, Joe

DECLARE @AuditUserID   INT = 201;
DECLARE @AuditUserName NVARCHAR(254) = 'coltonwirgau@woodsidebible.org';
DECLARE @Now DATETIME = (SELECT dbo.dp_ToLocalTime(GETUTCDATE(), Time_Zone) FROM dp_Domains WHERE Domain_ID = 1);

DECLARE @TemplateUserOnly TABLE (Communication_Template_ID INT PRIMARY KEY);
INSERT INTO @TemplateUserOnly VALUES (17320), (16530), (12155);

DECLARE @Orphans TABLE (Communication_Template_ID INT PRIMARY KEY);
INSERT INTO @Orphans VALUES (18019), (18020);

DECLARE @Neutralize TABLE (Communication_Template_ID INT PRIMARY KEY);
INSERT INTO @Neutralize VALUES (15729);

/*--------------------------------------------------------------------------------------
  PRE-FLIGHT
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

IF NOT EXISTS (SELECT 1 FROM Contacts WHERE Contact_ID = @JoeContact AND Email_Address IS NOT NULL)
BEGIN
    RAISERROR('Aborting: Contact %d (Joe Crabb) is missing or has no Email_Address.', 16, 1, @JoeContact);
    RETURN;
END

/*--------------------------------------------------------------------------------------
  BEFORE
--------------------------------------------------------------------------------------*/
SELECT '=== BEFORE ===' AS Stage,
       CT.Communication_Template_ID, CT.Template_Name,
       CT.Template_User, TU.User_Name AS Template_User_Name,
       CT.From_Contact, FC.Email_Address AS From_Email,
       CT.Reply_To_Contact, RC.Email_Address AS Reply_Email
FROM dp_Communication_Templates CT
LEFT JOIN dp_Users TU ON TU.User_ID = CT.Template_User
LEFT JOIN Contacts FC ON FC.Contact_ID = CT.From_Contact
LEFT JOIN Contacts RC ON RC.Contact_ID = CT.Reply_To_Contact
WHERE CT.Communication_Template_ID IN (
        SELECT Communication_Template_ID FROM @TemplateUserOnly
        UNION SELECT Communication_Template_ID FROM @Orphans
        UNION SELECT Communication_Template_ID FROM @Neutralize)
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

-- A) Orphaned Troy duplicates: Reply-To follows their own From (Joe Crabb).
UPDATE CT
SET Reply_To_Contact = @JoeContact
OUTPUT INSERTED.Communication_Template_ID, CAST('Reply_To_Contact' AS NVARCHAR(50)),
       DELETED.Reply_To_Contact, INSERTED.Reply_To_Contact
INTO @Changes
FROM dp_Communication_Templates CT
WHERE CT.Communication_Template_ID IN (SELECT Communication_Template_ID FROM @Orphans)
  AND CT.Reply_To_Contact = @OldContact
  AND CT.From_Contact = @JoeContact;

-- B) Template_User only. Visible sender is already non-Colton on these.
UPDATE CT
SET Template_User = @NeutralUser
OUTPUT INSERTED.Communication_Template_ID, CAST('Template_User' AS NVARCHAR(50)),
       DELETED.Template_User, INSERTED.Template_User
INTO @Changes
FROM dp_Communication_Templates CT
WHERE CT.Communication_Template_ID IN (SELECT Communication_Template_ID FROM @TemplateUserOnly)
  AND CT.Template_User = @OldUser;

-- C) Mis-attached internal template: neutralize the visible sender.
UPDATE CT
SET From_Contact = @NeutralContact
OUTPUT INSERTED.Communication_Template_ID, CAST('From_Contact' AS NVARCHAR(50)),
       DELETED.From_Contact, INSERTED.From_Contact
INTO @Changes
FROM dp_Communication_Templates CT
WHERE CT.Communication_Template_ID IN (SELECT Communication_Template_ID FROM @Neutralize)
  AND CT.From_Contact = @OldContact;

UPDATE CT
SET Reply_To_Contact = @NeutralContact
OUTPUT INSERTED.Communication_Template_ID, CAST('Reply_To_Contact' AS NVARCHAR(50)),
       DELETED.Reply_To_Contact, INSERTED.Reply_To_Contact
INTO @Changes
FROM dp_Communication_Templates CT
WHERE CT.Communication_Template_ID IN (SELECT Communication_Template_ID FROM @Neutralize)
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
JOIN @AuditItems A    ON A.Record_ID   = C.Communication_Template_ID
LEFT JOIN dp_Users PU ON PU.User_ID    = C.Previous_ID AND C.Field_Name =  'Template_User'
LEFT JOIN dp_Users NU ON NU.User_ID    = C.New_ID      AND C.Field_Name =  'Template_User'
LEFT JOIN Contacts PC ON PC.Contact_ID = C.Previous_ID AND C.Field_Name <> 'Template_User'
LEFT JOIN Contacts NC ON NC.Contact_ID = C.New_ID      AND C.Field_Name <> 'Template_User';

COMMIT TRANSACTION;

/*--------------------------------------------------------------------------------------
  RESULTS
--------------------------------------------------------------------------------------*/
SELECT '=== CHANGES APPLIED ===' AS Stage,
       C.Communication_Template_ID, CT.Template_Name, C.Field_Name, C.Previous_ID, C.New_ID
FROM @Changes C
JOIN dp_Communication_Templates CT ON CT.Communication_Template_ID = C.Communication_Template_ID
ORDER BY C.Communication_Template_ID, C.Field_Name;

-- Everything still pointing at Colton. Expect ONLY the four Flag Football templates,
-- which are intentionally left alone (he owns Program 5487).
SELECT '=== REMAINING (EXPECT FLAG FOOTBALL ONLY) ===' AS Stage,
       CT.Communication_Template_ID, CT.Template_Name, CT.Subject_Text,
       CT.From_Contact, CT.Reply_To_Contact, CT.Template_User
FROM dp_Communication_Templates CT
WHERE CT.From_Contact = @OldContact
   OR CT.Reply_To_Contact = @OldContact
   OR CT.Template_User = @OldUser
ORDER BY CT.Communication_Template_ID DESC;
