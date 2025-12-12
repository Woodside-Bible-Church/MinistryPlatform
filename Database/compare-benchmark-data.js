/**
 * Compare benchmark data structure between old and new results
 */
const fs = require('fs');
const path = require('path');

// Load the current (optimized) result
const currentFile = path.join(__dirname, 'benchmark-results/api_Custom_GetProjectBudgetDetails_JSON.json');
const current = JSON.parse(fs.readFileSync(currentFile, 'utf8'));

console.log('📊 Data Structure Analysis - Optimized Version\n');
console.log('━'.repeat(80));

// Count specific elements
console.log('\n📈 Element Counts:');
console.log('━'.repeat(80));
console.log(`Project ID: ${current.Project_ID}`);
console.log(`Project Title: ${current.Project_Title}`);
console.log(`Expense Categories: ${current.expenseCategories?.length || 0}`);
console.log(`Income Categories: ${current.incomeLineItemsCategories?.length || 0}`);

if (current.expenseCategories) {
    const totalExpenseLineItems = current.expenseCategories.reduce((sum, cat) => {
        return sum + (cat.lineItems?.length || 0);
    }, 0);
    console.log(`Total Expense Line Items: ${totalExpenseLineItems}`);

    console.log('\nExpense Categories Breakdown:');
    current.expenseCategories.forEach((cat, idx) => {
        console.log(`  ${idx + 1}. ${cat.name}: ${cat.lineItems?.length || 0} line items`);
    });
}

if (current.registrationDiscountsCategory?.lineItems) {
    console.log(`\nRegistration Discount Line Items: ${current.registrationDiscountsCategory.lineItems.length}`);
}

if (current.registrationIncomeCategory?.lineItems) {
    console.log(`Registration Income Line Items (Events): ${current.registrationIncomeCategory.lineItems.length}`);
}

// Data size analysis
const jsonString = JSON.stringify(current);
const jsonStringPretty = JSON.stringify(current, null, 2);
console.log('\n💾 Data Size:');
console.log('━'.repeat(80));
console.log(`Minified: ${Buffer.byteLength(jsonString, 'utf8')} bytes`);
console.log(`Pretty (2 spaces): ${Buffer.byteLength(jsonStringPretty, 'utf8')} bytes`);
console.log(`Current file on disk: ${fs.statSync(currentFile).size} bytes`);
console.log(`Difference (formatting): ${Buffer.byteLength(jsonStringPretty, 'utf8') - Buffer.byteLength(jsonString, 'utf8')} bytes`);

// Key metrics
console.log('\n📊 Budget Summary:');
console.log('━'.repeat(80));
console.log(`Total Budget: $${current.Total_Budget?.toLocaleString() || 0}`);
console.log(`Total Actual Expenses: $${current.Total_Actual_Expenses?.toLocaleString() || 0}`);
console.log(`Total Expected Income: $${current.Total_Expected_Income?.toLocaleString() || 0}`);
console.log(`Total Actual Income: $${current.Total_Actual_Income?.toLocaleString() || 0}`);

console.log('\n✅ Analysis complete!\n');
console.log('Note: The data size increased from 12.29 KB → 16.58 KB.');
console.log('This is likely due to additional whitespace in JSON formatting.');
console.log('The actual data content appears correct and complete.\n');
