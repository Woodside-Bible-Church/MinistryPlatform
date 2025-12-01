-- =============================================
-- Stored Procedure: api_Custom_GetUserRolesAndGroups_JSON
-- =============================================
-- Purpose: Get all Security Roles and User Groups for a user
--          Returns a unified list of both types as a simple array
--
-- Parameters:
--   @UserGUID: User's GUID from dp_Users.User_GUID
--   @DomainID: Domain ID (default 1)
--
-- Returns: JSON array of role/group names
--   { "Roles": ["Administrators", "IT Team Group", "All Staff", ...] }
--
-- Logic:
--   1. Find user's User_ID from User_GUID
--   2. Get all Security Roles from dp_User_Roles + dp_Roles
--   3. Get all User Groups from dp_User_User_Groups + dp_User_Groups
--   4. UNION both lists and return as deduplicated array
-- =============================================

IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[api_Custom_GetUserRolesAndGroups_JSON]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[api_Custom_GetUserRolesAndGroups_JSON]
GO

CREATE PROCEDURE [dbo].[api_Custom_GetUserRolesAndGroups_JSON]
    @UserGUID NVARCHAR(50),
    @DomainID INT = 1
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @UserID INT;

    -- Get User_ID from User_GUID
    SELECT @UserID = User_ID
    FROM dp_Users
    WHERE User_GUID = @UserGUID
        AND Domain_ID = @DomainID;

    -- Return empty array if user not found
    IF @UserID IS NULL
    BEGIN
        SELECT '[]' AS JSON_F52E2B6118A111d1B10500805F49916B;
        RETURN;
    END

    -- Get combined list of Security Roles and User Groups
    DECLARE @Result NVARCHAR(MAX) = (
        SELECT DISTINCT RoleName AS Roles
        FROM (
            -- Security Roles from dp_User_Roles
            SELECT r.Role_Name AS RoleName
            FROM dp_User_Roles ur
            INNER JOIN dp_Roles r ON ur.Role_ID = r.Role_ID
            WHERE ur.User_ID = @UserID

            UNION

            -- User Groups from dp_User_User_Groups
            SELECT ug.User_Group_Name AS RoleName
            FROM dp_User_User_Groups uug
            INNER JOIN dp_User_Groups ug ON uug.User_Group_ID = ug.User_Group_ID
            WHERE uug.User_ID = @UserID
        ) AS CombinedRoles
        ORDER BY RoleName
        FOR JSON PATH
    );

    -- Return as a single-column result
    SELECT ISNULL(@Result, '[]') AS JSON_F52E2B6118A111d1B10500805F49916B;
END
GO

-- =============================================
-- Register API Procedure
-- =============================================
PRINT 'Stored procedure created: api_Custom_GetUserRolesAndGroups_JSON'
PRINT ''
PRINT 'NEXT STEPS:'
PRINT '1. Register this procedure in MP Admin Console:'
PRINT '   - Go to Administration > API Procedures'
PRINT '   - Add: api_Custom_GetUserRolesAndGroups_JSON'
PRINT '   - Set appropriate permissions'
PRINT ''
PRINT '2. Test the procedure:'
PRINT '   EXEC api_Custom_GetUserRolesAndGroups_JSON'
PRINT '       @UserGUID = ''your-user-guid-here'','
PRINT '       @DomainID = 1'
PRINT ''
GO
