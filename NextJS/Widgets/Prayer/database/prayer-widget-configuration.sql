-- =====================================================
-- Prayer Widget Configuration Settings
-- Insert these into dp_Configuration_Settings to configure the widget
-- =====================================================

-- Variables for configuration
DECLARE @DomainID INT = 1;

-- First, check if settings already exist and delete if needed (for re-running script)
DELETE FROM dp_Configuration_Settings
WHERE Application_Code = 'CUSTOMWIDGETS'
AND Key_Name LIKE 'PrayerWidget%';
GO

-- =====================================================
-- Insert All Configuration Settings
-- =====================================================

INSERT INTO dp_Configuration_Settings (Application_Code, Key_Name, Value, Description, Domain_ID)
VALUES
    -- Frontend Behavior Settings (exposed to client)
    ('CUSTOMWIDGETS', 'PrayerWidgetDefaultCardLayout', 'stack',
     'Default card layout for Community Needs section. Options: "stack" (swipeable cards) or "list" (scrollable list). Exposed to frontend.', 1),

    ('CUSTOMWIDGETS', 'PrayerWidgetAllowAnonymous', '0',
     'Allow anonymous prayer submissions without login (1=yes, 0=no). When enabled, prayers can be submitted without authentication. Exposed to frontend.', 1),

    ('CUSTOMWIDGETS', 'PrayerWidgetShowContactNames', '1',
     'Show real contact names or display as Anonymous (1=show names, 0=anonymous). Useful for privacy-focused implementations. Exposed to frontend.', 1),

    ('CUSTOMWIDGETS', 'PrayerWidgetRequireApproval', '1',
     'Require staff approval before prayers are publicly visible (1=yes, 0=no). Users can still see their own unapproved prayers. Exposed to frontend for badge display.', 1),

    -- Server-Side Filtering Settings (NOT exposed to client)
    ('CUSTOMWIDGETS', 'PrayerWidgetEnabledTypes', '1,2',
     'Comma-separated Feedback_Type_IDs to display. Examples: "1" (Prayer only), "2" (Praise only), "1,2" (both). IDs: 1=Prayer Request, 2=Praise Report, 3=Comment, 4=Raving Fan. Used in WHERE clause only.', 1),

    ('CUSTOMWIDGETS', 'PrayerWidgetDaysToShow', '60',
     'Number of days to show non-ongoing prayers. Ongoing prayers (Ongoing_Need=1) are always shown. Default: 60 days. Used in WHERE clause only.', 1),

    ('CUSTOMWIDGETS', 'PrayerWidgetFilterByCampus', '0',
     'Filter prayers by campus/congregation (1=yes, 0=no). When enabled, only prayers from specified campuses are shown. Used in WHERE clause only.', 1),

    ('CUSTOMWIDGETS', 'PrayerWidgetCampusIDs', NULL,
     'Comma-separated Congregation_IDs to include when PrayerWidgetFilterByCampus=1. Example: "1,2,3" to show only those campuses. NULL = all campuses. Used in WHERE clause only.', 1);

-- =====================================================
-- Example: Multi-Site Configuration
-- =====================================================
--
-- To configure for a specific campus (e.g., Main Campus = Congregation_ID 1):
--
-- UPDATE dp_Configuration_Settings
-- SET Value = '1'
-- WHERE Application_Code = 'CUSTOMWIDGETS' AND Key_Name = 'PrayerWidgetFilterByCampus';
--
-- UPDATE dp_Configuration_Settings
-- SET Value = '1'
-- WHERE Application_Code = 'CUSTOMWIDGETS' AND Key_Name = 'PrayerWidgetCampusIDs';
--
-- =====================================================

-- =====================================================
-- Example: Praise-Only Configuration
-- =====================================================
--
-- To create a separate widget instance that shows ONLY praise reports:
--
-- 1. Update Application Labels (see prayer-widget-labels.sql):
--    UPDATE dp_Application_Labels
--    SET English = 'Praise Reports'
--    WHERE Label_Name = 'customWidgets.prayerWidget.widget.title';
--
--    UPDATE dp_Application_Labels
--    SET English = 'Celebrate God''s goodness together'
--    WHERE Label_Name = 'customWidgets.prayerWidget.widget.subtitle';
--
-- 2. Update Configuration Settings to filter to Praise only:
--    UPDATE dp_Configuration_Settings
--    SET Value = '2'
--    WHERE Application_Code = 'CUSTOMWIDGETS' AND Key_Name = 'PrayerWidgetEnabledTypes';
--
-- =====================================================

-- =====================================================
-- Example: List View by Default
-- =====================================================
--
-- To show prayers in list view instead of stack view by default:
--
-- UPDATE dp_Configuration_Settings
-- SET Value = 'list'
-- WHERE Application_Code = 'CUSTOMWIDGETS' AND Key_Name = 'PrayerWidgetDefaultCardLayout';
--
-- =====================================================

-- Verify settings were inserted
SELECT
    Application_Code,
    Key_Name,
    Value,
    Description
FROM dp_Configuration_Settings
WHERE Application_Code = 'CUSTOMWIDGETS'
AND Key_Name LIKE 'PrayerWidget%'
ORDER BY Key_Name;
GO
