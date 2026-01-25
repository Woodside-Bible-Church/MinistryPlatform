-- =============================================
-- Cancellations Widget - Application Labels
-- Insert into dp_Application_Labels
-- =============================================

DECLARE @DomainID INT = 1;
DECLARE @APIClientID INT = 16; -- TM.Widgets

-- Delete existing labels (for re-running)
DELETE FROM dp_Application_Labels
WHERE Label_Name LIKE 'customWidgets.cancellationsWidget.%'
AND Domain_ID = @DomainID;

-- Insert labels (API_Client_ID required, English column for label text)
INSERT INTO dp_Application_Labels (Label_Name, English, Domain_ID, API_Client_ID)
VALUES
    ('customWidgets.cancellationsWidget.alertTitle', 'Weather Advisory', @DomainID, @APIClientID),
    ('customWidgets.cancellationsWidget.mainTitle', 'Cancellations', @DomainID, @APIClientID),
    ('customWidgets.cancellationsWidget.alertMessage', 'Due to hazardous conditions, several church activities have been affected. Please check your campus status below before traveling.', @DomainID, @APIClientID),
    ('customWidgets.cancellationsWidget.autoRefreshMessage', 'This page refreshes automatically. Check back for the latest updates.', @DomainID, @APIClientID),
    ('customWidgets.cancellationsWidget.lastUpdatedPrefix', 'Last updated:', @DomainID, @APIClientID),
    ('customWidgets.cancellationsWidget.openStatusMessage', 'All activities are proceeding as scheduled', @DomainID, @APIClientID),
    ('customWidgets.cancellationsWidget.openStatusSubtext', 'No cancellations or modifications at this time', @DomainID, @APIClientID);

-- Verify insertion
SELECT Label_Name, English
FROM dp_Application_Labels
WHERE Label_Name LIKE 'customWidgets.cancellationsWidget.%'
ORDER BY Label_Name;
GO
