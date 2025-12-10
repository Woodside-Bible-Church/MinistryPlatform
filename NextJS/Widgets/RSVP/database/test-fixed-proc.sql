-- Test the fixed stored procedure
USE [MinistryPlatform]
GO

-- Execute the stored procedure for Christmas project
EXEC api_Custom_RSVP_Project_Data_JSON @Project_ID = 1;
