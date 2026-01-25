-- WordPress Sync Job Logs Table
-- Stores execution history and logs for sync jobs

CREATE TABLE [dbo].[WordPress_Sync_Job_Logs] (
    [WordPress_Sync_Job_Log_ID] INT IDENTITY(1,1) NOT NULL,
    [Domain_ID] INT NOT NULL DEFAULT 1,
    [WordPress_Sync_Job_ID] INT NOT NULL,
    [Log_Date] DATETIME NOT NULL DEFAULT GETDATE(),
    [Log_Type] NVARCHAR(20) NOT NULL, -- 'info', 'success', 'warning', 'error'
    [Trigger_Type] NVARCHAR(20) NOT NULL, -- 'webhook', 'cron', 'manual'
    [Status] NVARCHAR(20) NOT NULL, -- 'running', 'success', 'failed', 'partial'
    [Records_Processed] INT NULL,
    [Records_Updated] INT NULL,
    [Records_Failed] INT NULL,
    [Error_Message] NVARCHAR(MAX) NULL,
    [Duration_Seconds] INT NULL,
    [Execution_Details] NVARCHAR(MAX) NULL, -- JSON with detailed execution info
    [Triggered_By] INT NULL, -- User_ID for manual triggers

    CONSTRAINT [PK_WordPress_Sync_Job_Logs] PRIMARY KEY CLUSTERED ([WordPress_Sync_Job_Log_ID] ASC),
    CONSTRAINT [FK_WordPress_Sync_Job_Logs_Domain] FOREIGN KEY ([Domain_ID]) REFERENCES [dbo].[dp_Domains]([Domain_ID]),
    CONSTRAINT [FK_WordPress_Sync_Job_Logs_Job] FOREIGN KEY ([WordPress_Sync_Job_ID]) REFERENCES [dbo].[WordPress_Sync_Jobs]([WordPress_Sync_Job_ID]) ON DELETE CASCADE
);

GO

-- Create indexes
CREATE NONCLUSTERED INDEX [IX_WordPress_Sync_Job_Logs_Domain_ID]
ON [dbo].[WordPress_Sync_Job_Logs] ([Domain_ID] ASC);

CREATE NONCLUSTERED INDEX [IX_WordPress_Sync_Job_Logs_Job_ID]
ON [dbo].[WordPress_Sync_Job_Logs] ([WordPress_Sync_Job_ID] ASC);

CREATE NONCLUSTERED INDEX [IX_WordPress_Sync_Job_Logs_Log_Date]
ON [dbo].[WordPress_Sync_Job_Logs] ([Log_Date] DESC);

CREATE NONCLUSTERED INDEX [IX_WordPress_Sync_Job_Logs_Status]
ON [dbo].[WordPress_Sync_Job_Logs] ([Status] ASC);

GO
