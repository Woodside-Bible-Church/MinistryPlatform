-- =============================================
-- Cancellations Widget - Database Schema
-- MinistryPlatform Custom Tables
-- =============================================

-- =============================================
-- 1. Lookup Table: __CancellationStatuses
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = '__CancellationStatuses')
BEGIN
    CREATE TABLE [dbo].[__CancellationStatuses] (
        [Cancellation_Status_ID] INT IDENTITY(1,1) NOT NULL,
        [Status_Name] NVARCHAR(50) NOT NULL,
        [Domain_ID] INT NOT NULL,
        CONSTRAINT [PK___CancellationStatuses] PRIMARY KEY CLUSTERED ([Cancellation_Status_ID] ASC),
        CONSTRAINT [FK___CancellationStatuses_dp_Domains] FOREIGN KEY ([Domain_ID]) REFERENCES [dbo].[dp_Domains] ([Domain_ID])
    );

    -- Seed data
    INSERT INTO [dbo].[__CancellationStatuses] ([Status_Name], [Domain_ID])
    VALUES
        ('Open', 1),
        ('Modified', 1),
        ('Closed', 1);

    PRINT 'Created table __CancellationStatuses with seed data';
END
ELSE
BEGIN
    PRINT 'Table __CancellationStatuses already exists';
END
GO

-- =============================================
-- 2. Main Table: Congregation_Cancellations
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Congregation_Cancellations')
BEGIN
    CREATE TABLE [dbo].[Congregation_Cancellations] (
        [Congregation_Cancellation_ID] INT IDENTITY(1,1) NOT NULL,
        [Congregation_ID] INT NOT NULL,
        [Cancellation_Status_ID] INT NOT NULL,
        [Reason] NVARCHAR(500) NULL,
        [Expected_Resume_Time] NVARCHAR(200) NULL,
        [Start_Date] DATETIME NOT NULL,
        [End_Date] DATETIME NULL,
        [Domain_ID] INT NOT NULL,
        CONSTRAINT [PK_Congregation_Cancellations] PRIMARY KEY CLUSTERED ([Congregation_Cancellation_ID] ASC),
        CONSTRAINT [FK_Congregation_Cancellations_Congregations] FOREIGN KEY ([Congregation_ID]) REFERENCES [dbo].[Congregations] ([Congregation_ID]),
        CONSTRAINT [FK_Congregation_Cancellations_CancellationStatuses] FOREIGN KEY ([Cancellation_Status_ID]) REFERENCES [dbo].[__CancellationStatuses] ([Cancellation_Status_ID]),
        CONSTRAINT [FK_Congregation_Cancellations_dp_Domains] FOREIGN KEY ([Domain_ID]) REFERENCES [dbo].[dp_Domains] ([Domain_ID])
    );

    -- Create index for efficient lookups
    CREATE NONCLUSTERED INDEX [IX_Congregation_Cancellations_Active]
    ON [dbo].[Congregation_Cancellations] ([Congregation_ID], [Start_Date], [End_Date])
    INCLUDE ([Cancellation_Status_ID], [Reason], [Expected_Resume_Time]);

    PRINT 'Created table Congregation_Cancellations';
END
ELSE
BEGIN
    PRINT 'Table Congregation_Cancellations already exists';
END
GO

-- =============================================
-- 3. Child Table: Congregation_Cancellation_Services
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Congregation_Cancellation_Services')
BEGIN
    CREATE TABLE [dbo].[Congregation_Cancellation_Services] (
        [Congregation_Cancellation_Service_ID] INT IDENTITY(1,1) NOT NULL,
        [Congregation_Cancellation_ID] INT NOT NULL,
        [Service_Name] NVARCHAR(200) NOT NULL,
        [Service_Status] NVARCHAR(50) NOT NULL,
        [Details] NVARCHAR(500) NULL,
        [Sort_Order] INT NOT NULL CONSTRAINT [DF_Congregation_Cancellation_Services_Sort_Order] DEFAULT (0),
        [Domain_ID] INT NOT NULL,
        CONSTRAINT [PK_Congregation_Cancellation_Services] PRIMARY KEY CLUSTERED ([Congregation_Cancellation_Service_ID] ASC),
        CONSTRAINT [FK_Congregation_Cancellation_Services_Congregation_Cancellations] FOREIGN KEY ([Congregation_Cancellation_ID]) REFERENCES [dbo].[Congregation_Cancellations] ([Congregation_Cancellation_ID]) ON DELETE CASCADE,
        CONSTRAINT [FK_Congregation_Cancellation_Services_dp_Domains] FOREIGN KEY ([Domain_ID]) REFERENCES [dbo].[dp_Domains] ([Domain_ID]),
        CONSTRAINT [CK_Congregation_Cancellation_Services_Status] CHECK ([Service_Status] IN ('cancelled', 'modified', 'delayed'))
    );

    PRINT 'Created table Congregation_Cancellation_Services';
END
ELSE
BEGIN
    PRINT 'Table Congregation_Cancellation_Services already exists';
END
GO

-- =============================================
-- 4. Child Table: Congregation_Cancellation_Updates
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Congregation_Cancellation_Updates')
BEGIN
    CREATE TABLE [dbo].[Congregation_Cancellation_Updates] (
        [Congregation_Cancellation_Update_ID] INT IDENTITY(1,1) NOT NULL,
        [Congregation_Cancellation_ID] INT NOT NULL,
        [Update_Message] NVARCHAR(1000) NOT NULL,
        [Update_Timestamp] DATETIME NOT NULL CONSTRAINT [DF_Congregation_Cancellation_Updates_Timestamp] DEFAULT (GETDATE()),
        [Domain_ID] INT NOT NULL,
        CONSTRAINT [PK_Congregation_Cancellation_Updates] PRIMARY KEY CLUSTERED ([Congregation_Cancellation_Update_ID] ASC),
        CONSTRAINT [FK_Congregation_Cancellation_Updates_Congregation_Cancellations] FOREIGN KEY ([Congregation_Cancellation_ID]) REFERENCES [dbo].[Congregation_Cancellations] ([Congregation_Cancellation_ID]) ON DELETE CASCADE,
        CONSTRAINT [FK_Congregation_Cancellation_Updates_dp_Domains] FOREIGN KEY ([Domain_ID]) REFERENCES [dbo].[dp_Domains] ([Domain_ID])
    );

    -- Create index for ordering updates by timestamp
    CREATE NONCLUSTERED INDEX [IX_Congregation_Cancellation_Updates_Timestamp]
    ON [dbo].[Congregation_Cancellation_Updates] ([Congregation_Cancellation_ID], [Update_Timestamp] DESC);

    PRINT 'Created table Congregation_Cancellation_Updates';
END
ELSE
BEGIN
    PRINT 'Table Congregation_Cancellation_Updates already exists';
END
GO
