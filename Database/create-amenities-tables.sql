-- =====================================================
-- Event Amenities System
-- Creates lookup table for amenity types and junction table for event-amenity relationships
-- Author: Colton Wirgau
-- Date: 2025-12-12
-- =====================================================

USE MinistryPlatform;
GO

-- =====================================================
-- Amenities Lookup Table
-- Stores reusable amenity types (childcare, ASL, etc.)
-- =====================================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Amenities]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[Amenities] (
        [Amenity_ID] INT IDENTITY(1,1) NOT NULL,
        [Amenity_Name] NVARCHAR(100) NOT NULL,
        [Amenity_Description] NVARCHAR(500) NULL,
        [Icon_Name] NVARCHAR(50) NOT NULL,
        [Icon_Color] dp_Color NULL,  -- MinistryPlatform UDT for color picker
        [Display_Order] INT NOT NULL DEFAULT 0,
        [Is_Active] BIT NOT NULL DEFAULT 1,
        [Domain_ID] INT NOT NULL DEFAULT 1,
        [__ExternalID] NVARCHAR(50) NULL,
        [_Approved] BIT NOT NULL DEFAULT 1,
        [_Audit_User_ID] INT NULL,
        [_Audit_Timestamp] DATETIME NOT NULL DEFAULT GETDATE(),
        CONSTRAINT [PK_Amenities] PRIMARY KEY CLUSTERED ([Amenity_ID] ASC),
        CONSTRAINT [FK_Amenities_Domain] FOREIGN KEY ([Domain_ID])
            REFERENCES [dbo].[dp_Domains]([Domain_ID])
    );

    PRINT 'Created table: Amenities';
END
ELSE
    PRINT 'Table already exists: Amenities';
GO

-- =====================================================
-- Event_Amenities Junction Table
-- Links events to their available amenities
-- =====================================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Event_Amenities]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[Event_Amenities] (
        [Event_Amenity_ID] INT IDENTITY(1,1) NOT NULL,
        [Event_ID] INT NOT NULL,
        [Amenity_ID] INT NOT NULL,
        [Domain_ID] INT NOT NULL DEFAULT 1,
        [__ExternalID] NVARCHAR(50) NULL,
        [_Approved] BIT NOT NULL DEFAULT 1,
        [_Audit_User_ID] INT NULL,
        [_Audit_Timestamp] DATETIME NOT NULL DEFAULT GETDATE(),
        CONSTRAINT [PK_Event_Amenities] PRIMARY KEY CLUSTERED ([Event_Amenity_ID] ASC),
        CONSTRAINT [FK_Event_Amenities_Event] FOREIGN KEY ([Event_ID])
            REFERENCES [dbo].[Events]([Event_ID]),
        CONSTRAINT [FK_Event_Amenities_Amenity] FOREIGN KEY ([Amenity_ID])
            REFERENCES [dbo].[Amenities]([Amenity_ID]),
        CONSTRAINT [FK_Event_Amenities_Domain] FOREIGN KEY ([Domain_ID])
            REFERENCES [dbo].[dp_Domains]([Domain_ID]),
        CONSTRAINT [UQ_Event_Amenity] UNIQUE ([Event_ID], [Amenity_ID])
    );

    PRINT 'Created table: Event_Amenities';
END
ELSE
    PRINT 'Table already exists: Event_Amenities';
GO

-- =====================================================
-- Indexes for Performance
-- =====================================================
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_EventAmenities_Event' AND object_id = OBJECT_ID('Event_Amenities'))
BEGIN
    CREATE NONCLUSTERED INDEX [IX_EventAmenities_Event]
        ON [dbo].[Event_Amenities]([Event_ID]);
    PRINT 'Created index: IX_EventAmenities_Event';
END

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_EventAmenities_Amenity' AND object_id = OBJECT_ID('Event_Amenities'))
BEGIN
    CREATE NONCLUSTERED INDEX [IX_EventAmenities_Amenity]
        ON [dbo].[Event_Amenities]([Amenity_ID]);
    PRINT 'Created index: IX_EventAmenities_Amenity';
END

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Amenities_DisplayOrder' AND object_id = OBJECT_ID('Amenities'))
BEGIN
    CREATE NONCLUSTERED INDEX [IX_Amenities_DisplayOrder]
        ON [dbo].[Amenities]([Display_Order], [Is_Active]);
    PRINT 'Created index: IX_Amenities_DisplayOrder';
END
GO

-- =====================================================
-- Seed Data - Initial Amenity Types
-- =====================================================
IF NOT EXISTS (SELECT 1 FROM Amenities WHERE Amenity_Name = 'Childcare (0-4)')
BEGIN
    INSERT INTO [dbo].[Amenities] (
        [Amenity_Name],
        [Amenity_Description],
        [Icon_Name],
        [Icon_Color],
        [Display_Order],
        [Domain_ID]
    )
    VALUES
        ('Childcare (0-4)', 'Woodside Kids Environments available for ages 0-4', 'Baby', '#3B82F6', 1, 1),
        ('Special Needs Care', 'Special Needs Kids Class available for ages 0-14', 'Heart', '#8B5CF6', 2, 1),
        ('ASL Interpretation', 'American Sign Language interpretation available', 'Languages', '#10B981', 3, 1),
        ('High Capacity', 'This service historically fills quickly - arrive early or consider another time', 'AlertTriangle', '#F59E0B', 4, 1);

    PRINT 'Seeded 4 initial amenity types';
END
ELSE
    PRINT 'Amenities already seeded';
GO

PRINT 'Event Amenities system created successfully!';
GO
