-- Get registration discounts summary (for expenses view)
SELECT
    e.Project_ID,
    COUNT(DISTINCT id.Invoice_Detail_ID) AS Total_Discount_Line_Items,
    SUM(ABS(id.Line_Total)) AS Total_Discount_Amount
FROM Events e
INNER JOIN Event_Participants ep ON e.Event_ID = ep.Event_ID
INNER JOIN Invoice_Detail id ON ep.Event_Participant_ID = id.Event_Participant_ID
LEFT JOIN Product_Option_Prices pop ON id.Product_Option_Price_ID = pop.Product_Option_Price_ID
WHERE e.Project_ID = 7  -- winter retreat 2025
  AND e.Include_Registrations_In_Project_Budgets = 1
  AND id.Line_Total < 0  -- Negative amounts are discounts
GROUP BY e.Project_ID;

-- Get product/option breakdown (for income view)
SELECT
    p.Product_Name,
    pop.Option_Title,
    COUNT(DISTINCT ep.Event_Participant_ID) AS Participant_Count,
    SUM(id.Item_Quantity) AS Total_Quantity,
    SUM(id.Line_Total) AS Total_Amount
FROM Events e
INNER JOIN Event_Participants ep ON e.Event_ID = ep.Event_ID
INNER JOIN Invoice_Detail id ON ep.Event_Participant_ID = id.Event_Participant_ID
LEFT JOIN Products p ON id.Product_ID = p.Product_ID
LEFT JOIN Product_Option_Prices pop ON id.Product_Option_Price_ID = pop.Product_Option_Price_ID
WHERE e.Project_ID = 7  -- winter retreat 2025
  AND e.Include_Registrations_In_Project_Budgets = 1
GROUP BY p.Product_Name, pop.Option_Title
ORDER BY Total_Amount DESC;
