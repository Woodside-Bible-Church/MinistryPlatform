-- =============================================
-- Stored Procedure: api_Custom_GetLineItemDetails_JSON
-- Description: Get detailed information for a single line item
-- Returns: JSON with line item details, category info, purchase requests, and transactions
-- Parameters: @LineItemID - Project_Budget_Line_Item_ID
-- =============================================

CREATE OR ALTER PROCEDURE [dbo].[api_Custom_GetLineItemDetails_JSON]
    @LineItemID INT,
    @UserName NVARCHAR(75) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    -- Check if line item exists
    IF NOT EXISTS (SELECT 1 FROM Project_Budget_Line_Items WHERE Project_Budget_Line_Item_ID = @LineItemID)
    BEGIN
        SELECT '{"error": "Line item not found"}' AS JsonResult;
        RETURN;
    END

    -- Build JSON result
    DECLARE @Result NVARCHAR(MAX);

    SELECT @Result = (
        SELECT
            -- Line item basic info
            li.Project_Budget_Line_Item_ID AS lineItemId,
            li.Line_Item_Name AS lineItemName,
            li.Line_Item_Description AS lineItemDescription,
            li.Vendor_Name AS vendorName,
            li.Estimated_Amount AS estimatedAmount,

            -- Calculate actual amount from transactions
            (
                SELECT ISNULL(SUM(t.Amount), 0)
                FROM Project_Budget_Transactions t
                WHERE t.Project_Budget_Expense_Line_Item_ID = li.Project_Budget_Line_Item_ID
                   OR t.Project_Budget_Income_Line_Item_ID = li.Project_Budget_Line_Item_ID
            ) AS actualAmount,

            -- Variance (actual - estimated)
            (
                SELECT ISNULL(SUM(t.Amount), 0)
                FROM Project_Budget_Transactions t
                WHERE t.Project_Budget_Expense_Line_Item_ID = li.Project_Budget_Line_Item_ID
                   OR t.Project_Budget_Income_Line_Item_ID = li.Project_Budget_Line_Item_ID
            ) - li.Estimated_Amount AS variance,

            -- Category info
            cat.Project_Budget_Category_ID AS categoryId,
            cat.Budget_Category_Name AS categoryName,
            cat.Budget_Category_Type AS categoryType,

            -- Project info
            p.Project_ID AS projectId,
            p.Project_Title AS projectName,
            p.Slug AS projectSlug,

            -- Purchase requests - using ISNULL to prevent null JSON
            ISNULL((
                SELECT
                    pr.Purchase_Request_ID AS id,
                    pr.Amount AS amount,
                    pr.Description AS description,
                    pr.Vendor_Name AS vendorName,
                    pr.Approval_Status AS approvalStatus,
                    pr.Requested_Date AS requestedDate,
                    pr.Approved_Date AS approvedDate
                FROM Project_Budget_Purchase_Requests pr
                WHERE pr.Project_Budget_Expense_Line_Item_ID = li.Project_Budget_Line_Item_ID
                ORDER BY pr.Requested_Date DESC
                FOR JSON PATH
            ), '[]') AS purchaseRequests,

            (SELECT COUNT(*)
             FROM Project_Budget_Purchase_Requests pr
             WHERE pr.Project_Budget_Expense_Line_Item_ID = li.Project_Budget_Line_Item_ID) AS purchaseRequestCount,

            (SELECT COUNT(*)
             FROM Project_Budget_Purchase_Requests pr
             WHERE pr.Project_Budget_Expense_Line_Item_ID = li.Project_Budget_Line_Item_ID
             AND pr.Approval_Status = 'Pending') AS pendingRequestCount,

            (SELECT COUNT(*)
             FROM Project_Budget_Purchase_Requests pr
             WHERE pr.Project_Budget_Expense_Line_Item_ID = li.Project_Budget_Line_Item_ID
             AND pr.Approval_Status = 'Approved') AS approvedRequestCount,

            -- Transactions - using ISNULL to prevent null JSON
            ISNULL((
                SELECT
                    pbt.Project_Budget_Transaction_ID AS id,
                    pbt.Amount AS amount,
                    pbt.Description AS description,
                    pbt.Transaction_Date AS transactionDate,
                    pmt.Payment_Method_Name AS paymentMethod
                FROM Project_Budget_Transactions pbt
                LEFT JOIN Project_Budget_Payment_Methods pmt
                    ON pbt.Payment_Method_ID = pmt.Payment_Method_ID
                WHERE (pbt.Project_Budget_Expense_Line_Item_ID = li.Project_Budget_Line_Item_ID
                   OR pbt.Project_Budget_Income_Line_Item_ID = li.Project_Budget_Line_Item_ID)
                ORDER BY pbt.Transaction_Date DESC
                FOR JSON PATH
            ), '[]') AS transactions,

            (SELECT COUNT(*)
             FROM Project_Budget_Transactions pbt
             WHERE (pbt.Project_Budget_Expense_Line_Item_ID = li.Project_Budget_Line_Item_ID
                OR pbt.Project_Budget_Income_Line_Item_ID = li.Project_Budget_Line_Item_ID)) AS transactionCount

        FROM Project_Budget_Line_Items li
        INNER JOIN Project_Budget_Categories cat ON li.Category_ID = cat.Project_Budget_Category_ID
        INNER JOIN Projects p ON cat.Project_ID = p.Project_ID
        WHERE li.Project_Budget_Line_Item_ID = @LineItemID
        FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
    );

    -- Return the JSON as a single column
    SELECT @Result AS JsonResult;

END
GO
