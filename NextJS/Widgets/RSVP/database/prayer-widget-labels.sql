-- =====================================================
-- Prayer Widget Application Labels
-- Insert these into dp_Application_Labels for multi-language support
-- =====================================================

-- Variables for configuration
DECLARE
    @APIClientID INT = 25,  -- Your API Client ID (e.g., "Woodside Dev")
    @DomainID INT = 1,
    @LabelPrepend NVARCHAR(50) = 'customWidgets.prayerWidget.';

-- =====================================================
-- Widget Display Labels
-- =====================================================

-- Widget Title
INSERT INTO dp_Application_Labels (API_Client_ID, Label_Name, English, Domain_ID)
VALUES (
    @APIClientID,
    CONCAT(@LabelPrepend, 'widget.title'),
    'Prayer & Praise',
    @DomainID
);

-- Widget Subtitle
INSERT INTO dp_Application_Labels (API_Client_ID, Label_Name, English, Domain_ID)
VALUES (
    @APIClientID,
    CONCAT(@LabelPrepend, 'widget.subtitle'),
    'Share burdens, celebrate victories',
    @DomainID
);

-- =====================================================
-- User Stats Section Labels
-- =====================================================

-- Total Prayers Label
INSERT INTO dp_Application_Labels (API_Client_ID, Label_Name, English, Domain_ID)
VALUES (
    @APIClientID,
    CONCAT(@LabelPrepend, 'userStats.totalPrayersLabel'),
    'Total Prayers',
    @DomainID
);

-- Prayer Streak Label
INSERT INTO dp_Application_Labels (API_Client_ID, Label_Name, English, Domain_ID)
VALUES (
    @APIClientID,
    CONCAT(@LabelPrepend, 'userStats.streakLabel'),
    'Day Streak',
    @DomainID
);

-- Prayers Today Label
INSERT INTO dp_Application_Labels (API_Client_ID, Label_Name, English, Domain_ID)
VALUES (
    @APIClientID,
    CONCAT(@LabelPrepend, 'userStats.todayLabel'),
    'Today',
    @DomainID
);

-- =====================================================
-- My Requests Section Labels
-- =====================================================

-- My Requests Title
INSERT INTO dp_Application_Labels (API_Client_ID, Label_Name, English, Domain_ID)
VALUES (
    @APIClientID,
    CONCAT(@LabelPrepend, 'myRequests.title'),
    'My Requests',
    @DomainID
);

-- My Requests Description
INSERT INTO dp_Application_Labels (API_Client_ID, Label_Name, English, Domain_ID)
VALUES (
    @APIClientID,
    CONCAT(@LabelPrepend, 'myRequests.description'),
    'Track your prayer requests and see who''s lifting you up.',
    @DomainID
);

-- Submit Prayer Button
INSERT INTO dp_Application_Labels (API_Client_ID, Label_Name, English, Domain_ID)
VALUES (
    @APIClientID,
    CONCAT(@LabelPrepend, 'myRequests.submitButton'),
    'Submit Prayer',
    @DomainID
);

-- =====================================================
-- Submit Prayer Form Labels
-- =====================================================

-- Form Title
INSERT INTO dp_Application_Labels (API_Client_ID, Label_Name, English, Domain_ID)
VALUES (
    @APIClientID,
    CONCAT(@LabelPrepend, 'submitForm.title'),
    'Submit a Prayer Request',
    @DomainID
);

-- Form Description
INSERT INTO dp_Application_Labels (API_Client_ID, Label_Name, English, Domain_ID)
VALUES (
    @APIClientID,
    CONCAT(@LabelPrepend, 'submitForm.description'),
    'How can we be praying for you?',
    @DomainID
);

-- Type Field Label
INSERT INTO dp_Application_Labels (API_Client_ID, Label_Name, English, Domain_ID)
VALUES (
    @APIClientID,
    CONCAT(@LabelPrepend, 'submitForm.typeFieldLabel'),
    'Type',
    @DomainID
);

-- Prayer Request Option Description
INSERT INTO dp_Application_Labels (API_Client_ID, Label_Name, English, Domain_ID)
VALUES (
    @APIClientID,
    CONCAT(@LabelPrepend, 'submitForm.prayerRequestDescription'),
    'Ask for support in prayer',
    @DomainID
);

-- Praise Report Option Description
INSERT INTO dp_Application_Labels (API_Client_ID, Label_Name, English, Domain_ID)
VALUES (
    @APIClientID,
    CONCAT(@LabelPrepend, 'submitForm.praiseReportDescription'),
    'Share answered prayers',
    @DomainID
);

-- Prayer Request Field Label
INSERT INTO dp_Application_Labels (API_Client_ID, Label_Name, English, Domain_ID)
VALUES (
    @APIClientID,
    CONCAT(@LabelPrepend, 'submitForm.requestFieldLabel'),
    'Prayer Request',
    @DomainID
);

