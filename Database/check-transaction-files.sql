-- Check files attached to transaction 55

-- First, get the Page_ID for Project_Budget_Transactions
SELECT Page_ID, Display_Name, Table_Name
FROM dp_Pages
WHERE Table_Name = 'Project_Budget_Transactions';

GO

-- Now check files attached to transaction 55
SELECT f.File_ID, f.File_Name, f.Record_ID, f.Page_ID, f.Unique_File_ID, f.Description
FROM dp_Files f
WHERE f.Record_ID = 55
ORDER BY f.File_ID;

GO

-- Check files specifically for the Project_Budget_Transactions page
SELECT f.File_ID, f.File_Name, f.Record_ID, f.Page_ID, f.Unique_File_ID, f.Description, p.Display_Name, p.Table_Name
FROM dp_Files f
LEFT JOIN dp_Pages p ON f.Page_ID = p.Page_ID
WHERE f.Record_ID = 55
  AND p.Table_Name = 'Project_Budget_Transactions';
