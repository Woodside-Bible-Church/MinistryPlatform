-- Simple investigation

USE MinistryPlatform;
GO

-- Find the Projects Page_Section
SELECT Page_Section_ID, Page_Section
FROM dp_Page_Sections
WHERE Page_Section = 'Projects';

-- Find Projects Page
SELECT Page_ID, Display_Name
FROM dp_Pages
WHERE Table_Name = 'Projects';

-- Find Budget Pages
SELECT Page_ID, Display_Name, Table_Name
FROM dp_Pages
WHERE Table_Name IN (
    'Project_Budget_Statuses',
    'Project_Budget_Payment_Methods',
    'Project_Budget_Categories',
    'Project_Budget_Expense_Line_Items',
    'Project_Budget_Income_Line_Items',
    'Project_Budget_Transactions'
)
ORDER BY Display_Name;

-- Check Sub Pages columns from earlier
SELECT TOP 5 *
FROM dp_Sub_Pages;

GO
