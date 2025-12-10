-- Add fake revenue transactions for merch sales
-- Merch Weekend #1 (ID: 4) - Expected: $2,000
-- Let's say they did better than expected

INSERT INTO Project_Budget_Transactions (
    Project_ID,
    Project_Budget_Income_Line_Item_ID,
    Transaction_Type,
    Transaction_Date,
    Amount,
    Description,
    Domain_ID
) VALUES
-- Merch Weekend #1 - Multiple sales
(7, 4, 'Income', '2025-01-10', 450.00, 'T-shirt sales - Weekend 1 Friday', 1),
(7, 4, 'Income', '2025-01-11', 875.00, 'T-shirt and hoodie sales - Weekend 1 Saturday', 1),
(7, 4, 'Income', '2025-01-12', 325.00, 'Remaining merch sales - Weekend 1 Sunday', 1),

-- Merch Weekend #2 - Slightly less
(7, 5, 'Income', '2025-01-17', 380.00, 'T-shirt sales - Weekend 2 Friday', 1),
(7, 5, 'Income', '2025-01-18', 720.00, 'T-shirt and hoodie sales - Weekend 2 Saturday', 1),
(7, 5, 'Income', '2025-01-19', 290.00, 'Remaining merch sales - Weekend 2 Sunday', 1),

-- Merch Weekend #3 - Best weekend
(7, 6, 'Income', '2025-01-24', 520.00, 'T-shirt sales - Weekend 3 Friday', 1),
(7, 6, 'Income', '2025-01-25', 950.00, 'T-shirt and hoodie sales - Weekend 3 Saturday', 1),
(7, 6, 'Income', '2025-01-26', 410.00, 'Remaining merch sales - Weekend 3 Sunday', 1);

-- Verify the transactions were added
SELECT
    pbt.Project_Budget_Transaction_ID,
    pbt.Transaction_Date,
    pbt.Amount,
    pbt.Description,
    pbili.Income_Source_Name
FROM Project_Budget_Transactions pbt
INNER JOIN Project_Budget_Income_Line_Items pbili
    ON pbt.Project_Budget_Income_Line_Item_ID = pbili.Project_Budget_Income_Line_Item_ID
WHERE pbt.Project_ID = 7
    AND pbt.Transaction_Type = 'Income'
    AND pbili.Income_Source_Name LIKE 'Merch%'
ORDER BY pbt.Transaction_Date;
