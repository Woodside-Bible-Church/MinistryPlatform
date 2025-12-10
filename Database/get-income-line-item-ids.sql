-- Get income line item IDs for merch sales
SELECT
    Project_Budget_Income_Line_Item_ID,
    Income_Source_Name,
    Expected_Amount
FROM Project_Budget_Income_Line_Items
WHERE Project_ID = 7
    AND Income_Source_Name LIKE 'Merch%'
ORDER BY Income_Source_Name;
