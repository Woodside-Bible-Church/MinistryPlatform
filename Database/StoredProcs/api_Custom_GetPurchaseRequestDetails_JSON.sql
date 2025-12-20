-- =============================================
-- Stored Procedure: api_Custom_GetPurchaseRequestDetails_JSON
-- Description: Get detailed information about a single purchase request including transactions
-- Returns: JSON with purchase request details and associated transactions
-- Parameters: @PurchaseRequestID - Purchase Request ID
-- =============================================

CREATE OR ALTER PROCEDURE [dbo].[api_Custom_GetPurchaseRequestDetails_JSON]
    @PurchaseRequestID INT,
    @UserName NVARCHAR(75) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    -- Build JSON result
    DECLARE @Result NVARCHAR(MAX);

    SELECT @Result = (
        SELECT
            pr.Purchase_Request_ID AS purchaseRequestId,
            pr.Requisition_GUID AS requisitionGuid,
            pr.Project_ID AS projectId,
            pr.Project_Budget_Line_Item_ID AS lineItemId,

            -- Project info
            p.Project_Title AS projectName,
            p.Slug AS projectSlug,

            -- Line item info
            li.Line_Item_Name AS lineItemName,
            pbc.Project_Budget_Category_ID AS categoryId,
            pbc.Budget_Category_Name AS categoryName,

            -- Request details
            pr.Amount AS amount,
            pr.Description AS description,
            pr.Vendor_Name AS vendorName,
            pr.Requested_Date AS requestedDate,
            pr.Approval_Status AS approvalStatus,
            pr.Approved_Date AS approvedDate,
            pr.Rejection_Reason AS rejectionReason,

            -- Requester info
            reqC.Contact_ID AS requestedByContactId,
            reqC.Display_Name AS requestedByName,
            reqC.Email_Address AS requestedByEmail,

            -- Approver info
            appC.Contact_ID AS approvedByContactId,
            appC.Display_Name AS approvedByName,

            -- Transactions associated with this purchase request - using ISNULL to prevent null JSON
            ISNULL((
                SELECT
                    t.Project_Budget_Transaction_ID AS transactionId,
                    t.Transaction_Date AS transactionDate,
                    t.Amount AS amount,
                    t.Description AS description,
                    t.Payee_Name AS vendorName,
                    pm.Payment_Method_Name AS paymentMethod,
                    pm.Payment_Method_ID AS paymentMethodId
                FROM Project_Budget_Transactions t
                LEFT JOIN Project_Budget_Payment_Methods pm
                    ON t.Payment_Method_ID = pm.Payment_Method_ID
                WHERE t.Purchase_Request_ID = pr.Purchase_Request_ID
                ORDER BY t.Transaction_Date DESC
                FOR JSON PATH
            ), '[]') AS transactions,

            -- Transaction summary
            (
                SELECT COUNT(*)
                FROM Project_Budget_Transactions t
                WHERE t.Purchase_Request_ID = pr.Purchase_Request_ID
            ) AS transactionCount,
            (
                SELECT ISNULL(SUM(t.Amount), 0)
                FROM Project_Budget_Transactions t
                WHERE t.Purchase_Request_ID = pr.Purchase_Request_ID
            ) AS transactionTotal,

            -- Remaining amount (requested - actually spent)
            pr.Amount - (
                SELECT ISNULL(SUM(t.Amount), 0)
                FROM Project_Budget_Transactions t
                WHERE t.Purchase_Request_ID = pr.Purchase_Request_ID
            ) AS remainingAmount,

            -- Files - using ISNULL to prevent null JSON
            ISNULL((
                SELECT
                    f.File_ID AS FileId,
                    f.File_Name AS FileName,
                    f.File_Size AS FileSize,
                    f.Extension AS FileExtension,
                    f.Image_Width AS ImageWidth,
                    f.Image_Height AS ImageHeight,
                    CAST(f.Unique_Name AS NVARCHAR(50)) AS UniqueFileId,
                    f.Summary AS Description,
                    f.UTC_Date_Added AS LastUpdated,
                    'https://my.woodsidebible.org/ministryplatformapi/files/' + CAST(f.Unique_Name AS NVARCHAR(50)) AS publicUrl
                FROM dp_Files f
                WHERE f.Record_ID = pr.Purchase_Request_ID
                  AND f.Page_ID = (SELECT Page_ID FROM dp_Pages WHERE Table_Name = 'Project_Budget_Purchase_Requests')
                ORDER BY f.UTC_Date_Added DESC
                FOR JSON PATH
            ), '[]') AS files

        FROM Project_Budget_Purchase_Requests pr
        INNER JOIN Project_Budget_Line_Items li
            ON pr.Project_Budget_Line_Item_ID = li.Project_Budget_Line_Item_ID
        INNER JOIN Project_Budget_Categories pbc
            ON li.Category_ID = pbc.Project_Budget_Category_ID
        INNER JOIN Projects p
            ON pr.Project_ID = p.Project_ID
        INNER JOIN dp_Users reqU
            ON pr.Requested_By_User_ID = reqU.User_ID
        INNER JOIN Contacts reqC
            ON reqU.Contact_ID = reqC.Contact_ID
        LEFT JOIN dp_Users appU
            ON pr.Approved_By_User_ID = appU.User_ID
        LEFT JOIN Contacts appC
            ON appU.Contact_ID = appC.Contact_ID
        WHERE pr.Purchase_Request_ID = @PurchaseRequestID
        FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
    );

    -- Return the JSON as a single column
    SELECT ISNULL(@Result, '{}') AS JsonResult;

END
GO
