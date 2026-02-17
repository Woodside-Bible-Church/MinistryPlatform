-- =============================================
-- Migration: Add Carousel_Sort column to Announcements
-- Description: Adds independent sort ordering for carousel/social display modes
-- Date: 2026-02-17
-- =============================================

ALTER TABLE [dbo].[Announcements]
ADD [Carousel_Sort] INT NULL;
GO

-- Initialize Carousel_Sort from existing Sort values so current order is preserved
UPDATE [dbo].[Announcements]
SET [Carousel_Sort] = [Sort]
WHERE [Carousel_Sort] IS NULL;
GO
