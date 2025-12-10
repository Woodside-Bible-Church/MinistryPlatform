-- Register api_Custom_GetProjectBudgetDetails_JSON in API_Procedures

USE [MinistryPlatform]
GO

-- Check if already registered
IF NOT EXISTS (SELECT 1 FROM dp_API_Procedures WHERE Procedure_Name = 'api_Custom_GetProjectBudgetDetails_JSON')
BEGIN
    INSERT INTO dp_API_Procedures (Procedure_Name, Description)
    VALUES (
        'api_Custom_GetProjectBudgetDetails_JSON',
        'Get detailed budget information for a single project by slug'
    );

    PRINT 'Registered api_Custom_GetProjectBudgetDetails_JSON in API_Procedures';
END
ELSE
BEGIN
    PRINT 'api_Custom_GetProjectBudgetDetails_JSON is already registered';
END

GO
