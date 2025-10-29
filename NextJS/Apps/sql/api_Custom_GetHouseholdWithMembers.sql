-- =============================================
-- Author:      Ministry Platform Integration
-- Create date: 2025-10-29
-- Description: Get household information with all members for People Search app
-- Usage:       EXEC api_Custom_GetHouseholdWithMembers @HouseholdID = 129650, @ContactID = 228155, @UserName = 'API', @DomainID = 1
-- =============================================
CREATE OR ALTER PROCEDURE [dbo].[api_Custom_GetHouseholdWithMembers]
    @HouseholdID INT,
    @ContactID INT = NULL,
    @UserName NVARCHAR(75) = NULL,
    @DomainID INT = 1
AS
BEGIN
    SET NOCOUNT ON;

    -- Build the result in stages to avoid truncation
    DECLARE @Result NVARCHAR(MAX);

    -- Get Household JSON with properly nested Address
    DECLARE @HouseholdJSON NVARCHAR(MAX) = (
        SELECT TOP 1
            H.Household_ID,
            H.Household_Name,
            H.Home_Phone,
            C.Congregation_Name,
            -- Build Address as a sub-object
            (
                SELECT
                    A.Address_ID,
                    A.Address_Line_1,
                    A.Address_Line_2,
                    A.City,
                    A.[State/Region] AS [State],
                    A.Postal_Code,
                    A.Country,
                    A.Latitude,
                    A.Longitude
                FROM Addresses A
                WHERE A.Address_ID = H.Address_ID
                FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
            ) AS Address
        FROM Households H
            LEFT OUTER JOIN Congregations C ON C.Congregation_ID = H.Congregation_ID
        WHERE H.Household_ID = @HouseholdID
        FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
    );

    -- Get Members JSON array
    DECLARE @MembersJSON NVARCHAR(MAX) = (
        SELECT
            C.Contact_ID,
            P.Prefix,
            C.First_Name,
            C.Nickname,
            C.Middle_Name,
            C.Last_Name,
            S.Suffix,
            CAST((CASE WHEN @ContactID = C.Contact_ID THEN 1 ELSE 0 END) AS BIT) AS Selected,
            C.Display_Name,
            G.Gender,
            CS_Status.Contact_Status,
            HP.Household_Position,
            C.Date_of_Birth,
            C.Anniversary_Date,
            C.Date_of_Death,
            C.Maiden_Name,
            C.Email_Address,
            C.Mobile_Phone,
            C.Company_Phone,
            C.Contact_Methods,
            C.Do_Not_Text,
            C.Contact_GUID,
            C.Occupation_Name,
            C.__Age,
            -- Build image URL
            Image_URL = CASE
                WHEN F.File_ID IS NOT NULL AND CS.Value IS NOT NULL AND D.Domain_GUID IS NOT NULL
                THEN CONCAT(CS.Value, '?dn=', CONVERT(varchar(40), D.Domain_GUID), '&fn=', F.Unique_Name, '.', F.Extension)
                ELSE NULL
            END
        FROM Contacts C
            LEFT OUTER JOIN Suffixes S ON S.Suffix_ID = C.Suffix_ID
            LEFT OUTER JOIN Prefixes P ON P.Prefix_ID = C.Prefix_ID
            LEFT OUTER JOIN Genders G ON G.Gender_ID = C.Gender_ID
            LEFT OUTER JOIN Contact_Statuses CS_Status ON CS_Status.Contact_Status_ID = C.Contact_Status_ID
            LEFT OUTER JOIN Household_Positions HP ON HP.Household_Position_ID = C.Household_Position_ID
            -- Image file joins
            LEFT OUTER JOIN dp_files F ON F.Record_ID = C.Contact_ID AND F.Table_Name = 'Contacts' AND F.Default_Image = 1
            LEFT OUTER JOIN dp_Configuration_Settings CS ON CS.Domain_ID = COALESCE(C.Domain_ID, @DomainID) AND CS.Key_Name = 'ImageURL' AND CS.Application_Code = 'Common'
            LEFT OUTER JOIN dp_Domains D ON D.Domain_ID = COALESCE(C.Domain_ID, @DomainID)
        WHERE C.Household_ID = @HouseholdID
        ORDER BY
            CASE
                WHEN HP.Household_Position = 'Head of Household' THEN 1
                WHEN HP.Household_Position = 'Spouse' THEN 2
                ELSE 3
            END,
            C.Date_of_Birth ASC
        FOR JSON PATH
    );

    -- Manually combine the JSON parts with proper formatting
    SET @Result = CONCAT(
        '{"Household":',
        ISNULL(@HouseholdJSON, 'null'),
        ',"Members":',
        ISNULL(@MembersJSON, '[]'),
        '}'
    );

    -- Return as a single-column result
    SELECT @Result AS JSON_F52E2B6118A111d1B10500805F49916B;
END
GO

-- Add to API_Procedures table to enable API access
-- Run this after creating the procedure:
/*
IF NOT EXISTS (SELECT 1 FROM dp_API_Procedures WHERE Procedure_Name = 'api_Custom_GetHouseholdWithMembers')
BEGIN
    INSERT INTO dp_API_Procedures (Procedure_Name, Description)
    VALUES ('api_Custom_GetHouseholdWithMembers', 'Get household information with all members for People Search app')
END
*/
