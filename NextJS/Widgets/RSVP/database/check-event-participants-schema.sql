-- Check Event_Participants table schema
USE [MinistryPlatform]
GO

SELECT TOP 5
    *
FROM Event_Participants ep
ORDER BY ep.Event_Participant_ID DESC;
