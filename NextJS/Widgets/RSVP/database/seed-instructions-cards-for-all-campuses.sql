-- ===================================================================
-- Seed Instructions Cards for All Campuses
-- ===================================================================
-- Date: 2025-11-20
-- Description: Creates "What to Expect" instruction cards for each campus
--              for Project ID 5 (Christmas 2025)
-- ===================================================================

USE [MinistryPlatform]
GO

-- ===================================================================
-- Insert Instructions card for each campus
-- ===================================================================

PRINT 'Inserting "What to Expect" instruction cards for all campuses...';

-- Ensure IDENTITY_INSERT is OFF (we want SQL Server to auto-generate IDs)
SET IDENTITY_INSERT [dbo].[Project_Confirmation_Cards] OFF;

-- Card configuration JSON
DECLARE @CardConfig NVARCHAR(MAX) = N'{
  "title": "What to Expect",
  "bullets": [
    {
      "icon": "Clock",
      "text": "Arrive early to find parking and get settled"
    },
    {
      "icon": "Baby",
      "text": "Kids programming available for all ages"
    },
    {
      "icon": "Music",
      "text": "Services last approximately 60 minutes"
    },
    {
      "icon": "Heart",
      "text": "Dress casually - come as you are"
    }
  ]
}';

-- Insert card for each specified campus
INSERT INTO [dbo].[Project_Confirmation_Cards] (
    Project_ID,
    Congregation_ID,
    Card_Type_ID,
    Card_Configuration,
    Display_Order,
    Is_Active,
    Domain_ID
)
VALUES
    (5, 4, 1, @CardConfig, 1, 1, 1),   -- Algonac
    (5, 6, 1, @CardConfig, 1, 1, 1),   -- Detroit
    (5, 8, 1, @CardConfig, 1, 1, 1),   -- Farmington Hills
    (5, 9, 1, @CardConfig, 1, 1, 1),   -- Lake Orion
    (5, 10, 1, @CardConfig, 1, 1, 1),  -- Lapeer
    (5, 11, 1, @CardConfig, 1, 1, 1),  -- Plymouth
    (5, 12, 1, @CardConfig, 1, 1, 1),  -- Pontiac
    (5, 13, 1, @CardConfig, 1, 1, 1),  -- Romeo
    (5, 14, 1, @CardConfig, 1, 1, 1),  -- Royal Oak
    (5, 15, 1, @CardConfig, 1, 1, 1),  -- Troy
    (5, 16, 1, @CardConfig, 1, 1, 1),  -- Warren
    (5, 17, 1, @CardConfig, 1, 1, 1),  -- White Lake
    (5, 20, 1, @CardConfig, 1, 1, 1),  -- Chesterfield
    (5, 26, 1, @CardConfig, 1, 1, 1),  -- Downriver
    (5, 27, 1, @CardConfig, 1, 1, 1);  -- Troy Español

PRINT 'Inserted ' + CAST(@@ROWCOUNT AS NVARCHAR(10)) + ' instruction cards';
GO

-- ===================================================================
-- Verify the data
-- ===================================================================

PRINT '';
PRINT '===================================================================';
PRINT 'Verification: Cards created for each campus';
PRINT '===================================================================';

SELECT
    pcc.Project_Confirmation_Card_ID,
    pcc.Project_ID,
    c.Congregation_Name AS Campus,
    ct.Card_Type_Name,
    pcc.Display_Order,
    pcc.Is_Active
FROM Project_Confirmation_Cards pcc
INNER JOIN Congregations c ON pcc.Congregation_ID = c.Congregation_ID
INNER JOIN Card_Types ct ON pcc.Card_Type_ID = ct.Card_Type_ID
WHERE pcc.Project_ID = 5
ORDER BY c.Congregation_Name;

PRINT '';
PRINT '===================================================================';
PRINT 'Migration Complete!';
PRINT '';
PRINT 'Each campus now has a "What to Expect" instruction card with:';
PRINT '  - Arrive early to find parking and get settled';
PRINT '  - Kids programming available for all ages';
PRINT '  - Services last approximately 60 minutes';
PRINT '  - Dress casually - come as you are';
PRINT '';
PRINT 'Next Steps:';
PRINT '  1. Refresh the RSVP Management app to see the cards';
PRINT '  2. Edit individual campus cards in MinistryPlatform if needed';
PRINT '  3. Adjust Display_Order if you add more cards later';
PRINT '===================================================================';
GO
