const sql = require('mssql');

const config = {
  user: 'sa',
  password: 'Root1234!',
  server: 'localhost',
  database: 'MinistryPlatform',
  options: {
    encrypt: false,
    trustServerCertificate: true
  }
};

async function checkProjectBudgets() {
  try {
    await sql.connect(config);

    console.log('=== Project_Budgets Table ===');
    const budgets = await sql.query`SELECT * FROM Project_Budgets ORDER BY Project_Budget_ID DESC`;
    console.log(JSON.stringify(budgets.recordset, null, 2));

    console.log('\n=== Project_Expenses Table ===');
    const expenses = await sql.query`SELECT * FROM Project_Expenses ORDER BY Project_Expense_ID DESC`;
    console.log(JSON.stringify(expenses.recordset, null, 2));

    console.log('\n=== Projects with Budget Totals ===');
    const projects = await sql.query`
      SELECT
        p.Project_ID,
        p.Project_Title,
        SUM(CASE WHEN pb.Budget_Type = 'Expense' THEN ISNULL(pb.Budget_Amount, 0) ELSE 0 END) as Total_Budget_Expense,
        SUM(CASE WHEN pb.Budget_Type = 'Revenue' THEN ISNULL(pb.Budget_Amount, 0) ELSE 0 END) as Total_Budget_Revenue,
        COUNT(pb.Project_Budget_ID) as Budget_Count
      FROM Projects p
      LEFT JOIN Project_Budgets pb ON p.Project_ID = pb.Project_ID
      GROUP BY p.Project_ID, p.Project_Title
      ORDER BY p.Project_ID DESC
    `;
    console.log(JSON.stringify(projects.recordset, null, 2));

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await sql.close();
  }
}

checkProjectBudgets();
