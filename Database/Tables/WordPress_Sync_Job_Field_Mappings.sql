-- WordPress Sync Job Field Mappings Table
-- Defines field-level mappings for each sync job

CREATE TABLE [dbo].[WordPress_Sync_Job_Field_Mappings] (
    [WordPress_Sync_Job_Field_Mapping_ID] INT IDENTITY(1,1) NOT NULL,
    [Domain_ID] INT NOT NULL DEFAULT 1,
    [WordPress_Sync_Job_ID] INT NOT NULL,
    [WordPress_Field_Name] NVARCHAR(100) NOT NULL,
    [WordPress_Field_Type] NVARCHAR(50) NULL, -- 'text', 'link', 'rich_text', etc.
    [MP_Field_Expression] NVARCHAR(500) NOT NULL, -- Single field or formula
    [Transform_Type] NVARCHAR(50) NULL, -- 'None', 'FormatPhone', 'ConcatAddress', 'FormatDate', 'Custom'
    [Transform_Config] NVARCHAR(MAX) NULL, -- JSON config for complex transforms
    [Display_Order] INT NOT NULL DEFAULT 0,
    [Enabled] BIT NOT NULL DEFAULT 1,
    [Created_Date] DATETIME NOT NULL DEFAULT GETDATE(),
    [Created_By] INT NULL,
    [Modified_Date] DATETIME NOT NULL DEFAULT GETDATE(),
    [Modified_By] INT NULL,

    CONSTRAINT [PK_WordPress_Sync_Job_Field_Mappings] PRIMARY KEY CLUSTERED ([WordPress_Sync_Job_Field_Mapping_ID] ASC),
    CONSTRAINT [FK_WordPress_Sync_Job_Field_Mappings_Domain] FOREIGN KEY ([Domain_ID]) REFERENCES [dbo].[dp_Domains]([Domain_ID]),
    CONSTRAINT [FK_WordPress_Sync_Job_Field_Mappings_Job] FOREIGN KEY ([WordPress_Sync_Job_ID]) REFERENCES [dbo].[WordPress_Sync_Jobs]([WordPress_Sync_Job_ID]) ON DELETE CASCADE
);

GO

-- Create indexes
CREATE NONCLUSTERED INDEX [IX_WordPress_Sync_Job_Field_Mappings_Domain_ID]
ON [dbo].[WordPress_Sync_Job_Field_Mappings] ([Domain_ID] ASC);

CREATE NONCLUSTERED INDEX [IX_WordPress_Sync_Job_Field_Mappings_Job_ID]
ON [dbo].[WordPress_Sync_Job_Field_Mappings] ([WordPress_Sync_Job_ID] ASC);

CREATE NONCLUSTERED INDEX [IX_WordPress_Sync_Job_Field_Mappings_Display_Order]
ON [dbo].[WordPress_Sync_Job_Field_Mappings] ([Display_Order] ASC);

GO
