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

                        -- Line Item ID (unified)
                        pbt.Project_Budget_Line_Item_ID AS lineItemId,

                        -- Purchase Request info (for expense transactions only)
                        pbt.Purchase_Request_ID AS purchaseRequestId,
                        (
                            SELECT pr.Requisition_GUID
                            FROM Project_Budget_Purchase_Requests pr
                            WHERE pr.Purchase_Request_ID = pbt.Purchase_Request_ID
                        ) AS requisitionGuid,
                        (
                            SELECT pr.Approval_Status
                            FROM Project_Budget_Purchase_Requests pr
                            WHERE pr.Purchase_Request_ID = pbt.Purchase_Request_ID
                        ) AS purchaseRequestStatus,

                        -- Category/Line Item info (derived from unified line items table)
                        ISNULL(
                            (
                                SELECT CASE
                                    WHEN pbc.Budget_Category_Name IS NOT NULL THEN pbc.Budget_Category_Name + ' | ' + li.Line_Item_Name
                                    ELSE li.Line_Item_Name
                                END
                                FROM Project_Budget_Line_Items li
                                INNER JOIN Project_Budget_Categories pbc
                                    ON li.Category_ID = pbc.Project_Budget_Category_ID
                                    AND pbc.Project_ID = pbt.Project_ID
                                WHERE li.Project_Budget_Line_Item_ID = pbt.Project_Budget_Line_Item_ID
                            ),
                            'Uncategorized'
                        ) AS categoryItem

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
