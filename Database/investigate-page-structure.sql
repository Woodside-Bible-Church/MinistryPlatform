-- Investigate current page structure for Projects

USE MinistryPlatform;
GO

-- Find the Projects Page_Section
PRINT 'Projects Page_Section:';
SELECT Page_Section_ID, Page_Section, Sort_Order
FROM dp_Page_Sections
WHERE Page_Section LIKE '%Project%';

PRINT '';
PRINT 'Projects Page_Section Pages:';
SELECT psp.Page_Section_Page_ID, ps.Page_Section, p.Display_Name, p.Page_ID
FROM dp_Page_Section_Pages psp
INNER JOIN dp_Page_Sections ps ON psp.Page_Section_ID = ps.Page_Section_ID
INNER JOIN dp_Pages p ON psp.Page_ID = p.Page_ID
WHERE ps.Page_Section = 'Projects'
ORDER BY p.Display_Name;

PRINT '';
PRINT 'Our Budget Pages:';
SELECT Page_ID, Display_Name, Table_Name, View_Order
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

PRINT '';
PRINT 'Current Sub Pages on Projects:';
SELECT sp.Sub_Page_ID, p.Display_Name AS Parent_Page, sp.Display_Name AS Tab_Name, sp2.Display_Name AS Related_Page
FROM dp_Sub_Pages sp
INNER JOIN dp_Pages p ON sp.Page_ID = p.Page_ID
LEFT JOIN dp_Pages sp2 ON sp.Related_Page_ID = sp2.Page_ID
WHERE p.Table_Name = 'Projects'
ORDER BY sp.Sub_Page_ID;

GO
