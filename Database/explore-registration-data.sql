-- Explore registration data structure for discounts and product options
-- This will help us understand what data is available for the budget page

-- 1. Check Invoice_Detail structure
SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'Invoice_Detail'
ORDER BY ORDINAL_POSITION;

-- 2. Check for discount-related columns
SELECT COLUMN_NAME, DATA_TYPE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'Invoice_Detail'
  AND (COLUMN_NAME LIKE '%Discount%' OR COLUMN_NAME LIKE '%Adjust%')
ORDER BY ORDINAL_POSITION;

-- 3. Explore Event_Products table
SELECT COLUMN_NAME, DATA_TYPE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'Event_Products'
ORDER BY ORDINAL_POSITION;

-- 4. Check Product_Variations table (if exists)
SELECT COLUMN_NAME, DATA_TYPE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'Product_Variations'
ORDER BY ORDINAL_POSITION;

-- 5. Sample registration data for a project (using winter retreat 2025 as example)
SELECT TOP 10
    e.Event_Title,
    ep.Event_Participant_ID,
    c.Display_Name AS Participant_Name,
    id.Invoice_Detail_ID,
    id.Product_ID,
    p.Product_Name,
    id.Quantity,
    id.Unit_Price,
    id.Discount,
    id.Line_Total,
    id.Description
FROM Events e
INNER JOIN Event_Participants ep ON e.Event_ID = ep.Event_ID
INNER JOIN Participants par ON ep.Participant_ID = par.Participant_ID
INNER JOIN Contacts c ON par.Contact_ID = c.Contact_ID
INNER JOIN Invoice_Detail id ON ep.Event_Participant_ID = id.Event_Participant_ID
LEFT JOIN Products p ON id.Product_ID = p.Product_ID
WHERE e.Project_ID = 7  -- winter retreat 2025
ORDER BY ep.Event_Participant_ID, id.Invoice_Detail_ID;

-- 6. Get discount summary by event for a project
SELECT
    e.Event_Title,
    COUNT(DISTINCT ep.Event_Participant_ID) AS Total_Participants,
    SUM(CASE WHEN id.Discount > 0 THEN 1 ELSE 0 END) AS Participants_With_Discounts,
    SUM(ISNULL(id.Discount, 0)) AS Total_Discounts,
    SUM(id.Line_Total) AS Total_Revenue
FROM Events e
INNER JOIN Event_Participants ep ON e.Event_ID = ep.Event_ID
INNER JOIN Invoice_Detail id ON ep.Event_Participant_ID = id.Event_Participant_ID
WHERE e.Project_ID = 7  -- winter retreat 2025
  AND e.Include_Registrations_In_Project_Budgets = 1
GROUP BY e.Event_Title;

-- 7. Get product options breakdown for a project
SELECT
    e.Event_Title,
    p.Product_Name,
    SUM(id.Quantity) AS Total_Quantity,
    AVG(id.Unit_Price) AS Avg_Price,
    SUM(id.Line_Total) AS Total_Revenue,
    COUNT(DISTINCT ep.Event_Participant_ID) AS Participants_Selected
FROM Events e
INNER JOIN Event_Participants ep ON e.Event_ID = ep.Event_ID
INNER JOIN Invoice_Detail id ON ep.Event_Participant_ID = id.Event_Participant_ID
LEFT JOIN Products p ON id.Product_ID = p.Product_ID
WHERE e.Project_ID = 7  -- winter retreat 2025
  AND e.Include_Registrations_In_Project_Budgets = 1
GROUP BY e.Event_Title, p.Product_Name
ORDER BY e.Event_Title, Total_Revenue DESC;
