-- Register api_custom_Announcements_Management_JSON in MinistryPlatform
-- Fetch announcements for management interface with detailed information

-- Check if it already exists
IF NOT EXISTS (SELECT 1 FROM dp_API_Procedures WHERE Procedure_Name = 'api_custom_Announcements_Management_JSON')
BEGIN
    INSERT INTO dp_API_Procedures (Procedure_Name, Description)
    VALUES ('api_custom_Announcements_Management_JSON', 'Fetch announcements for management interface with detailed information');
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
WHERE Procedure_Name = 'api_custom_Announcements_Management_JSON';

-- Administrators
IF NOT EXISTS (
    SELECT 1 FROM dp_Role_API_Procedures
    WHERE Role_ID = 2 AND API_Procedure_ID = @API_Procedure_ID
)
BEGIN
    INSERT INTO dp_Role_API_Procedures (Role_ID, API_Procedure_ID, Domain_ID)
    VALUES (2, @API_Procedure_ID, 1);
    PRINT 'Permission granted to Administrators';
END
ELSE
BEGIN
    PRINT 'Permission already exists for Administrators';
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
WHERE ap.Procedure_Name = 'api_custom_Announcements_Management_JSON';

GO
