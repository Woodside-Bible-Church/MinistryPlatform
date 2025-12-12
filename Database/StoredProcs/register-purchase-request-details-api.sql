-- Register api_Custom_GetPurchaseRequestDetails_JSON in MinistryPlatform
-- Get detailed information for a single purchase request including transactions

-- Check if it already exists
IF NOT EXISTS (SELECT 1 FROM dp_API_Procedures WHERE Procedure_Name = 'api_Custom_GetPurchaseRequestDetails_JSON')
BEGIN
    INSERT INTO dp_API_Procedures (Procedure_Name, Description)
    VALUES ('api_Custom_GetPurchaseRequestDetails_JSON', 'Get detailed information for a purchase request including transactions');
    PRINT 'API Procedure registered successfully';
END
ELSE
BEGIN
    PRINT 'API Procedure already exists';
END

GO

-- Grant permissions to roles
DECLARE @API_Procedure_ID INT;
SELECT @API_Procedure_ID = API_Procedure_ID
FROM dp_API_Procedures
WHERE Procedure_Name = 'api_Custom_GetPurchaseRequestDetails_JSON';

-- Grant to Administrators (Role ID 2)
IF NOT EXISTS (
    SELECT 1 FROM dp_Role_API_Procedures
    WHERE Role_ID = 2 AND API_Procedure_ID = @API_Procedure_ID
)
BEGIN
    INSERT INTO dp_Role_API_Procedures (Role_ID, API_Procedure_ID, Domain_ID)
    VALUES (2, @API_Procedure_ID, 1);
    PRINT 'Permission granted to role 2 (Administrators)';
END
ELSE
BEGIN
    PRINT 'Permission already exists for role 2';
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
WHERE ap.Procedure_Name = 'api_Custom_GetPurchaseRequestDetails_JSON';

GO
