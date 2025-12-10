-- Test the GetProjectBudgets stored procedure

USE MinistryPlatform;
GO

EXEC api_Custom_GetProjectBudgets_JSON @ProjectID = 7;

GO
