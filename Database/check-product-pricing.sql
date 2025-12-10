-- Check Product_Option_Prices structure
SELECT COLUMN_NAME, DATA_TYPE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'Product_Option_Prices'
ORDER BY ORDINAL_POSITION;

-- Check Products structure
SELECT COLUMN_NAME, DATA_TYPE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'Products'
ORDER BY ORDINAL_POSITION;

-- Check for discount-related tables
SELECT TABLE_NAME
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_NAME LIKE '%Discount%' OR TABLE_NAME LIKE '%Adjust%' OR TABLE_NAME LIKE '%Scholarship%';

-- Sample actual registration data for winter retreat 2025
SELECT TOP 10
    e.Event_Title,
    ep.Event_Participant_ID,
    c.Display_Name AS Participant_Name,
    id.Invoice_Detail_ID,
    id.Product_ID,
    p.Product_Name,
    id.Item_Quantity,
    pop.Option_Price AS Unit_Price,
    id.Line_Total,
    id.Item_Note
FROM Events e
INNER JOIN Event_Participants ep ON e.Event_ID = ep.Event_ID
INNER JOIN Participants par ON ep.Participant_ID = par.Participant_ID
INNER JOIN Contacts c ON par.Contact_ID = c.Contact_ID
INNER JOIN Invoice_Detail id ON ep.Event_Participant_ID = id.Event_Participant_ID
LEFT JOIN Products p ON id.Product_ID = p.Product_ID
LEFT JOIN Product_Option_Prices pop ON id.Product_Option_Price_ID = pop.Product_Option_Price_ID
WHERE e.Project_ID = 7  -- winter retreat 2025
ORDER BY ep.Event_Participant_ID, id.Invoice_Detail_ID;
