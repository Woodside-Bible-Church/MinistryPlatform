-- =============================================
-- Stored Procedure: api_Custom_GetProjectBudgetCategories_JSON
-- Description: Get budget categories and line items for a project (no transactions)
-- Returns: JSON with expense categories, income line items, and registration data
-- Parameters: @Slug - Project slug for URL routing
-- =============================================

CREATE OR ALTER PROCEDURE [dbo].[api_Custom_GetProjectBudgetCategories_JSON]
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

    -- Build JSON response with categories and line items
    SELECT @Result =
        (
            SELECT
                -- Project basic info
                p.Project_ID,
                p.Project_Title,
                p.Slug,

                -- Expense Categories with Line Items
                (
                    SELECT
                        pbc.Project_Budget_Category_ID AS categoryId,
                        pct.Project_Category_Type AS name,
                        'expense' AS type,
                        pbc.Budgeted_Amount AS estimated,
                        (
                            SELECT ISNULL(SUM(pbt.Amount), 0)
                            FROM Project_Budget_Transactions pbt
                            WHERE pbt.Project_Budget_Category_ID = pbc.Project_Budget_Category_ID
                                AND pbt.Transaction_Type = 'Expense'
                        ) AS actual,
                        pbc.Sort_Order AS sortOrder,
                        -- Line Items for this category
                        (
                            SELECT
                                pbeli.Project_Budget_Expense_Line_Item_ID AS lineItemId,
                                pbeli.Item_Name AS name,
                                pbeli.Vendor_Name AS vendor,
                                pbeli.Estimated_Amount AS estimated,
                                (
                                    SELECT ISNULL(SUM(pbt.Amount), 0)
                                    FROM Project_Budget_Transactions pbt
                                    WHERE pbt.Project_Budget_Expense_Line_Item_ID = pbeli.Project_Budget_Expense_Line_Item_ID
                                ) AS actual,
                                NULL AS description,
                                pbeli.Sort_Order AS sortOrder
                            FROM Project_Budget_Expense_Line_Items pbeli
                            WHERE pbeli.Project_Budget_Category_ID = pbc.Project_Budget_Category_ID
                            ORDER BY pbeli.Sort_Order
                            FOR JSON PATH
                        ) AS lineItems
                    FROM Project_Budget_Categories pbc
                    INNER JOIN Project_Category_Types pct ON pbc.Project_Category_Type_ID = pct.Project_Category_Type_ID
                    WHERE pbc.Project_ID = p.Project_ID
                    ORDER BY pbc.Sort_Order
                    FOR JSON PATH
                ) AS expenseCategories,

                -- Income Line Items (as single category)
                (
                    SELECT
                        'income-line-items' AS categoryId,
                        'Income' AS name,
                        'revenue' AS type,
                        ISNULL(SUM(pbili.Expected_Amount), 0) AS estimated,
                        (
                            SELECT ISNULL(SUM(pbt.Amount), 0)
                            FROM Project_Budget_Transactions pbt
                            WHERE pbt.Project_ID = p.Project_ID
                                AND pbt.Transaction_Type = 'Income'
                                AND pbt.Project_Budget_Income_Line_Item_ID IS NOT NULL
                        ) AS actual,
                        1 AS sortOrder,
                        -- Income Line Items
                        (
                            SELECT
                                'income-line-' + CAST(pbili.Project_Budget_Income_Line_Item_ID AS NVARCHAR) AS lineItemId,
                                pbili.Income_Source_Name AS name,
                                pbili.Expected_Amount AS estimated,
                                (
                                    SELECT ISNULL(SUM(pbt.Amount), 0)
                                    FROM Project_Budget_Transactions pbt
                                    WHERE pbt.Project_Budget_Income_Line_Item_ID = pbili.Project_Budget_Income_Line_Item_ID
                                ) AS actual
                            FROM Project_Budget_Income_Line_Items pbili
                            WHERE pbili.Project_ID = p.Project_ID
                            FOR JSON PATH
                        ) AS lineItems
                    FROM Project_Budget_Income_Line_Items pbili
                    WHERE pbili.Project_ID = p.Project_ID
                    FOR JSON PATH
                ) AS incomeLineItemsCategories,

                -- Registration Income (as separate category)
                (
                    SELECT
                        'registration-income' AS categoryId,
                        'Registration Revenue' AS name,
                        'revenue' AS type,
                        ISNULL(p.Expected_Registration_Revenue, 0) AS estimated,
                        (
                            SELECT ISNULL(SUM(id.Line_Total), 0)
                            FROM Events e
                            INNER JOIN Event_Participants ep ON e.Event_ID = ep.Event_ID
                            INNER JOIN Invoice_Detail id ON ep.Event_Participant_ID = id.Event_Participant_ID
                            WHERE e.Project_ID = p.Project_ID
                                AND e.Include_Registrations_In_Project_Budgets = 1
                        ) AS actual,
                        0 AS sortOrder,
                        -- Empty line items array
                        (
                            SELECT NULL AS lineItemId
                            WHERE 1=0
                            FOR JSON PATH
                        ) AS lineItems
                    FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
                ) AS registrationIncomeCategory,

                -- Registration Discounts (as separate category)
                (
                    SELECT
                        'registration-discounts' AS categoryId,
                        'Registration Discounts' AS name,
                        'expense' AS type,
                        ISNULL(p.Expected_Discounts_Budget, 0) AS estimated,
                        (
                            SELECT ISNULL(SUM(ABS(id.Line_Total)), 0)
                            FROM Events e
                            INNER JOIN Event_Participants ep ON e.Event_ID = ep.Event_ID
                            INNER JOIN Invoice_Detail id ON ep.Event_Participant_ID = id.Event_Participant_ID
                            WHERE e.Project_ID = p.Project_ID
                                AND e.Include_Registrations_In_Project_Budgets = 1
                                AND id.Line_Total < 0  -- Negative amounts are discounts
                        ) AS actual,
                        999 AS sortOrder,
                        -- Empty line items array
                        (
                            SELECT NULL AS lineItemId
                            WHERE 1=0
                            FOR JSON PATH
                        ) AS lineItems
                    FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
                ) AS registrationDiscountsCategory

            FROM Projects p
            WHERE p.Project_ID = @ProjectID
            FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
        );

    -- Return the JSON as a single column to avoid truncation
    SELECT @Result AS JsonResult;

END
GO
