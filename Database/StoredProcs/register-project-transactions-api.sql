-- Register the api_Custom_GetProjectTransactions_JSON procedure in API_Procedures

-- Check if it already exists
IF EXISTS (SELECT 1 FROM API_Procedures WHERE Procedure_Name = 'api_Custom_GetProjectTransactions_JSON')
BEGIN
    PRINT 'Procedure api_Custom_GetProjectTransactions_JSON already registered in API_Procedures';
END
ELSE
BEGIN
    INSERT INTO API_Procedures (
        Procedure_Name,
        Description,
        Domain_ID
    ) VALUES (
        'api_Custom_GetProjectTransactions_JSON',
        'Get all transactions for a project by slug',
        1
    );

    PRINT 'Successfully registered api_Custom_GetProjectTransactions_JSON in API_Procedures';
END

-- Show the registered procedure
SELECT *
FROM API_Procedures
WHERE Procedure_Name = 'api_Custom_GetProjectTransactions_JSON';
