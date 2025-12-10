const sqlcmd = require('child_process').execSync;

// Query to get income categories and line items for Project 7
const query = `
SET NOCOUNT ON;

-- Get income categories with their line items
SELECT
    pbc.Project_Budget_Category_ID AS categoryId,
    pct.Project_Category_Type AS categoryName,
    pct.Project_Category_Type_ID AS categoryTypeId,
    (
        SELECT
            pbeli.Project_Budget_Expense_Line_Item_ID AS lineItemId,
            pbeli.Item_Name AS itemName,
            ISNULL(pbeli.Estimated_Amount, 0) AS estimatedAmount,
            ISNULL(pbeli.Actual_Amount, 0) AS actualAmount,
            (ISNULL(pbeli.Actual_Amount, 0) - ISNULL(pbeli.Estimated_Amount, 0)) AS variance,
            pbeli.Notes AS notes
        FROM Project_Budget_Expense_Line_Items pbeli
        WHERE pbeli.Project_Budget_Category_ID = pbc.Project_Budget_Category_ID
        ORDER BY pbeli.Item_Name
        FOR JSON PATH
    ) AS lineItems,
    ISNULL(
        (SELECT SUM(pbeli.Estimated_Amount)
         FROM Project_Budget_Expense_Line_Items pbeli
         WHERE pbeli.Project_Budget_Category_ID = pbc.Project_Budget_Category_ID),
        0
    ) AS estimatedTotal,
    ISNULL(
        (SELECT SUM(pbeli.Actual_Amount)
         FROM Project_Budget_Expense_Line_Items pbeli
         WHERE pbeli.Project_Budget_Category_ID = pbc.Project_Budget_Category_ID),
        0
    ) AS actualTotal
FROM Project_Budget_Categories pbc
INNER JOIN Project_Category_Types pct ON pbc.Project_Category_Type_ID = pct.Project_Category_Type_ID
WHERE pbc.Project_ID = 7
    AND pct.Project_Category_Type IN ('Income', 'Registration Income')
ORDER BY pct.Project_Category_Type
FOR JSON PATH;
`;

try {
    const result = sqlcmd(`sqlcmd -S localhost -d MinistryPlatform -Q "${query.replace(/"/g, '\\"')}" -h -1 -W -C`, {
        encoding: 'utf8',
        maxBuffer: 10 * 1024 * 1024
    });

    // Clean up the output
    let jsonStr = result.toString().trim();

    // Remove any leading/trailing whitespace and SQL messages
    jsonStr = jsonStr.replace(/^\s*\n/gm, '');

    console.log('Raw result:');
    console.log(jsonStr);
    console.log('\n---\n');

    // Parse and pretty print
    if (jsonStr) {
        const data = JSON.parse(jsonStr);
        console.log('Parsed income categories:');
        console.log(JSON.stringify(data, null, 2));

        // Analyze structure
        console.log('\n--- Analysis ---');
        data.forEach(cat => {
            console.log(`\nCategory: ${cat.categoryName} (ID: ${cat.categoryId})`);
            console.log(`  Type ID: ${cat.categoryTypeId}`);
            console.log(`  Estimated Total: $${cat.estimatedTotal}`);
            console.log(`  Actual Total: $${cat.actualTotal}`);
            console.log(`  Line Items: ${cat.lineItems ? `${JSON.parse(cat.lineItems).length} items` : 'NULL'}`);

            if (cat.lineItems) {
                const lineItems = JSON.parse(cat.lineItems);
                lineItems.forEach(li => {
                    console.log(`    - ${li.itemName}: Est=$${li.estimatedAmount}, Act=$${li.actualAmount}`);
                });
            }
        });
    } else {
        console.log('No income categories found');
    }
} catch (error) {
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
}
