-- =============================================
-- Author: Claude Code
-- Create date: 2025-12-03
-- Description: Get project budget data in JSON format for budget management UI
-- Usage:
--   All projects: EXEC api_Custom_GetProjectBudgets_JSON
--   Single project by ID: EXEC api_Custom_GetProjectBudgets_JSON @ProjectID = 3
--   Single project by slug: EXEC api_Custom_GetProjectBudgets_JSON @Slug = 'christmas-2024'
-- =============================================
CREATE OR ALTER PROCEDURE [dbo].[api_Custom_GetProjectBudgets_JSON]
    @ProjectID INT = NULL,
    @Slug NVARCHAR(100) = NULL,
    @UserName NVARCHAR(75) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    -- If Slug is provided, look up the Project_ID
    IF @Slug IS NOT NULL AND @ProjectID IS NULL
    BEGIN
        SELECT @ProjectID = Project_ID
        FROM Projects
        WHERE Slug = @Slug;
    END

    -- Build JSON result into a variable to avoid truncation
    DECLARE @Result NVARCHAR(MAX);

    -- Get projects with budget aggregations
    SELECT @Result = (
        SELECT
            p.Project_ID,
            p.Project_Title,
            p.Slug,
            p.Project_Coordinator,
            c.Display_Name AS Coordinator_Name,
            c.First_Name AS Coordinator_First_Name,
            c.Last_Name AS Coordinator_Last_Name,
            c.Email_Address AS Coordinator_Email,
            c.Contact_ID,
            p.Project_Start,
            p.Project_End,
            p.Project_Approved,
            p.Project_Type_ID,
            pt.Project_Type,

            -- Budget fields
            p.Budgets_Enabled,
            p.Budget_Status_ID,
            pbs.Status_Name AS Budget_Status_Name,
            pbs.Display_Color AS Budget_Status_Color,
            p.Budget_Locked,
            p.Expected_Registration_Revenue,

            -- Calculate total budgeted amount from Project_Budget_Categories
            (
                SELECT ISNULL(SUM(pbc.Budgeted_Amount), 0)
                FROM Project_Budget_Categories pbc
                WHERE pbc.Project_ID = p.Project_ID
            ) AS Total_Budget,

            -- Calculate actual expenses from Project_Budget_Transactions (Expense transactions only)
            (
                SELECT ISNULL(SUM(pbt.Amount), 0)
                FROM Project_Budget_Transactions pbt
                WHERE pbt.Project_ID = p.Project_ID
                    AND pbt.Transaction_Type = 'Expense'
            ) AS Total_Actual_Expenses,

            -- Calculate actual income from Project_Budget_Transactions (Income transactions only)
            -- Plus registration income from events with Include_Registrations_In_Project_Budgets = 1
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

            -- Calculate expected income from Expected_Registration_Revenue + Income Line Items
            ISNULL(p.Expected_Registration_Revenue, 0) +
            (
                SELECT ISNULL(SUM(pbili.Expected_Amount), 0)
                FROM Project_Budget_Income_Line_Items pbili
                WHERE pbili.Project_ID = p.Project_ID
            ) AS Total_Expected_Income,

            -- Note: Categories and budgets will be fetched separately via API if needed
            -- to avoid JSON nesting issues
            NULL AS Categories_JSON

        FROM Projects p
        LEFT JOIN dp_Users u ON p.Project_Coordinator = u.User_ID
        LEFT JOIN Contacts c ON u.Contact_ID = c.Contact_ID
        LEFT JOIN Project_Types pt ON p.Project_Type_ID = pt.Project_Type_ID
        LEFT JOIN Project_Budget_Statuses pbs ON p.Budget_Status_ID = pbs.Project_Budget_Status_ID
        WHERE (@ProjectID IS NULL OR p.Project_ID = @ProjectID)
            AND p.Budgets_Enabled = 1
        ORDER BY p.Project_Start DESC
        FOR JSON PATH
    );

    -- Return the JSON as a single column to avoid truncation
    SELECT @Result AS JsonResult;

END
GO
