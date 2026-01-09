-- =============================================
-- Stored Procedure: api_custom_Announcements_Management_JSON
-- Description: Fetch announcements for management interface with detailed information
-- Author: Claude Code
-- Date: 2026-01-08
-- =============================================

USE [MinistryPlatform]
GO

SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE OR ALTER PROCEDURE [dbo].[api_custom_Announcements_Management_JSON]
    @AnnouncementID INT = NULL,  -- Fetch single announcement for preview/edit
    @Active         BIT = NULL,  -- Filter by active status (NULL = all)
    @CongregationID INT = NULL,  -- Filter by congregation
    @Search         NVARCHAR(MAX) = NULL,
    @Username       NVARCHAR(75) = NULL,
    @DomainID       INT = 1
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @Now DATETIME = GETDATE();
    IF @Search IS NOT NULL
        SET @Search = dbo.Remove_SpecialCharacters(@Search);

    -- If specific announcement requested, return just that one with full details
    IF @AnnouncementID IS NOT NULL
    BEGIN
        SELECT
        (
            SELECT
                a.Announcement_ID AS [ID],
                a.Announcement_Title AS [Title],
                a.Announcement_Body AS [Body],
                a.Active,
                a.Top_Priority AS [TopPriority],
                a.Announcement_Start_Date AS [StartDate],
                a.Announcement_End_Date AS [EndDate],
                a.Sort,

                -- Congregation
                a.Congregation_ID AS [CongregationID],
                c.Congregation_Name AS [CongregationName],

                -- Call to Action
                a.Call_To_Action_URL AS [CallToActionURL],
                a.Call_To_Action_Label AS [CallToActionLabel],

                -- Event relationship
                a.Event_ID AS [EventID],
                e.Event_Title AS [EventTitle],
                e.Event_Start_Date AS [EventStartDate],
                e.Event_End_Date AS [EventEndDate],

                -- Opportunity (Serve) relationship
                a.Opportunity_ID AS [OpportunityID],
                o.Opportunity_Title AS [OpportunityTitle],
                o.Shift_Start AS [OpportunityStart],
                o.Shift_End AS [OpportunityEnd],

                -- Computed fields (using vw_wbc_announcements logic)
                COALESCE(
                  NULLIF(CONVERT(nvarchar(max), V.Event_Image), ''),
                  NULLIF(CONVERT(nvarchar(max), V.Serve_Image), '')
                ) AS [ImageURL],

                COALESCE(
                  NULLIF(CONVERT(nvarchar(max), a.Call_To_Action_URL), ''),
                  NULLIF(CONVERT(nvarchar(max), V.Event_Link), ''),
                  NULLIF(CONVERT(nvarchar(max), V.Primary_CTA_URL), ''),
                  NULLIF(CONVERT(nvarchar(max), V.Serve_Link), '')
                ) AS [ComputedLink],

                COALESCE(
                    NULLIF(a.Call_To_Action_Label, ''),
                    a.Announcement_Title
                ) AS [ComputedHeading],

                -- Audit fields
                a.Domain_ID AS [DomainID]

            FROM dbo.Announcements a
            LEFT JOIN dbo.Congregations c ON a.Congregation_ID = c.Congregation_ID
            LEFT JOIN dbo.Events e ON a.Event_ID = e.Event_ID
            LEFT JOIN dbo.Opportunities o ON a.Opportunity_ID = o.Opportunity_ID
            LEFT JOIN dbo.vw_wbc_announcements V ON a.Announcement_ID = V.Announcement_ID
            WHERE a.Announcement_ID = @AnnouncementID
                AND a.Domain_ID = @DomainID
            FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
        ) AS JsonResult;

        RETURN;
    END

    -- Otherwise, return list of announcements with summary information
    SELECT
    (
        SELECT
            a.Announcement_ID AS [ID],
            a.Announcement_Title AS [Title],
            a.Announcement_Body AS [Body],
            a.Active,
            a.Top_Priority AS [TopPriority],
            a.Announcement_Start_Date AS [StartDate],
            a.Announcement_End_Date AS [EndDate],
            a.Sort,

            -- Congregation
            a.Congregation_ID AS [CongregationID],
            c.Congregation_Name AS [CongregationName],
            c.Campus_Slug AS [CampusSlug],

            -- Call to Action
            a.Call_To_Action_URL AS [CallToActionURL],
            a.Call_To_Action_Label AS [CallToActionLabel],

            -- Related entity IDs (for quick reference)
            a.Event_ID AS [EventID],
            e.Event_Title AS [EventTitle],
            a.Opportunity_ID AS [OpportunityID],
            o.Opportunity_Title AS [OpportunityTitle],

            -- Computed image (using vw_wbc_announcements logic)
            COALESCE(
              NULLIF(CONVERT(nvarchar(max), V.Event_Image), ''),
              NULLIF(CONVERT(nvarchar(max), V.Serve_Image), '')
            ) AS [ImageURL],

            -- Status indicators
            CASE
                WHEN a.Announcement_End_Date < @Now THEN 'expired'
                WHEN a.Announcement_Start_Date > @Now THEN 'scheduled'
                WHEN a.Active = 1 THEN 'active'
                ELSE 'inactive'
            END AS [Status]

        FROM dbo.Announcements a
        LEFT JOIN dbo.Congregations c ON a.Congregation_ID = c.Congregation_ID
        LEFT JOIN dbo.Events e ON a.Event_ID = e.Event_ID
        LEFT JOIN dbo.Opportunities o ON a.Opportunity_ID = o.Opportunity_ID
        LEFT JOIN dbo.vw_wbc_announcements V ON a.Announcement_ID = V.Announcement_ID
        WHERE a.Domain_ID = @DomainID
            AND (@Active IS NULL OR a.Active = @Active)
            AND (@CongregationID IS NULL OR a.Congregation_ID = @CongregationID)
            AND (
                @Search IS NULL
                OR dbo.Remove_SpecialCharacters(a.Announcement_Title) LIKE '%' + @Search + '%'
                OR dbo.Remove_SpecialCharacters(a.Announcement_Body) LIKE '%' + @Search + '%'
                OR dbo.Remove_SpecialCharacters(c.Congregation_Name) LIKE '%' + @Search + '%'
                OR dbo.Remove_SpecialCharacters(e.Event_Title) LIKE '%' + @Search + '%'
                OR dbo.Remove_SpecialCharacters(o.Opportunity_Title) LIKE '%' + @Search + '%'
            )
        ORDER BY
            a.Top_Priority DESC,
            a.Sort ASC,
            a.Announcement_Start_Date DESC,
            a.Announcement_ID DESC
        FOR JSON PATH
    ) AS JsonResult;
END
GO