-- Prayer Request Placeholder
INSERT INTO dp_Application_Labels (API_Client_ID, Label_Name, English, Domain_ID)
VALUES (
    @APIClientID,
    CONCAT(@LabelPrepend, 'submitForm.requestPlaceholder'),
    'Share your prayer request…',
    @DomainID
);

-- Target Date Field Label
INSERT INTO dp_Application_Labels (API_Client_ID, Label_Name, English, Domain_ID)
VALUES (
    @APIClientID,
    CONCAT(@LabelPrepend, 'submitForm.targetDateLabel'),
    'Target Date (Optional)',
    @DomainID
);

-- Target Date Field Description
INSERT INTO dp_Application_Labels (API_Client_ID, Label_Name, English, Domain_ID)
VALUES (
    @APIClientID,
    CONCAT(@LabelPrepend, 'submitForm.targetDateDescription'),
    'If there''s a specific date related to this prayer (e.g., surgery date, job interview), set it here. Leave blank for ongoing needs.',
    @DomainID
);

-- Submit Button Label
INSERT INTO dp_Application_Labels (API_Client_ID, Label_Name, English, Domain_ID)
VALUES (
    @APIClientID,
    CONCAT(@LabelPrepend, 'submitForm.submitButton'),
    'Submit Prayer Request',
    @DomainID
);

-- =====================================================
-- Prayer Partners Section Labels
-- =====================================================

-- Prayer Partners Title
INSERT INTO dp_Application_Labels (API_Client_ID, Label_Name, English, Domain_ID)
VALUES (
    @APIClientID,
    CONCAT(@LabelPrepend, 'prayerPartners.title'),
    'Prayer Partners',
    @DomainID
);

-- Prayer Partners Description
INSERT INTO dp_Application_Labels (API_Client_ID, Label_Name, English, Domain_ID)
VALUES (
    @APIClientID,
    CONCAT(@LabelPrepend, 'prayerPartners.description'),
    'See who you''ve been standing with in prayer.',
    @DomainID
);

-- =====================================================
-- Community Needs Section Labels
-- =====================================================

-- Community Needs Title
INSERT INTO dp_Application_Labels (API_Client_ID, Label_Name, English, Domain_ID)
VALUES (
    @APIClientID,
    CONCAT(@LabelPrepend, 'communityNeeds.title'),
    'Community Needs',
    @DomainID
);

-- Community Needs Description
INSERT INTO dp_Application_Labels (API_Client_ID, Label_Name, English, Domain_ID)
VALUES (
    @APIClientID,
    CONCAT(@LabelPrepend, 'communityNeeds.description'),
    'Join others in lifting up these requests and celebrating answered prayers.',
    @DomainID
);

-- Search Placeholder
INSERT INTO dp_Application_Labels (API_Client_ID, Label_Name, English, Domain_ID)
VALUES (
    @APIClientID,
    CONCAT(@LabelPrepend, 'communityNeeds.searchPlaceholder'),
    'Search prayers…',
    @DomainID
);

-- Message Placeholder (for encouraging word)
INSERT INTO dp_Application_Labels (API_Client_ID, Label_Name, English, Domain_ID)
VALUES (
    @APIClientID,
    CONCAT(@LabelPrepend, 'communityNeeds.messagePlaceholder'),
    'Leave an encouraging word (optional)…',
    @DomainID
);

-- Skip Button
INSERT INTO dp_Application_Labels (API_Client_ID, Label_Name, English, Domain_ID)
VALUES (
    @APIClientID,
    CONCAT(@LabelPrepend, 'communityNeeds.skipButton'),
    'Skip',
    @DomainID
);

-- Pray Button
INSERT INTO dp_Application_Labels (API_Client_ID, Label_Name, English, Domain_ID)
VALUES (
    @APIClientID,
    CONCAT(@LabelPrepend, 'communityNeeds.prayButton'),
    'Pray',
    @DomainID
);

-- =====================================================
-- Verification Query
-- =====================================================

-- View all inserted labels
SELECT
    al.Application_Label_ID,
    ac.Client_Name AS API_Client,
    al.Label_Name,
    al.English,
    al.Domain_ID
FROM dp_Application_Labels al
LEFT JOIN API_Clients ac ON al.API_Client_ID = ac.API_Client_ID
WHERE al.Label_Name LIKE 'customWidgets.prayerWidget.%'
ORDER BY al.Label_Name;

-- =====================================================
-- Notes
-- =====================================================
--
-- Label Naming Convention:
-- customWidgets.prayerWidget.{section}.{purpose}
--
-- Sections:
-- - widget: Overall widget display
-- - userStats: User statistics section
-- - myRequests: My Requests section
-- - submitForm: Prayer submission form
-- - prayerPartners: Prayer Partners section
-- - communityNeeds: Community Needs section
--
-- To add additional languages:
-- UPDATE dp_Application_Labels
-- SET Spanish = 'Oración y Alabanza'
-- WHERE Label_Name = 'customWidgets.prayerWidget.widget.title';
--
-- =====================================================
