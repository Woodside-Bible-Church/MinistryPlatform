-- =============================================
-- Register api_Custom_GetProjectBudgetDetails_JSON in MinistryPlatform
-- This script registers the API procedure and grants permissions
-- =============================================

-- Step 1: Register the API procedure in dp_API_Procedures
IF NOT EXISTS (SELECT 1 FROM dp_API_Procedures WHERE Procedure_Name = 'api_Custom_GetProjectBudgetDetails_JSON')
BEGIN
    INSERT INTO dp_API_Procedures (
        Procedure_Name,
        Description
    )
    VALUES (
        'api_Custom_GetProjectBudgetDetails_JSON',
        'Get detailed budget information for a single project by slug'
    );

    PRINT 'API Procedure registered successfully';
END
ELSE
BEGIN
    PRINT 'API Procedure already exists';
END

GO

-- Step 2: Grant permission to Administrators role (Role_ID = 2)
DECLARE @API_Procedure_ID INT;
SELECT @API_Procedure_ID = API_Procedure_ID
FROM dp_API_Procedures
WHERE Procedure_Name = 'api_Custom_GetProjectBudgetDetails_JSON';

IF NOT EXISTS (
    SELECT 1
    FROM dp_Role_API_Procedures
    WHERE Role_ID = 2
        AND API_Procedure_ID = @API_Procedure_ID
)
BEGIN
    INSERT INTO dp_Role_API_Procedures (
        Role_ID,
        API_Procedure_ID,
        Domain_ID
    )
    VALUES (
        2,  -- Administrators role
        @API_Procedure_ID,
        1   -- Default domain
    );

    PRINT 'Permission granted to Administrators role';
END
ELSE
BEGIN
    PRINT 'Permission already exists for Administrators role';
END

GO

-- Verification query
SELECT
    ap.Procedure_Name,
    ap.Description,
    r.Role_Name,
    rap.Role_API_Procedure_ID
FROM dp_API_Procedures ap
LEFT JOIN dp_Role_API_Procedures rap ON ap.API_Procedure_ID = rap.API_Procedure_ID
LEFT JOIN dp_Roles r ON rap.Role_ID = r.Role_ID
WHERE ap.Procedure_Name = 'api_Custom_GetProjectBudgetDetails_JSON';

GO
