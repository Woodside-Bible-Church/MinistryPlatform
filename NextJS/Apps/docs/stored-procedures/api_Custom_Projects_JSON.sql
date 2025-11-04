-- =============================================
-- Author:      Claude Code
-- Create date: 2025-11-03
-- Description: Returns projects with nested budgets and expenses for the Projects app
-- =============================================
ALTER PROCEDURE [dbo].[api_Custom_Projects_JSON]
    @UserName NVARCHAR(75) = NULL,
    @DomainID INT = 1,
    @ProjectID INT = NULL
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @ContactID INT;

    -- Get user's Contact_ID
    SELECT
        @ContactID = c.Contact_ID
    FROM dp_Users u
    INNER JOIN Contacts c ON c.Contact_ID = u.Contact_ID
    WHERE u.User_Name = @UserName
        AND u.Domain_ID = @DomainID;

    -- Return projects with nested data
    SELECT
        p.Project_ID,
        p.Project_Title,
        p.Project_Coordinator AS Project_Coordinator_ID,
        coord.Display_Name AS Project_Coordinator_Name,
        p.Project_Start AS Project_Start_Date,
        p.Project_End AS Project_End_Date,
        p.Project_Group AS Project_Group_ID,
        g.Group_Name AS Project_Group_Name,
        p.Project_Approved,

        -- Nested Budgets
        (
            SELECT
                pb.Project_Budget_ID,
                pb.Project_ID,
                pb.Project_Category_Type_ID,
                pct.Project_Category_Type,
                pct.Is_Revenue,
                pb.Budget_Amount
            FROM Project_Budgets pb
            INNER JOIN Project_Category_Types pct ON pct.Project_Category_Type_ID = pb.Project_Category_Type_ID
            WHERE pb.Project_ID = p.Project_ID
            FOR JSON PATH
        ) AS Budgets,

        -- Nested Expenses
        (
            SELECT
                pe.Project_Expense_ID,
                pe.Project_ID,
                pe.Project_Budget_ID,
                pct.Project_Category_Type AS Project_Budget,
                pe.Expense_Title,
                pe.Requested_By AS Requested_By_Contact_ID,
                req.Display_Name AS Requested_By_Name,
                pe.Paid_To,
                pe.Expense_Date,
                pe.Expense_Amount,
                pe.Event_ID,
                e.Event_Title,
                pe.Expense_Approved
            FROM Project_Expenses pe
            INNER JOIN Contacts req ON req.Contact_ID = pe.Requested_By
            LEFT JOIN Project_Budgets pb ON pb.Project_Budget_ID = pe.Project_Budget_ID
            LEFT JOIN Project_Category_Types pct ON pct.Project_Category_Type_ID = pb.Project_Category_Type_ID
            LEFT JOIN Events e ON e.Event_ID = pe.Event_ID
            WHERE pe.Project_ID = p.Project_ID
            FOR JSON PATH
        ) AS Expenses

    FROM Projects p
    LEFT JOIN Contacts coord ON coord.Contact_ID = p.Project_Coordinator
    LEFT JOIN Groups g ON g.Group_ID = p.Project_Group
    WHERE (@ProjectID IS NULL OR p.Project_ID = @ProjectID)
        -- TODO: Add proper security/permissions later
        -- For now, show all projects to everyone
    ORDER BY p.Project_Start DESC
    FOR JSON PATH;

END
GO
