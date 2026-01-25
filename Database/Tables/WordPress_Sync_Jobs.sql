-- WordPress Sync Jobs Table
-- Stores configuration for automated sync jobs between MinistryPlatform and WordPress

CREATE TABLE [dbo].[WordPress_Sync_Jobs] (
    [WordPress_Sync_Job_ID] INT IDENTITY(1,1) NOT NULL,
    [Domain_ID] INT NOT NULL DEFAULT 1,
    [Job_Name] NVARCHAR(100) NOT NULL,
    [Job_Description] NVARCHAR(500) NULL,
    [WordPress_Page_ID] INT NOT NULL,
    [WordPress_Page_Title] NVARCHAR(200) NOT NULL,
    [MP_Source_Type] NVARCHAR(20) NOT NULL, -- 'Table', 'StoredProc'
    [MP_Source_Name] NVARCHAR(100) NOT NULL,
    [MP_Record_ID] INT NULL, -- For table-based syncs (e.g., Congregation_ID)
    [MP_Filter] NVARCHAR(500) NULL, -- OData filter for table queries
    [Enabled] BIT NOT NULL DEFAULT 1,
    [Webhook_Enabled] BIT NOT NULL DEFAULT 1,
    [Cron_Enabled] BIT NOT NULL DEFAULT 1,
    [Cron_Frequency_Minutes] INT NOT NULL DEFAULT 360,
    [Last_Sync_Date] DATETIME NULL,
    [Last_Sync_Status] NVARCHAR(20) NULL, -- 'success', 'failed', 'partial'
    [Last_Sync_Records_Updated] INT NULL,
    [Last_Sync_Error_Message] NVARCHAR(MAX) NULL,
    [Created_Date] DATETIME NOT NULL DEFAULT GETDATE(),
    [Created_By] INT NULL,
    [Modified_Date] DATETIME NOT NULL DEFAULT GETDATE(),
    [Modified_By] INT NULL,

    CONSTRAINT [PK_WordPress_Sync_Jobs] PRIMARY KEY CLUSTERED ([WordPress_Sync_Job_ID] ASC),
    CONSTRAINT [FK_WordPress_Sync_Jobs_Domain] FOREIGN KEY ([Domain_ID]) REFERENCES [dbo].[dp_Domains]([Domain_ID])
);

GO

-- Create indexes
CREATE NONCLUSTERED INDEX [IX_WordPress_Sync_Jobs_Domain_ID]
ON [dbo].[WordPress_Sync_Jobs] ([Domain_ID] ASC);

CREATE NONCLUSTERED INDEX [IX_WordPress_Sync_Jobs_Enabled]
ON [dbo].[WordPress_Sync_Jobs] ([Enabled] ASC) WHERE [Enabled] = 1;

CREATE NONCLUSTERED INDEX [IX_WordPress_Sync_Jobs_WordPress_Page_ID]
ON [dbo].[WordPress_Sync_Jobs] ([WordPress_Page_ID] ASC);

GO
