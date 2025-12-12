-- =====================================================
-- Fix Event_Amenities page Filter_Clause
-- Remove @EventID requirement so page can be viewed standalone
-- Date: 2025-12-12
-- =====================================================

USE MinistryPlatform;
GO

UPDATE dp_Pages
SET Filter_Clause = 'Event_Amenities.Domain_ID = @DomainID',
    Default_Field_List = 'Event_Amenities.Event_Amenity_ID
,Event_ID_Table.Event_Title
,Amenity_ID_Table.Amenity_Name
,Amenity_ID_Table.Icon_Name
,Amenity_ID_Table.Icon_Color'
WHERE Table_Name = 'Event_Amenities';

PRINT 'Updated Event_Amenities page filter clause';
GO
