-- =============================================
-- Add Domain_ID and Create dp_Pages Records
-- Author: Claude Code
-- Date: 2025-12-09
-- Description: Adds Domain_ID to all budget tables and creates dp_Pages records
-- =============================================

USE [MinistryPlatform]
GO

PRINT '==========================================='
PRINT 'Adding Domain_ID to Budget Tables'
PRINT '==========================================='
PRINT ''

-- =============================================
-- PHASE 1: Add Domain_ID to all new budget tables
-- =============================================

-- Project_Budget_Statuses
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Project_Budget_Statuses') AND name = 'Domain_ID')
BEGIN
    PRINT 'Adding Domain_ID to Project_Budget_Statuses...'
    ALTER TABLE dbo.Project_Budget_Statuses ADD Domain_ID INT NOT NULL DEFAULT 1;

    ALTER TABLE dbo.Project_Budget_Statuses ADD CONSTRAINT FK_ProjectBudgetStatuses_Domain
        FOREIGN KEY (Domain_ID) REFERENCES dbo.dp_Domains(Domain_ID);

    PRINT 'Domain_ID added to Project_Budget_Statuses.'
END
ELSE
    PRINT 'Domain_ID already exists in Project_Budget_Statuses.'

-- Project_Budget_Payment_Methods
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Project_Budget_Payment_Methods') AND name = 'Domain_ID')
BEGIN
    PRINT 'Adding Domain_ID to Project_Budget_Payment_Methods...'
    ALTER TABLE dbo.Project_Budget_Payment_Methods ADD Domain_ID INT NOT NULL DEFAULT 1;

    ALTER TABLE dbo.Project_Budget_Payment_Methods ADD CONSTRAINT FK_ProjectBudgetPaymentMethods_Domain
        FOREIGN KEY (Domain_ID) REFERENCES dbo.dp_Domains(Domain_ID);

    PRINT 'Domain_ID added to Project_Budget_Payment_Methods.'
END
ELSE
    PRINT 'Domain_ID already exists in Project_Budget_Payment_Methods.'

-- Project_Budget_Categories
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Project_Budget_Categories') AND name = 'Domain_ID')
BEGIN
    PRINT 'Adding Domain_ID to Project_Budget_Categories...'
    ALTER TABLE dbo.Project_Budget_Categories ADD Domain_ID INT NOT NULL DEFAULT 1;

    ALTER TABLE dbo.Project_Budget_Categories ADD CONSTRAINT FK_ProjectBudgetCategories_Domain
        FOREIGN KEY (Domain_ID) REFERENCES dbo.dp_Domains(Domain_ID);

    PRINT 'Domain_ID added to Project_Budget_Categories.'
END
ELSE
    PRINT 'Domain_ID already exists in Project_Budget_Categories.'

-- Project_Budget_Expense_Line_Items
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Project_Budget_Expense_Line_Items') AND name = 'Domain_ID')
BEGIN
    PRINT 'Adding Domain_ID to Project_Budget_Expense_Line_Items...'
    ALTER TABLE dbo.Project_Budget_Expense_Line_Items ADD Domain_ID INT NOT NULL DEFAULT 1;

    ALTER TABLE dbo.Project_Budget_Expense_Line_Items ADD CONSTRAINT FK_ProjectBudgetExpenseLineItems_Domain
        FOREIGN KEY (Domain_ID) REFERENCES dbo.dp_Domains(Domain_ID);

    PRINT 'Domain_ID added to Project_Budget_Expense_Line_Items.'
END
ELSE
    PRINT 'Domain_ID already exists in Project_Budget_Expense_Line_Items.'

-- Project_Budget_Income_Line_Items
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Project_Budget_Income_Line_Items') AND name = 'Domain_ID')
BEGIN
    PRINT 'Adding Domain_ID to Project_Budget_Income_Line_Items...'
    ALTER TABLE dbo.Project_Budget_Income_Line_Items ADD Domain_ID INT NOT NULL DEFAULT 1;

    ALTER TABLE dbo.Project_Budget_Income_Line_Items ADD CONSTRAINT FK_ProjectBudgetIncomeLineItems_Domain
        FOREIGN KEY (Domain_ID) REFERENCES dbo.dp_Domains(Domain_ID);

    PRINT 'Domain_ID added to Project_Budget_Income_Line_Items.'
