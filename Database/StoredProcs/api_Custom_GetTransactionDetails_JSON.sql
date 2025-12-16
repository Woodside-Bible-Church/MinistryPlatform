-- =============================================
-- Stored Procedure: api_Custom_GetTransactionDetails_JSON
-- Description: Get detailed information for a single transaction
-- Returns: JSON with transaction details including line item, category, project, and purchase request info
-- Parameters: @TransactionID - Project_Budget_Transaction_ID
-- =============================================

CREATE OR ALTER PROCEDURE [dbo].[api_Custom_GetTransactionDetails_JSON]
    @TransactionID INT,
    @UserName NVARCHAR(75) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    -- Check if transaction exists
    IF NOT EXISTS (SELECT 1 FROM Project_Budget_Transactions WHERE Project_Budget_Transaction_ID = @TransactionID)
    BEGIN
        SELECT '{"error": "Transaction not found"}' AS JsonResult;
        RETURN;
    END

    -- Build JSON result
    DECLARE @Result NVARCHAR(MAX);

    SELECT @Result = (
        SELECT
            -- Transaction basic info
            t.Project_Budget_Transaction_ID AS transactionId,
            t.Transaction_Date AS transactionDate,
            t.Transaction_Type AS transactionType,
            t.Amount AS amount,
            t.Description AS description,
            t.Payee_Name AS payeeName,
            t.Payment_Reference AS paymentReference,
            t.Notes AS notes,

            -- Payment method info
            t.Payment_Method_ID AS paymentMethodId,
            pm.Payment_Method_Name AS paymentMethod,

            -- Project info
            p.Project_ID AS projectId,
            p.Project_Title AS projectName,
            p.Slug AS projectSlug,

            -- Category info (if associated with category directly)
            t.Project_Budget_Category_ID AS categoryId,
            cat.Budget_Category_Name AS categoryName,

            -- Line item info (expense or income)
            CASE
                WHEN t.Project_Budget_Expense_Line_Item_ID IS NOT NULL THEN t.Project_Budget_Expense_Line_Item_ID
                WHEN t.Project_Budget_Income_Line_Item_ID IS NOT NULL THEN t.Project_Budget_Income_Line_Item_ID
                ELSE NULL
            END AS lineItemId,

            CASE
                WHEN t.Project_Budget_Expense_Line_Item_ID IS NOT NULL THEN
                    (SELECT li.Line_Item_Name
                     FROM Project_Budget_Line_Items li
                     WHERE li.Project_Budget_Line_Item_ID = t.Project_Budget_Expense_Line_Item_ID)
                WHEN t.Project_Budget_Income_Line_Item_ID IS NOT NULL THEN
                    (SELECT li.Line_Item_Name
                     FROM Project_Budget_Line_Items li
                     WHERE li.Project_Budget_Line_Item_ID = t.Project_Budget_Income_Line_Item_ID)
                ELSE NULL
            END AS lineItemName,

            CASE
                WHEN t.Project_Budget_Expense_Line_Item_ID IS NOT NULL THEN
                    (SELECT c.Project_Budget_Category_ID
                     FROM Project_Budget_Line_Items li
                     INNER JOIN Project_Budget_Categories c ON li.Category_ID = c.Project_Budget_Category_ID
                     WHERE li.Project_Budget_Line_Item_ID = t.Project_Budget_Expense_Line_Item_ID)
                WHEN t.Project_Budget_Income_Line_Item_ID IS NOT NULL THEN
                    (SELECT c.Project_Budget_Category_ID
                     FROM Project_Budget_Line_Items li
                     INNER JOIN Project_Budget_Categories c ON li.Category_ID = c.Project_Budget_Category_ID
                     WHERE li.Project_Budget_Line_Item_ID = t.Project_Budget_Income_Line_Item_ID)
                ELSE t.Project_Budget_Category_ID
            END AS lineItemCategoryId,

            CASE
                WHEN t.Project_Budget_Expense_Line_Item_ID IS NOT NULL THEN
                    (SELECT c.Budget_Category_Name
                     FROM Project_Budget_Line_Items li
                     INNER JOIN Project_Budget_Categories c ON li.Category_ID = c.Project_Budget_Category_ID
                     WHERE li.Project_Budget_Line_Item_ID = t.Project_Budget_Expense_Line_Item_ID)
                WHEN t.Project_Budget_Income_Line_Item_ID IS NOT NULL THEN
                    (SELECT c.Budget_Category_Name
                     FROM Project_Budget_Line_Items li
                     INNER JOIN Project_Budget_Categories c ON li.Category_ID = c.Project_Budget_Category_ID
                     WHERE li.Project_Budget_Line_Item_ID = t.Project_Budget_Income_Line_Item_ID)
                ELSE cat.Budget_Category_Name
            END AS lineItemCategoryName,

            -- Purchase request info (for expense transactions)
            t.Purchase_Request_ID AS purchaseRequestId,
            pr.Requisition_GUID AS requisitionGuid,
            pr.Amount AS purchaseRequestAmount,
            pr.Vendor_Name AS purchaseRequestVendor,
            pr.Approval_Status AS purchaseRequestStatus,

            -- Submitted by info
            t.Submitted_By AS submittedByUserId,
            sc.Contact_ID AS submittedByContactId,
            sc.Display_Name AS submittedByName,
            sc.Email_Address AS submittedByEmail

        FROM Project_Budget_Transactions t
        INNER JOIN Projects p ON t.Project_ID = p.Project_ID
        LEFT JOIN Project_Budget_Payment_Methods pm ON t.Payment_Method_ID = pm.Payment_Method_ID
        LEFT JOIN Project_Budget_Categories cat ON t.Project_Budget_Category_ID = cat.Project_Budget_Category_ID
        LEFT JOIN Project_Budget_Purchase_Requests pr ON t.Purchase_Request_ID = pr.Purchase_Request_ID
        LEFT JOIN dp_Users su ON t.Submitted_By = su.User_ID
        LEFT JOIN Contacts sc ON su.Contact_ID = sc.Contact_ID
        WHERE t.Project_Budget_Transaction_ID = @TransactionID
        FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
    );

    -- Return the JSON as a single column
    SELECT @Result AS JsonResult;

END
GO
