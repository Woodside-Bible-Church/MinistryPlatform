-- Test the api_Custom_GetProjectBudgets_JSON stored procedure

-- Test 1: Get all projects
EXEC api_Custom_GetProjectBudgets_JSON;

GO

-- Test 2: Get a specific project
EXEC api_Custom_GetProjectBudgets_JSON @ProjectID = 3;

GO
