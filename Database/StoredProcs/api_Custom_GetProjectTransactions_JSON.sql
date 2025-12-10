-- =============================================
-- Stored Procedure: api_Custom_GetProjectTransactions_JSON
-- Description: Get all transactions for a project (both expenses and income)
-- Returns: JSON with project info and all transactions
-- Parameters: @Slug - Project slug for URL routing
-- =============================================

CREATE OR ALTER PROCEDURE [dbo].[api_Custom_GetProjectTransactions_JSON]
    @Slug NVARCHAR(100),
    @UserName NVARCHAR(75) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    -- Get the project ID from slug
    DECLARE @ProjectID INT;
    SELECT @ProjectID = Project_ID
    FROM Projects
    WHERE Slug = @Slug;

    IF @ProjectID IS NULL
    BEGIN
        SELECT '{"error": "Project not found"}' AS JsonResult;
        RETURN;
    END

    -- Build JSON result into a variable to avoid truncation
    DECLARE @Result NVARCHAR(MAX);

    -- Build JSON response with project info and transactions
    SELECT @Result =
        (
            SELECT
                -- Project basic info
                p.Project_ID,
                p.Project_Title,
                p.Slug,

                -- Transaction stats
                (
                    SELECT COUNT(*)
                    FROM Project_Budget_Transactions pbt
                    WHERE pbt.Project_ID = p.Project_ID
                ) AS Total_Transactions,

                (
                    SELECT ISNULL(SUM(pbt.Amount), 0)
                    FROM Project_Budget_Transactions pbt
                    WHERE pbt.Project_ID = p.Project_ID
                        AND pbt.Transaction_Type = 'Expense'
                ) AS Total_Expenses,

                (
                    SELECT ISNULL(SUM(pbt.Amount), 0)
                    FROM Project_Budget_Transactions pbt
                    WHERE pbt.Project_ID = p.Project_ID
                        AND pbt.Transaction_Type = 'Income'
                ) AS Total_Income,

                (
                    SELECT COUNT(*)
                    FROM Project_Budget_Transactions pbt
                    WHERE pbt.Project_ID = p.Project_ID
                        AND pbt.Transaction_Type = 'Expense'
                ) AS Expense_Transaction_Count,

                (
                    SELECT COUNT(*)
                    FROM Project_Budget_Transactions pbt
                    WHERE pbt.Project_ID = p.Project_ID
                        AND pbt.Transaction_Type = 'Income'
                ) AS Income_Transaction_Count,

                -- All transactions
                (
                    SELECT
                        pbt.Project_Budget_Transaction_ID AS transactionId,
                        pbt.Transaction_Date AS date,
                        pbt.Transaction_Type AS type,
                        pbt.Amount AS amount,
                        pbt.Description AS description,
                        CAST(pbt.Payment_Method_ID AS NVARCHAR) AS paymentMethod,
                        pbt.Payee_Name AS payee,

                        -- Category/Line Item info
                        CASE
                            WHEN pbt.Project_Budget_Expense_Line_Item_ID IS NOT NULL THEN
                                (
                                    SELECT pct.Project_Category_Type + ' | ' + pbeli.Item_Name
                                    FROM Project_Budget_Expense_Line_Items pbeli
                                    INNER JOIN Project_Budget_Categories pbc ON pbeli.Project_Budget_Category_ID = pbc.Project_Budget_Category_ID
                                    INNER JOIN Project_Category_Types pct ON pbc.Project_Category_Type_ID = pct.Project_Category_Type_ID
                                    WHERE pbeli.Project_Budget_Expense_Line_Item_ID = pbt.Project_Budget_Expense_Line_Item_ID
                                )
                            WHEN pbt.Project_Budget_Income_Line_Item_ID IS NOT NULL THEN
                                (
                                    SELECT 'Income | ' + pbili.Income_Source_Name
                                    FROM Project_Budget_Income_Line_Items pbili
                                    WHERE pbili.Project_Budget_Income_Line_Item_ID = pbt.Project_Budget_Income_Line_Item_ID
                                )
                            WHEN pbt.Project_Budget_Category_ID IS NOT NULL THEN
                                (
                                    SELECT pct.Project_Category_Type
                                    FROM Project_Budget_Categories pbc
                                    INNER JOIN Project_Category_Types pct ON pbc.Project_Category_Type_ID = pct.Project_Category_Type_ID
                                    WHERE pbc.Project_Budget_Category_ID = pbt.Project_Budget_Category_ID
                                )
                            ELSE 'Uncategorized'
                        END AS categoryItem

                    FROM Project_Budget_Transactions pbt
                    WHERE pbt.Project_ID = p.Project_ID
                    ORDER BY pbt.Transaction_Date DESC, pbt.Project_Budget_Transaction_ID DESC
                    FOR JSON PATH
                ) AS transactions

            FROM Projects p
            WHERE p.Project_ID = @ProjectID
            FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
        );

    -- Return the JSON as a single column to avoid truncation
    SELECT @Result AS JsonResult;

END
GO
