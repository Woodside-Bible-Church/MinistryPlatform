-- Seed test data for Cancellations Widget
-- Farmington Hills: Student Ministry closed
-- Troy: All activities closed

USE [MinistryPlatform]
GO

DECLARE @Now DATETIME = GETDATE();

-- Get Congregation IDs
DECLARE @FarmingtonID INT = 8;  -- Farmington Hills
DECLARE @TroyID INT = 15;       -- Troy

-- =============================================
-- Troy - ALL ACTIVITIES CLOSED
-- =============================================
IF NOT EXISTS (
    SELECT 1 FROM Congregation_Cancellations
    WHERE Congregation_ID = @TroyID
    AND Start_Date <= @Now AND (End_Date IS NULL OR End_Date > @Now)
)
BEGIN
    DECLARE @TroyCancellationID INT;

    INSERT INTO Congregation_Cancellations (Congregation_ID, Cancellation_Status_ID, Reason, Expected_Resume_Time, Start_Date, End_Date, Domain_ID)
    VALUES (
        @TroyID,
        3, -- Closed
        'Power outage affecting the entire building',
        'Pending power restoration by DTE Energy',
        @Now,
        DATEADD(DAY, 2, @Now),
        1
    );

    SET @TroyCancellationID = SCOPE_IDENTITY();

    -- Add affected services
    INSERT INTO Congregation_Cancellation_Services (Congregation_Cancellation_ID, Service_Name, Service_Status, Details, Sort_Order, Domain_ID)
    VALUES
        (@TroyCancellationID, 'All Sunday Services', 'cancelled', NULL, 1, 1),
        (@TroyCancellationID, 'Kids Ministry', 'cancelled', NULL, 2, 1),
        (@TroyCancellationID, 'Student Ministry', 'cancelled', NULL, 3, 1),
        (@TroyCancellationID, 'Office Hours', 'cancelled', 'Staff working remotely', 4, 1),
        (@TroyCancellationID, 'Wednesday Activities', 'cancelled', NULL, 5, 1);

    -- Add updates
    INSERT INTO Congregation_Cancellation_Updates (Congregation_Cancellation_ID, Update_Message, Update_Timestamp, Domain_ID)
    VALUES
        (@TroyCancellationID, 'DTE Energy is on site working to restore power. We will update as soon as we have more information.', DATEADD(HOUR, -1, @Now), 1),
        (@TroyCancellationID, 'Campus closed due to power outage. Please join us online for our worship service at woodsidebible.org/live', DATEADD(HOUR, -4, @Now), 1);

    PRINT 'Created CLOSED cancellation for Troy (all activities)';
END
ELSE
BEGIN
    PRINT 'Troy already has an active cancellation';
END
GO

-- =============================================
-- Farmington Hills - STUDENT MINISTRY CLOSED (Modified status)
-- =============================================
DECLARE @Now2 DATETIME = GETDATE();
DECLARE @FarmingtonID2 INT = 8;

IF NOT EXISTS (
    SELECT 1 FROM Congregation_Cancellations
    WHERE Congregation_ID = @FarmingtonID2
    AND Start_Date <= @Now2 AND (End_Date IS NULL OR End_Date > @Now2)
)
BEGIN
    DECLARE @FarmingtonCancellationID INT;

    INSERT INTO Congregation_Cancellations (Congregation_ID, Cancellation_Status_ID, Reason, Expected_Resume_Time, Start_Date, End_Date, Domain_ID)
    VALUES (
        @FarmingtonID2,
        2, -- Modified
        'Hazardous road conditions in the area',
        'Normal operations resume Wednesday',
        @Now2,
        DATEADD(DAY, 1, @Now2),
        1
    );

    SET @FarmingtonCancellationID = SCOPE_IDENTITY();

    -- Add affected services
    INSERT INTO Congregation_Cancellation_Services (Congregation_Cancellation_ID, Service_Name, Service_Status, Details, Sort_Order, Domain_ID)
    VALUES
        (@FarmingtonCancellationID, 'Student Ministry', 'cancelled', 'Wednesday night program cancelled', 1, 1),
        (@FarmingtonCancellationID, 'Sunday Services', 'modified', '9 AM cancelled, 11 AM proceeding as scheduled', 2, 1),
        (@FarmingtonCancellationID, 'Kids Ministry', 'modified', 'Available at 11 AM service only', 3, 1);

    -- Add updates
    INSERT INTO Congregation_Cancellation_Updates (Congregation_Cancellation_ID, Update_Message, Update_Timestamp, Domain_ID)
    VALUES
        (@FarmingtonCancellationID, 'Roads are improving. Our 11 AM service will proceed as scheduled. Please use caution when traveling.', DATEADD(HOUR, -1, @Now2), 1),
        (@FarmingtonCancellationID, 'Due to icy road conditions, we are cancelling our 9 AM service and all Student Ministry activities this week.', DATEADD(HOUR, -3, @Now2), 1);

    PRINT 'Created MODIFIED cancellation for Farmington Hills (student ministry closed)';
END
ELSE
BEGIN
    PRINT 'Farmington Hills already has an active cancellation';
END
GO

-- Verify
PRINT '';
PRINT 'Active Cancellations:';
SELECT
    c.Congregation_Name,
    cs.Status_Name,
    cc.Reason,
    cc.Expected_Resume_Time
FROM Congregation_Cancellations cc
INNER JOIN Congregations c ON cc.Congregation_ID = c.Congregation_ID
INNER JOIN __CancellationStatuses cs ON cc.Cancellation_Status_ID = cs.Cancellation_Status_ID
WHERE cc.Start_Date <= GETDATE() AND (cc.End_Date IS NULL OR cc.End_Date > GETDATE())
ORDER BY c.Congregation_Name;

PRINT '';
PRINT 'Affected Services:';
SELECT
    c.Congregation_Name,
    ccs.Service_Name,
    ccs.Service_Status,
    ccs.Details
FROM Congregation_Cancellation_Services ccs
INNER JOIN Congregation_Cancellations cc ON ccs.Congregation_Cancellation_ID = cc.Congregation_Cancellation_ID
INNER JOIN Congregations c ON cc.Congregation_ID = c.Congregation_ID
WHERE cc.Start_Date <= GETDATE() AND (cc.End_Date IS NULL OR cc.End_Date > GETDATE())
ORDER BY c.Congregation_Name, ccs.Sort_Order;
GO
