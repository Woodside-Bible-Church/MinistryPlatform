-- =============================================
-- Stored Procedure: api_Custom_GetProjectBudgetSummary_JSON
-- Description: Lightweight procedure for project budget summary (totals only, no line items or transactions)
-- Returns: JSON with project info and aggregated budget totals
-- Parameters: @Slug - Project slug for URL routing
-- =============================================

CREATE OR ALTER PROCEDURE [dbo].[api_Custom_GetProjectBudgetSummary_JSON]
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

    -- Build JSON response with project info and summary totals only
    SELECT @Result =
        (
            SELECT
                -- Project info
                p.Project_ID,
                p.Project_Title,
                p.Slug,
                p.Project_Start,
                p.Project_End,
                p.Expected_Registration_Revenue,
                p.Expected_Discounts_Budget,

                -- Coordinator info
                p.Project_Coordinator AS Coordinator_Contact_ID,
                c.First_Name AS Coordinator_First_Name,
                c.Last_Name AS Coordinator_Last_Name,
                c.Display_Name AS Coordinator_Display_Name,
                c.Email_Address AS Coordinator_Email,

                -- Expense totals
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

                -- Income totals
                (
                    SELECT ISNULL(SUM(pbt.Amount), 0)
                    FROM Project_Budget_Transactions pbt
                    WHERE pbt.Project_ID = p.Project_ID
                        AND pbt.Transaction_Type = 'Income'
                ) AS Total_Actual_Income,

                (
                    SELECT ISNULL(SUM(pbili.Expected_Amount), 0)
                    FROM Project_Budget_Income_Line_Items pbili
                    WHERE pbili.Project_ID = p.Project_ID
                ) + ISNULL(p.Expected_Registration_Revenue, 0) AS Total_Expected_Income

            FROM Projects p
            INNER JOIN Contacts c ON p.Project_Coordinator = c.Contact_ID
            WHERE p.Project_ID = @ProjectID
            FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
        );

    -- Return the JSON as a single column to avoid truncation
    SELECT @Result AS JsonResult;

END
GO
