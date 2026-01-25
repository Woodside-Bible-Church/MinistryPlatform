-- =============================================
-- Cancellations Widget - Sample Test Data
-- Use this to test the widget functionality
-- =============================================

DECLARE @DomainID INT = 1;
DECLARE @Now DATETIME = GETDATE();

-- =============================================
-- Clear existing test data (optional - uncomment if needed)
-- =============================================
-- DELETE FROM Congregation_Cancellation_Updates WHERE Domain_ID = @DomainID;
-- DELETE FROM Congregation_Cancellation_Services WHERE Domain_ID = @DomainID;
-- DELETE FROM Congregation_Cancellations WHERE Domain_ID = @DomainID;

-- =============================================
-- Get some congregation IDs (adjust these based on your data)
-- =============================================
DECLARE @TroyCongregationID INT;
DECLARE @FarmingtonCongregationID INT;
DECLARE @WarrenCongregationID INT;

SELECT @TroyCongregationID = Congregation_ID FROM Congregations WHERE Congregation_Name LIKE '%Troy%' AND Domain_ID = @DomainID;
SELECT @FarmingtonCongregationID = Congregation_ID FROM Congregations WHERE Congregation_Name LIKE '%Farmington%' AND Domain_ID = @DomainID;
SELECT @WarrenCongregationID = Congregation_ID FROM Congregations WHERE Congregation_Name LIKE '%Warren%' AND Domain_ID = @DomainID;

-- =============================================
-- Sample: Troy campus - CLOSED
-- =============================================
IF @TroyCongregationID IS NOT NULL
BEGIN
    -- Check if cancellation already exists
    IF NOT EXISTS (
        SELECT 1 FROM Congregation_Cancellations
        WHERE Congregation_ID = @TroyCongregationID
        AND Start_Date <= @Now
        AND (End_Date IS NULL OR End_Date > @Now)
    )
    BEGIN
        DECLARE @TroyCancellationID INT;

        INSERT INTO Congregation_Cancellations (Congregation_ID, Cancellation_Status_ID, Reason, Expected_Resume_Time, Start_Date, End_Date, Domain_ID)
        VALUES (
            @TroyCongregationID,
            3, -- Closed
            'Power outage affecting the entire building',
            'Pending power restoration by DTE Energy',
            @Now,
            DATEADD(DAY, 2, @Now), -- Expires in 2 days
            @DomainID
        );

        SET @TroyCancellationID = SCOPE_IDENTITY();

        -- Add affected services
        INSERT INTO Congregation_Cancellation_Services (Congregation_Cancellation_ID, Service_Name, Service_Status, Details, Sort_Order, Domain_ID)
        VALUES
            (@TroyCancellationID, 'All Services', 'cancelled', NULL, 1, @DomainID),
            (@TroyCancellationID, 'Office Hours', 'cancelled', 'Staff working remotely', 2, @DomainID),
            (@TroyCancellationID, 'Kids Ministry', 'cancelled', NULL, 3, @DomainID);

        -- Add updates
        INSERT INTO Congregation_Cancellation_Updates (Congregation_Cancellation_ID, Update_Message, Update_Timestamp, Domain_ID)
        VALUES
            (@TroyCancellationID, 'DTE is working to restore power to the area. We will update as soon as we have more information.', DATEADD(HOUR, -2, @Now), @DomainID),
            (@TroyCancellationID, 'Campus closed due to power outage. Please join us online for services.', DATEADD(HOUR, -6, @Now), @DomainID);

        PRINT 'Created CLOSED cancellation for Troy campus';
    END
END

-- =============================================
-- Sample: Farmington Hills campus - MODIFIED
-- =============================================
IF @FarmingtonCongregationID IS NOT NULL
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM Congregation_Cancellations
        WHERE Congregation_ID = @FarmingtonCongregationID
        AND Start_Date <= @Now
        AND (End_Date IS NULL OR End_Date > @Now)
    )
    BEGIN
        DECLARE @FarmingtonCancellationID INT;

        INSERT INTO Congregation_Cancellations (Congregation_ID, Cancellation_Status_ID, Reason, Expected_Resume_Time, Start_Date, End_Date, Domain_ID)
        VALUES (
            @FarmingtonCongregationID,
            2, -- Modified
            'Hazardous road conditions due to ice storm',
            'Full services resume Wednesday at 9:00 AM',
            @Now,
            DATEADD(DAY, 1, @Now),
            @DomainID
        );

        SET @FarmingtonCancellationID = SCOPE_IDENTITY();

        -- Add affected services
        INSERT INTO Congregation_Cancellation_Services (Congregation_Cancellation_ID, Service_Name, Service_Status, Details, Sort_Order, Domain_ID)
        VALUES
            (@FarmingtonCancellationID, 'Sunday Services', 'modified', 'Only 11 AM service available', 1, @DomainID),
            (@FarmingtonCancellationID, 'Student Ministries', 'cancelled', NULL, 2, @DomainID),
            (@FarmingtonCancellationID, 'Kids Ministry', 'modified', 'Available at 11 AM service only', 3, @DomainID),
            (@FarmingtonCancellationID, 'Office Hours', 'delayed', 'Opening at 11 AM', 4, @DomainID);

        -- Add updates
        INSERT INTO Congregation_Cancellation_Updates (Congregation_Cancellation_ID, Update_Message, Update_Timestamp, Domain_ID)
        VALUES
            (@FarmingtonCancellationID, 'Roads are improving. 11 AM service will proceed as scheduled.', DATEADD(HOUR, -1, @Now), @DomainID),
            (@FarmingtonCancellationID, '9 AM service cancelled due to icy conditions. Please plan to attend 11 AM.', DATEADD(HOUR, -4, @Now), @DomainID);

        PRINT 'Created MODIFIED cancellation for Farmington Hills campus';
    END
END

-- =============================================
-- Warren campus - NO CANCELLATION (will show as OPEN)
-- =============================================
-- Warren has no entry in Congregation_Cancellations, so it will default to "Open" status
PRINT 'Warren campus (no cancellation record) will show as OPEN';

-- =============================================
-- Verify the data
-- =============================================
PRINT '';
PRINT 'Verification - Active Cancellations:';

SELECT
    c.Congregation_Name,
    cs.Status_Name,
    cc.Reason,
    cc.Expected_Resume_Time,
    cc.Start_Date,
    cc.End_Date
FROM Congregation_Cancellations cc
INNER JOIN Congregations c ON cc.Congregation_ID = c.Congregation_ID
INNER JOIN __CancellationStatuses cs ON cc.Cancellation_Status_ID = cs.Cancellation_Status_ID
WHERE cc.Domain_ID = @DomainID
    AND cc.Start_Date <= @Now
    AND (cc.End_Date IS NULL OR cc.End_Date > @Now)
ORDER BY c.Congregation_Name;

PRINT '';
PRINT 'Test the stored procedure:';
PRINT 'EXEC api_custom_CancellationsWidget_JSON @DomainID = 1';
GO