END
ELSE
    PRINT 'Domain_ID already exists in Project_Budget_Income_Line_Items.'

-- Project_Budget_Transactions
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Project_Budget_Transactions') AND name = 'Domain_ID')
BEGIN
    PRINT 'Adding Domain_ID to Project_Budget_Transactions...'
    ALTER TABLE dbo.Project_Budget_Transactions ADD Domain_ID INT NOT NULL DEFAULT 1;

    ALTER TABLE dbo.Project_Budget_Transactions ADD CONSTRAINT FK_ProjectBudgetTransactions_Domain
        FOREIGN KEY (Domain_ID) REFERENCES dbo.dp_Domains(Domain_ID);

    PRINT 'Domain_ID added to Project_Budget_Transactions.'
END
ELSE
    PRINT 'Domain_ID already exists in Project_Budget_Transactions.'

PRINT ''
PRINT '==========================================='
PRINT 'Creating dp_Pages Records'
PRINT '==========================================='
PRINT ''

-- =============================================
-- PHASE 2: Create dp_Pages records for all budget tables
-- =============================================

-- Project_Budget_Statuses
IF NOT EXISTS (SELECT 1 FROM dp_Pages WHERE Table_Name = 'Project_Budget_Statuses')
BEGIN
    PRINT 'Creating dp_Pages record for Project_Budget_Statuses...'
    INSERT INTO dp_Pages (
        Display_Name,
        Singular_Name,
        View_Order,
        Table_Name,
        Primary_Key,
        Default_Field_List,
        Selected_Record_Expression,
        Suppress_New_Button,
        Display_Copy
    ) VALUES (
        'Project Budget Statuses',
        'Project Budget Status',
        710,
        'Project_Budget_Statuses',
        'Project_Budget_Status_ID',
        'Project_Budget_Statuses.Status_Name, Project_Budget_Statuses.Description, Project_Budget_Statuses.Sort_Order, Project_Budget_Statuses.Display_Color',
        'Project_Budget_Statuses.Status_Name',
        0,
        1
    );
    PRINT 'dp_Pages record created for Project_Budget_Statuses.'
END
ELSE
    PRINT 'dp_Pages record already exists for Project_Budget_Statuses.'

-- Project_Budget_Payment_Methods
IF NOT EXISTS (SELECT 1 FROM dp_Pages WHERE Table_Name = 'Project_Budget_Payment_Methods')
BEGIN
    PRINT 'Creating dp_Pages record for Project_Budget_Payment_Methods...'
    INSERT INTO dp_Pages (
        Display_Name,
        Singular_Name,
        View_Order,
        Table_Name,
        Primary_Key,
        Default_Field_List,
        Selected_Record_Expression,
        Suppress_New_Button,
        Display_Copy
    ) VALUES (
        'Project Budget Payment Methods',
        'Project Budget Payment Method',
        720,
        'Project_Budget_Payment_Methods',
        'Payment_Method_ID',
        'Project_Budget_Payment_Methods.Payment_Method_Name, Project_Budget_Payment_Methods.Sort_Order',
        'Project_Budget_Payment_Methods.Payment_Method_Name',
        0,
        1
    );
    PRINT 'dp_Pages record created for Project_Budget_Payment_Methods.'
END
ELSE
    PRINT 'dp_Pages record already exists for Project_Budget_Payment_Methods.'

-- Project_Budget_Categories
IF NOT EXISTS (SELECT 1 FROM dp_Pages WHERE Table_Name = 'Project_Budget_Categories')
BEGIN
    PRINT 'Creating dp_Pages record for Project_Budget_Categories...'
    INSERT INTO dp_Pages (
        Display_Name,
        Singular_Name,
        View_Order,
        Table_Name,
        Primary_Key,
        Default_Field_List,
        Selected_Record_Expression,
        Suppress_New_Button,
        Display_Copy
    ) VALUES (
        'Project Budget Categories',
        'Project Budget Category',
        1,
        'Project_Budget_Categories',
        'Project_Budget_Category_ID',
        'Project_ID_Table.Project_Title, Project_Category_Type_ID_Table.Project_Category_Type, Project_Budget_Categories.Budgeted_Amount, Project_Budget_Categories.Sort_Order',
        'Project_Category_Type_ID_Table.Project_Category_Type',
        0,
        1
    );
    PRINT 'dp_Pages record created for Project_Budget_Categories.'
