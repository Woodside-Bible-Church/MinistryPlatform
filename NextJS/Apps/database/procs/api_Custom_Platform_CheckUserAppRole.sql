-- =============================================
-- Stored Procedure: api_Custom_Platform_CheckUserAppRole_JSON
-- =============================================
-- Purpose: Check if a user has a specific role for an application
--          based on their User Group memberships
--
-- Parameters:
--   @UserName: User's email address
--   @ApplicationKey: Application identifier (e.g., 'counter', 'budget')
--   @RoleKey: Role identifier (e.g., 'admin', 'counter', 'viewer')
--   @DomainID: Domain ID (default 1)
--
-- Returns: JSON object with HasRole boolean
--   { "HasRole": true } or { "HasRole": false }
--
-- Logic:
--   1. Find user's Contact_ID from User_Name
--   2. Get all active User Groups the user belongs to
--   3. Check if any of those groups are mapped to the requested app role
--   4. Return true if at least one match found
-- =============================================

IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[api_Custom_Platform_CheckUserAppRole_JSON]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[api_Custom_Platform_CheckUserAppRole_JSON]
GO

CREATE PROCEDURE [dbo].[api_Custom_Platform_CheckUserAppRole_JSON]
    @UserName NVARCHAR(75),
    @ApplicationKey NVARCHAR(50),
    @RoleKey NVARCHAR(50),
    @DomainID INT = 1
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @ContactID INT;
    DECLARE @ApplicationID INT;
    DECLARE @HasRole BIT = 0;

    -- Get Contact_ID from User_Name
    SELECT @ContactID = Contact_ID
    FROM dp_Users
    WHERE User_Name = @UserName
        AND Domain_ID = @DomainID;

    -- Get Application_ID from Application_Key
    SELECT @ApplicationID = Application_ID
    FROM Applications
    WHERE Application_Key = @ApplicationKey
        AND Domain_ID = @DomainID;

    -- Check if user has the role through their User Groups
    IF @ContactID IS NOT NULL AND @ApplicationID IS NOT NULL
    BEGIN
        SELECT @HasRole = CASE
            WHEN COUNT(*) > 0 THEN 1
            ELSE 0
        END
        FROM dp_User_User_Groups uug
        INNER JOIN Application_Role_User_Groups arug
            ON uug.User_Group_ID = arug.User_Group_ID
        INNER JOIN Application_Roles ar
            ON arug.Application_Role_ID = ar.Application_Role_ID
        WHERE uug.User_ID = @ContactID
            AND ar.Application_ID = @ApplicationID
            AND ar.Role_Key = @RoleKey
            AND (arug.End_Date IS NULL OR arug.End_Date >= GETDATE());  -- Active role mapping
    END

    -- Return result as JSON
    SELECT @HasRole AS HasRole
    FOR JSON PATH, WITHOUT_ARRAY_WRAPPER;

END
GO

-- =============================================
-- Register API Procedure
-- =============================================
PRINT 'Stored procedure created: api_Custom_Platform_CheckUserAppRole_JSON'
PRINT ''
PRINT 'NEXT STEPS:'
PRINT '1. Register this procedure in MP Admin Console:'
PRINT '   - Go to Administration > API Procedures'
PRINT '   - Add: api_Custom_Platform_CheckUserAppRole_JSON'
PRINT '   - Set appropriate permissions'
PRINT ''
PRINT '2. Test the procedure:'
PRINT '   EXEC api_Custom_Platform_CheckUserAppRole_JSON'
PRINT '       @UserName = ''your.email@woodsidebible.org'','
PRINT '       @ApplicationKey = ''counter'','
PRINT '       @RoleKey = ''admin'','
PRINT '       @DomainID = 1'
PRINT ''
GO
