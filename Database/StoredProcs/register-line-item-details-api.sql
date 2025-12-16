-- =============================================
-- Register api_Custom_GetLineItemDetails_JSON in MinistryPlatform API
-- This allows the stored procedure to be called via the REST API
-- =============================================

-- Check if the stored procedure is already registered
IF NOT EXISTS (
    SELECT 1
    FROM [dbo].[dp_API_Procedures]
    WHERE [Procedure_Name] = 'api_Custom_GetLineItemDetails_JSON'
)
BEGIN
    INSERT INTO [dbo].[dp_API_Procedures] (
        [Procedure_Name],
        [Description]
    )
    VALUES (
        'api_Custom_GetLineItemDetails_JSON',
        'Get detailed information for a single line item including purchase requests and transactions'
    );

    PRINT 'Stored procedure api_Custom_GetLineItemDetails_JSON registered successfully';
END
ELSE
BEGIN
    PRINT 'Stored procedure api_Custom_GetLineItemDetails_JSON is already registered';
END
GO
