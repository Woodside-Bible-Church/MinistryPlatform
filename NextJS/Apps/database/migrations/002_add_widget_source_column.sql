-- Migration: Add source column to widgets table
-- Date: 2025-11-11
-- Description: Adds a source field to distinguish between custom widgets, Ministry Platform widgets, and third-party widgets

-- Add source column to widgets table
ALTER TABLE widgets
ADD COLUMN source VARCHAR(20) NOT NULL DEFAULT 'custom';

-- Add comment to describe the column
COMMENT ON COLUMN widgets.source IS 'Widget source: custom (Woodside dev), ministry_platform (MP official widgets), third_party (external widgets)';

-- Update existing widgets to have 'custom' source (default)
UPDATE widgets SET source = 'custom' WHERE source IS NULL;