END
ELSE
    PRINT 'dp_Pages record already exists for Project_Budget_Categories.'

-- Project_Budget_Expense_Line_Items
IF NOT EXISTS (SELECT 1 FROM dp_Pages WHERE Table_Name = 'Project_Budget_Expense_Line_Items')
BEGIN
    PRINT 'Creating dp_Pages record for Project_Budget_Expense_Line_Items...'
    INSERT INTO dp_Pages (
        Display_Name,
        Singular_Name,
        View_Order,
        Table_Name,
        Primary_Key,
        Default_Field_List,
        Selected_Record_Expression,
        Suppress_New_Button,
        Display_Copy
    ) VALUES (
        'Project Budget Expense Line Items',
        'Project Budget Expense Line Item',
        2,
        'Project_Budget_Expense_Line_Items',
        'Project_Budget_Expense_Line_Item_ID',
        'Project_Budget_Category_ID_Table_Project_Category_Type_ID_Table.Project_Category_Type, Project_Budget_Expense_Line_Items.Item_Name, Project_Budget_Expense_Line_Items.Vendor_Name, Project_Budget_Expense_Line_Items.Estimated_Amount, Project_Budget_Expense_Line_Items.Status',
        'Project_Budget_Expense_Line_Items.Item_Name',
        0,
        1
    );
    PRINT 'dp_Pages record created for Project_Budget_Expense_Line_Items.'
END
ELSE
    PRINT 'dp_Pages record already exists for Project_Budget_Expense_Line_Items.'

-- Project_Budget_Income_Line_Items
IF NOT EXISTS (SELECT 1 FROM dp_Pages WHERE Table_Name = 'Project_Budget_Income_Line_Items')
BEGIN
    PRINT 'Creating dp_Pages record for Project_Budget_Income_Line_Items...'
    INSERT INTO dp_Pages (
        Display_Name,
        Singular_Name,
        View_Order,
        Table_Name,
        Primary_Key,
        Default_Field_List,
        Selected_Record_Expression,
        Suppress_New_Button,
        Display_Copy
    ) VALUES (
        'Project Budget Income Line Items',
        'Project Budget Income Line Item',
        3,
        'Project_Budget_Income_Line_Items',
        'Project_Budget_Income_Line_Item_ID',
        'Project_ID_Table.Project_Title, Project_Budget_Income_Line_Items.Income_Source_Name, Project_Budget_Income_Line_Items.Expected_Amount, Project_Budget_Income_Line_Items.Description',
        'Project_Budget_Income_Line_Items.Income_Source_Name',
        0,
        1
    );
    PRINT 'dp_Pages record created for Project_Budget_Income_Line_Items.'
END
ELSE
    PRINT 'dp_Pages record already exists for Project_Budget_Income_Line_Items.'

-- Project_Budget_Transactions
IF NOT EXISTS (SELECT 1 FROM dp_Pages WHERE Table_Name = 'Project_Budget_Transactions')
BEGIN
    PRINT 'Creating dp_Pages record for Project_Budget_Transactions...'
    INSERT INTO dp_Pages (
        Display_Name,
        Singular_Name,
        View_Order,
        Table_Name,
        Primary_Key,
        Default_Field_List,
        Selected_Record_Expression,
        Suppress_New_Button,
        Display_Copy
    ) VALUES (
        'Project Budget Transactions',
        'Project Budget Transaction',
        4,
        'Project_Budget_Transactions',
        'Project_Budget_Transaction_ID',
        'Project_ID_Table.Project_Title, Project_Budget_Transactions.Transaction_Date, Project_Budget_Transactions.Transaction_Type, Project_Budget_Transactions.Payee_Name, Project_Budget_Transactions.Amount, Payment_Method_ID_Table.Payment_Method_Name, Project_Budget_Transactions.Description',
        'Project_Budget_Transactions.Description',
        0,
        1
    );
    PRINT 'dp_Pages record created for Project_Budget_Transactions.'
END
ELSE
    PRINT 'dp_Pages record already exists for Project_Budget_Transactions.'

PRINT ''
PRINT '==========================================='
PRINT 'Domain_ID and dp_Pages Setup Complete!'
PRINT '==========================================='
GO
