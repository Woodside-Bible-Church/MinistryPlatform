-- =============================================
-- Application Roles Schema
-- =============================================
-- This schema enables app-specific role-based permissions
-- using Ministry Platform's existing User Groups system.
--
-- HOW IT WORKS:
-- 1. Each application defines its own roles (admin, counter, viewer, etc.)
-- 2. Each role is mapped to one or more User Groups
-- 3. Users are assigned to User Groups in MP Admin
-- 4. Permission checks query user's groups → role mappings → app roles
--
-- SUPER ADMINS:
-- Users in MP's "Administrators" role (from OAuth) automatically have
-- full access to all apps and all features, bypassing these checks.
-- =============================================

-- =============================================
-- Table: Application_Roles
-- Purpose: Define role types available within each application
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Application_Roles]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[Application_Roles] (
        [Application_Role_ID] INT IDENTITY(1,1) NOT NULL,
        [Application_ID] INT NOT NULL,
        [Role_Key] NVARCHAR(50) NOT NULL,          -- Machine-readable key: "admin", "counter", "viewer"
        [Role_Name] NVARCHAR(100) NOT NULL,        -- Human-readable: "Administrator", "Counter", "Viewer"
        [Role_Description] NVARCHAR(500) NULL,     -- What can users with this role do?
        [Sort_Order] INT NOT NULL DEFAULT 0,       -- Display order in UI
        [Domain_ID] INT NOT NULL DEFAULT 1,

        CONSTRAINT [PK_Application_Roles] PRIMARY KEY CLUSTERED ([Application_Role_ID] ASC),
        CONSTRAINT [FK_Application_Roles_Applications] FOREIGN KEY ([Application_ID])
            REFERENCES [dbo].[Applications] ([Application_ID]),
        CONSTRAINT [UQ_Application_Roles_App_Key] UNIQUE ([Application_ID], [Role_Key])
    )

    PRINT 'Created table: Application_Roles'
END
ELSE
BEGIN
    PRINT 'Table already exists: Application_Roles'
END
GO

-- =============================================
-- Table: Application_Role_User_Groups
-- Purpose: Map application roles to Ministry Platform User Groups
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Application_Role_User_Groups]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[Application_Role_User_Groups] (
        [Application_Role_User_Group_ID] INT IDENTITY(1,1) NOT NULL,
        [Application_Role_ID] INT NOT NULL,
        [User_Group_ID] INT NOT NULL,              -- FK to dp_User_Groups
        [Start_Date] DATETIME NOT NULL DEFAULT GETDATE(),
        [End_Date] DATETIME NULL,                  -- NULL = active indefinitely
        [Domain_ID] INT NOT NULL DEFAULT 1,

        CONSTRAINT [PK_Application_Role_User_Groups] PRIMARY KEY CLUSTERED ([Application_Role_User_Group_ID] ASC),
        CONSTRAINT [FK_Application_Role_User_Groups_Roles] FOREIGN KEY ([Application_Role_ID])
            REFERENCES [dbo].[Application_Roles] ([Application_Role_ID]),
        CONSTRAINT [FK_Application_Role_User_Groups_Groups] FOREIGN KEY ([User_Group_ID])
            REFERENCES [dbo].[dp_User_Groups] ([User_Group_ID]),
        CONSTRAINT [UQ_Application_Role_User_Groups] UNIQUE ([Application_Role_ID], [User_Group_ID])
    )

    PRINT 'Created table: Application_Role_User_Groups'
END
ELSE
BEGIN
    PRINT 'Table already exists: Application_Role_User_Groups'
END
GO

-- =============================================
-- Seed Data: Counter App Roles
-- =============================================
PRINT ''
PRINT 'Inserting seed data for Counter app roles...'

DECLARE @CounterAppID INT
SELECT @CounterAppID = Application_ID FROM Applications WHERE Application_Key = 'counter'

IF @CounterAppID IS NOT NULL
BEGIN
    -- Counter Admin Role
    IF NOT EXISTS (SELECT 1 FROM Application_Roles WHERE Application_ID = @CounterAppID AND Role_Key = 'admin')
    BEGIN
        INSERT INTO Application_Roles (Application_ID, Role_Key, Role_Name, Role_Description, Sort_Order)
        VALUES (@CounterAppID, 'admin', 'Administrator', 'Full access: view analytics, enter metrics, manage settings', 1)
        PRINT '  ✓ Created role: Counter - Administrator'
    END
    ELSE
        PRINT '  - Role already exists: Counter - Administrator'

    -- Counter Contributor Role
    IF NOT EXISTS (SELECT 1 FROM Application_Roles WHERE Application_ID = @CounterAppID AND Role_Key = 'counter')
    BEGIN
        INSERT INTO Application_Roles (Application_ID, Role_Key, Role_Name, Role_Description, Sort_Order)
        VALUES (@CounterAppID, 'counter', 'Counter', 'Can enter event metrics and headcounts', 2)
        PRINT '  ✓ Created role: Counter - Counter'
    END
    ELSE
        PRINT '  - Role already exists: Counter - Counter'
END
ELSE
BEGIN
    PRINT '  ⚠ Counter app not found (Application_Key = ''counter''). Skipping role creation.'
    PRINT '    Create the Counter application first, then run this script again.'
END
GO

-- =============================================
-- Usage Instructions
-- =============================================
PRINT ''
PRINT '=============================================
NEXT STEPS:
=============================================

1. CREATE USER GROUPS in Ministry Platform:
   - Go to Administration > User Groups
   - Create groups like:
     • "Counter - Administrators"
     • "Counter - Counters"

2. MAP GROUPS TO ROLES:
   INSERT INTO Application_Role_User_Groups (Application_Role_ID, User_Group_ID)
   SELECT ar.Application_Role_ID, ug.User_Group_ID
   FROM Application_Roles ar
   CROSS JOIN dp_User_Groups ug
   WHERE ar.Role_Key = ''admin''
     AND ug.User_Group_Name = ''Counter - Administrators''

3. ADD USERS TO GROUPS:
   - Go to Administration > Users
   - Edit user → User Groups tab
   - Add to appropriate groups

4. TEST PERMISSIONS:
   - Users in "Administrators" MP role: Full access to everything
   - Users in "Counter - Administrators" group: Counter admin features
   - Users in "Counter - Counters" group: Can enter metrics only

=============================================
'
GO
