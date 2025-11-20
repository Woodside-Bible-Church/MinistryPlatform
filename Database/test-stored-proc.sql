-- Test the stored procedure directly
USE [MinistryPlatform]
GO

EXEC api_Custom_RSVP_Project_Data_JSON @RSVP_Slug = 'christmas-2025';
