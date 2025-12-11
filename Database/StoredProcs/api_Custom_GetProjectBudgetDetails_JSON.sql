-- =============================================
-- Stored Procedure: api_Custom_GetProjectBudgetDetails_JSON
-- Description: Get detailed budget information for a single project
-- Returns: JSON with project info, categories, line items, income line items, and transactions
-- Parameters: @Slug - Project slug for URL routing
-- =============================================

CREATE OR ALTER PROCEDURE [dbo].[api_Custom_GetProjectBudgetDetails_JSON]
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

    -- Build JSON response with project info, categories, line items, and transactions
    SELECT @Result =
        (
            SELECT
                -- Project basic info
                p.Project_ID,
                p.Project_Title,
                p.Slug,
                p.Project_Start,
                p.Project_End,
                p.Project_Approved,
                p.Expected_Registration_Revenue,
                p.Expected_Discounts_Budget,

                -- Coordinator info
                c.Contact_ID AS Coordinator_Contact_ID,
                c.First_Name AS Coordinator_First_Name,
                c.Last_Name AS Coordinator_Last_Name,
                c.Display_Name AS Coordinator_Display_Name,
                c.Email_Address AS Coordinator_Email,

                -- Budget totals (includes category budgets + expected discounts budget)
                (
                    SELECT ISNULL(SUM(pbc.Budgeted_Amount), 0)
                    FROM Project_Budget_Categories pbc
                    WHERE pbc.Project_ID = p.Project_ID
                ) + ISNULL(p.Expected_Discounts_Budget, 0) AS Total_Budget,

                (
                    SELECT ISNULL(SUM(pbt.Amount), 0)
                    FROM Project_Budget_Transactions pbt
                    WHERE pbt.Project_ID = p.Project_ID
                        AND pbt.Transaction_Type = 'Expense'
                ) AS Total_Actual_Expenses,

                -- Actual income from transactions plus registration revenue
                (
                    SELECT ISNULL(SUM(pbt.Amount), 0)
                    FROM Project_Budget_Transactions pbt
                    WHERE pbt.Project_ID = p.Project_ID
                        AND pbt.Transaction_Type = 'Income'
                ) +
                (
                    SELECT ISNULL(SUM(id.Line_Total), 0)
                    FROM Events e
                    INNER JOIN Event_Participants ep ON e.Event_ID = ep.Event_ID
                    INNER JOIN Invoice_Detail id ON ep.Event_Participant_ID = id.Event_Participant_ID
                    WHERE e.Project_ID = p.Project_ID
                        AND e.Include_Registrations_In_Project_Budgets = 1
                ) AS Total_Actual_Income,

                -- Expected income
                ISNULL(p.Expected_Registration_Revenue, 0) +
                (
                    SELECT ISNULL(SUM(pbili.Expected_Amount), 0)
                    FROM Project_Budget_Income_Line_Items pbili
                    WHERE pbili.Project_ID = p.Project_ID
                ) AS Total_Expected_Income,

                -- Expense categories with line items
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

                        -- Line items for this category
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
                        AND pct.Is_Revenue = 0  -- Expense categories only
                    ORDER BY pbc.Sort_Order
                    FOR JSON PATH
                ) AS expenseCategories,

                -- Registration discounts as a special expense category
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
                        999 AS sortOrder,  -- Display last

                        -- Breakdown by discount type
                        (
                            SELECT
                                'discount-' + CAST(ROW_NUMBER() OVER (ORDER BY SUM(ABS(id.Line_Total)) DESC) AS NVARCHAR) AS lineItemId,
                                ISNULL(pop.Option_Title, 'Other Discounts') AS name,
                                'Registration discount' AS description,
                                0 AS estimated,  -- Individual line items don't have separate budgets
                                SUM(ABS(id.Line_Total)) AS actual,
                                NULL AS vendor,
                                'applied' AS status,
                                ROW_NUMBER() OVER (ORDER BY SUM(ABS(id.Line_Total)) DESC) AS sortOrder
                            FROM Events e
                            INNER JOIN Event_Participants ep ON e.Event_ID = ep.Event_ID
                            INNER JOIN Invoice_Detail id ON ep.Event_Participant_ID = id.Event_Participant_ID
                            LEFT JOIN Product_Option_Prices pop ON id.Product_Option_Price_ID = pop.Product_Option_Price_ID
                            WHERE e.Project_ID = p.Project_ID
                                AND e.Include_Registrations_In_Project_Budgets = 1
                                AND id.Line_Total < 0  -- Negative amounts are discounts
                            GROUP BY pop.Option_Title
                            FOR JSON PATH
                        ) AS lineItems
                    FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
                ) AS registrationDiscountsCategory,

                -- Income line items (non-registration income)
                (
                    SELECT
                        'income-' + CAST(pbili.Project_Budget_Income_Line_Item_ID AS NVARCHAR) AS categoryId,
                        pbili.Income_Source_Name AS name,
                        'revenue' AS type,
                        pbili.Expected_Amount AS estimated,
                        (
                            SELECT ISNULL(SUM(pbt.Amount), 0)
                            FROM Project_Budget_Transactions pbt
                            WHERE pbt.Project_Budget_Income_Line_Item_ID = pbili.Project_Budget_Income_Line_Item_ID
                                AND pbt.Transaction_Type = 'Income'
                        ) AS actual,
                        pbili.Description AS description,
                        pbili.Sort_Order AS sortOrder,

                        -- Create line items array with single item for UI consistency
                        (
                            SELECT
                                'income-line-' + CAST(pbili.Project_Budget_Income_Line_Item_ID AS NVARCHAR) AS lineItemId,
                                pbili.Income_Source_Name AS name,
                                pbili.Description AS description,
                                pbili.Expected_Amount AS estimated,
                                (
                                    SELECT ISNULL(SUM(pbt.Amount), 0)
                                    FROM Project_Budget_Transactions pbt
                                    WHERE pbt.Project_Budget_Income_Line_Item_ID = pbili.Project_Budget_Income_Line_Item_ID
                                        AND pbt.Transaction_Type = 'Income'
                                ) AS actual,
                                NULL AS vendor,
                                'received' AS status,
                                pbili.Sort_Order AS sortOrder
                            FOR JSON PATH
                        ) AS lineItems
                    FROM Project_Budget_Income_Line_Items pbili
                    WHERE pbili.Project_ID = p.Project_ID
                    ORDER BY pbili.Sort_Order
                    FOR JSON PATH
                ) AS incomeLineItemsCategories,

                -- Registration income as a special category
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
                        'Income from event registrations' AS description,
                        0 AS sortOrder,

                        -- Breakdown by event
                        (
                            SELECT
                                'reg-event-' + CAST(e.Event_ID AS NVARCHAR) AS lineItemId,
                                e.Event_Title AS name,
                                'Event registrations' AS description,
                                0 AS estimated,  -- We don't have per-event estimates
                                (
                                    SELECT ISNULL(SUM(id.Line_Total), 0)
                                    FROM Event_Participants ep2
                                    INNER JOIN Invoice_Detail id ON ep2.Event_Participant_ID = id.Event_Participant_ID
                                    WHERE ep2.Event_ID = e.Event_ID
                                ) AS actual,
                                NULL AS vendor,
                                'received' AS status,
                                0 AS sortOrder
                            FROM Events e
                            WHERE e.Project_ID = p.Project_ID
                                AND e.Include_Registrations_In_Project_Budgets = 1
                            FOR JSON PATH
                        ) AS lineItems
                    FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
                ) AS registrationIncomeCategory

            FROM Projects p
            LEFT JOIN Contacts c ON p.Project_Coordinator = c.Contact_ID
            WHERE p.Project_ID = @ProjectID
            FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
        );

    -- Return the JSON as a single column to avoid truncation
    SELECT @Result AS JsonResult;

END
GO
