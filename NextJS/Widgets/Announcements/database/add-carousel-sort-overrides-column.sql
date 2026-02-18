-- =============================================
-- Migration: Add Carousel_Sort_Overrides column to Announcements
-- Description: Stores per-campus carousel sort overrides as JSON
--              Format: {"15": 3, "16": 7} where keys are Congregation_IDs
--              NULL means all campuses use the base Carousel_Sort value
-- Date: 2026-02-18
-- =============================================

ALTER TABLE [dbo].[Announcements]
ADD [Carousel_Sort_Overrides] NVARCHAR(MAX) NULL;
GO
