-- =============================================
-- Widget SP Update: Per-Campus Carousel Sort Overrides
-- Description: Updates api_custom_AnnouncementsWidget_JSON to:
--   1. JOIN Announcements table for Carousel_Sort + Carousel_Sort_Overrides
--   2. Resolve campus-specific sort via JSON_VALUE fallback chain
--   3. Output resolved CarouselSort in JSON for client-side sorting
-- Date: 2026-02-18
--
-- Fallback chain: Campus override → Base Carousel_Sort → NULL (client defaults to 999)
-- =============================================

USE [MinistryPlatform]
GO

SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

ALTER PROCEDURE [dbo].[api_custom_AnnouncementsWidget_JSON]
    @CongregationID  INT = NULL,
    @Campus          NVARCHAR(255) = NULL,  -- Campus slug parameter
    @GroupID         INT = NULL,
    @EventID         INT = NULL,
    @Search          NVARCHAR(MAX) = NULL,
    @AnnouncementIDs NVARCHAR(MAX) = NULL,
    @Page            INT = NULL,
    @NumPerPage      INT = NULL,
    @Username        NVARCHAR(75) = NULL,
    @DomainID        INT = 1
AS
BEGIN
    SET NOCOUNT ON;

    -- Resolve @Campus to @CongregationID using Campus_Slug field
    -- Priority: @CongregationID (from data-params) takes precedence
    IF @CongregationID IS NULL AND @Campus IS NOT NULL
    BEGIN
        -- Look up congregation by Campus_Slug (exact match)
        SELECT TOP 1 @CongregationID = Congregation_ID
        FROM dbo.Congregations
        WHERE Campus_Slug = @Campus
          AND End_Date IS NULL; -- Only active congregations
    END

    DECLARE @Now DATETIME = GETDATE();
    SET @Search = dbo.Remove_SpecialCharacters(@Search);

    /* ---------- Settings -> Information node ---------- */
    DECLARE @SettingsJSON NVARCHAR(MAX);
    CREATE TABLE #SettingsJSON (JSON NVARCHAR(MAX));
    INSERT INTO #SettingsJSON (JSON)
    EXEC api_CustomWidgets_GetCustomWidgetSettings_JSON 'AnnouncementsWidget';
    SET @SettingsJSON = (SELECT TOP (1) JSON FROM #SettingsJSON);

    /* ---------- Base set from your view ---------- */
    ;WITH Base AS (
        SELECT
            V.Announcement_ID,
            V.Announcement_Title,
            V.Announcement_Body,
            V.Top_Priority,
            V.Announcement_Start_Date,
            V.Congregation_ID,
            V.Sort,

            -- Carousel sort: resolve campus override → base value
            COALESCE(ov.CampusCarouselSort, a.Carousel_Sort) AS Carousel_Sort,

            -- announcement CTA fields
            V.Call_To_Action_URL,
            V.Call_To_Action_Label,

            -- event / serve assets from the view
            V.Event_Image,
            V.Event_Link,
            V.Primary_CTA_URL,      -- from vw_wbc_event_finder
            V.Serve_Image,
            V.Serve_Link,

            -- announcement-level image
            V.Announcement_Image
        FROM dbo.vw_wbc_announcements AS V
        INNER JOIN dbo.Announcements AS a ON V.Announcement_ID = a.Announcement_ID
        OUTER APPLY (
            SELECT TOP 1 CAST(j.[value] AS INT) AS CampusCarouselSort
            FROM OPENJSON(a.Carousel_Sort_Overrides) j
            WHERE j.[key] = CAST(@CongregationID AS NVARCHAR(10))
        ) ov
    ),
    Shaped AS (
        SELECT
            b.Announcement_ID,
            b.Announcement_Title,
            b.Announcement_Body,
            b.Congregation_ID,
            b.Top_Priority,
            b.Announcement_Start_Date,
            b.Sort,
            b.Carousel_Sort,

            -- Image: Announcement -> Event -> Serve
            Image =
              COALESCE(
                NULLIF(CONVERT(nvarchar(max), b.Announcement_Image), ''),
                NULLIF(CONVERT(nvarchar(max), b.Event_Image), ''),
                NULLIF(CONVERT(nvarchar(max), b.Serve_Image), '')
              ),


            -- Link: Announcement CTA -> Event Link -> Event Primary_CTA_URL -> Serve Link
           Link =
              COALESCE(
                NULLIF(CONVERT(nvarchar(max), b.Call_To_Action_URL), ''),
                NULLIF(CONVERT(nvarchar(max), b.Event_Link), ''),
                NULLIF(CONVERT(nvarchar(max), b.Primary_CTA_URL), ''),
                NULLIF(CONVERT(nvarchar(max), b.Serve_Link), '')
              ),

            Heading    = COALESCE(NULLIF(b.Call_To_Action_Label, ''), b.Announcement_Title),
            SubHeading = b.Announcement_Body
        FROM Base b
    )

    SELECT
    (
        SELECT
            JSON_QUERY((
                SELECT
                    -- ChurchWide TOP(3)
                    (
                        SELECT TOP (3)
                            s.Announcement_ID     AS [ID],
                            s.Announcement_Title  AS [Title],
                            s.Image               AS [Image],
                            s.Carousel_Sort       AS [CarouselSort],
                            JSON_QUERY((
                                SELECT
                                    s.Link       AS [Link],
                                    s.Heading    AS [Heading],
                                    s.SubHeading AS [SubHeading]
                                FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
                            )) AS [CallToAction]
                        FROM Shaped s
                        WHERE s.Congregation_ID = 1
                        ORDER BY s.Top_Priority DESC, s.Sort ASC, s.Announcement_Start_Date
ASC, s.Announcement_ID ASC
                        FOR JSON PATH
                    ) AS [ChurchWide],

                    -- Campus (only when a specific campus other than 1 is requested)
                    JSON_QUERY(
                        CASE
                            WHEN @CongregationID IS NOT NULL AND @CongregationID <> 1 THEN
                                (
                                    SELECT
                                        C.Congregation_ID   AS [ID],
                                        C.Congregation_Name AS [Name],
                                        (
                                            SELECT
                                                s.Announcement_ID     AS [ID],
                                                s.Announcement_Title  AS [Title],
                                                s.Image               AS [Image],
                                                s.Carousel_Sort       AS [CarouselSort],
                                                JSON_QUERY((
                                                    SELECT
                                                        s.Link       AS [Link],
                                                        s.Heading    AS [Heading],
                                                        s.SubHeading AS [SubHeading]
                                                    FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
                                                )) AS [CallToAction]
                                            FROM Shaped s
                                            WHERE s.Congregation_ID = @CongregationID
                                            ORDER BY s.Top_Priority DESC, s.Sort ASC,
s.Announcement_Start_Date ASC, s.Announcement_ID ASC
                                            FOR JSON PATH
                                        ) AS [Announcements]
                                    FROM dbo.Congregations C
                                    WHERE C.Congregation_ID = @CongregationID
                                    FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
                                )
                            ELSE NULL
                        END
                    ) AS [Campus]
                FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
            )) AS [Announcements],

            JSON_QUERY(@SettingsJSON) AS [Information]
        FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
    ) AS JsonResult;

    DROP TABLE #SettingsJSON;
END
GO
