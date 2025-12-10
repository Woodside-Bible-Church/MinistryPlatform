// Test the API endpoint to see what budget data is being returned
const fetch = require('node-fetch');

async function testBudgetsAPI() {
  try {
    const response = await fetch('http://localhost:3000/api/projects/budgets');

    if (!response.ok) {
      console.error('API Error:', response.status, response.statusText);
      const text = await response.text();
      console.error('Response body:', text);
      return;
    }

    const data = await response.json();
    console.log('=== Projects from API ===');
    console.log(JSON.stringify(data, null, 2));

    console.log('\n=== Budget Summary ===');
    data.forEach(project => {
      console.log(`\nProject: ${project.Project_Title} (ID: ${project.Project_ID})`);
      console.log(`  Total Budget Expense: $${project.Total_Budget_Expense || 0}`);
      console.log(`  Total Budget Revenue: $${project.Total_Budget_Revenue || 0}`);
    });

  } catch (err) {
    console.error('Error:', err.message);
  }
}

testBudgetsAPI();
