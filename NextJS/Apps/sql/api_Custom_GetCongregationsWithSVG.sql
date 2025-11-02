-- =============================================
-- Author:      Ministry Platform Integration
-- Create date: 2025-11-02
-- Description: Get active congregations/campuses with their Campus.svg file URLs
-- Usage:       EXEC api_Custom_GetCongregationsWithSVG @UserName = 'API', @DomainID = 1
-- =============================================
CREATE OR ALTER PROCEDURE [dbo].[api_Custom_GetCongregationsWithSVG]
    @UserName NVARCHAR(75) = NULL,
    @DomainID INT = 1
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @Today DATE = CAST(GETDATE() AS DATE);

    -- Get congregations with Campus.svg file URLs
    DECLARE @Result NVARCHAR(MAX) = (
        SELECT
            C.Congregation_ID,
            C.Congregation_Name,
            C.Congregation_Short_Name,
            C.Start_Date,
            C.End_Date,
            C.Available_Online,
            -- Build Campus SVG URL
            Campus_SVG_URL = CASE
                WHEN F.File_ID IS NOT NULL AND CS.Value IS NOT NULL AND D.Domain_GUID IS NOT NULL
                THEN CONCAT(CS.Value, '?dn=', CONVERT(varchar(40), D.Domain_GUID), '&fn=', F.Unique_Name, '.', F.Extension)
                ELSE NULL
            END
        FROM Congregations C
            -- Join to dp_files to get Campus.svg file
            LEFT OUTER JOIN dp_files F ON F.Record_ID = C.Congregation_ID
                AND F.Table_Name = 'Congregations'
                AND F.File_Name = 'Campus.svg'
            -- Join to get ImageURL configuration setting
            LEFT OUTER JOIN dp_Configuration_Settings CS
                ON CS.Domain_ID = COALESCE(C.Domain_ID, @DomainID)
                AND CS.Key_Name = 'ImageURL'
                AND CS.Application_Code = 'Common'
            -- Join to get Domain GUID
            LEFT OUTER JOIN dp_Domains D
                ON D.Domain_ID = COALESCE(C.Domain_ID, @DomainID)
        WHERE
            C.Start_Date <= @Today
            AND (C.End_Date IS NULL OR C.End_Date >= @Today)
            AND C.Available_Online = 1
        ORDER BY C.Congregation_Name
        FOR JSON PATH, INCLUDE_NULL_VALUES
    );

    -- Return as a single-column result
    SELECT ISNULL(@Result, '[]') AS JSON_F52E2B6118A111d1B10500805F49916B;
END
GO

-- Add to API_Procedures table to enable API access
-- Run this after creating the procedure:
/*
IF NOT EXISTS (SELECT 1 FROM dp_API_Procedures WHERE Procedure_Name = 'api_Custom_GetCongregationsWithSVG')
BEGIN
    INSERT INTO dp_API_Procedures (Procedure_Name, Description)
    VALUES ('api_Custom_GetCongregationsWithSVG', 'Get active congregations/campuses with their Campus.svg file URLs')
END
*/
