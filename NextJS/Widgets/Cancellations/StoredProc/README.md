# Cancellations Widget - Database Setup

This directory contains the SQL scripts needed to set up the database tables and stored procedure for the Cancellations Widget.

## Installation Order

Run the scripts in the following order:

1. **01_CreateTables.sql** - Creates the required database tables:
   - `__CancellationStatuses` - Lookup table for status values (Open, Modified, Closed)
   - `Congregation_Cancellations` - Main table linking campuses to cancellation status
   - `Congregation_Cancellation_Services` - Child table for affected services
   - `Congregation_Cancellation_Updates` - Child table for status updates

2. **02_ApplicationLabels.sql** - Inserts application labels into `dp_Application_Labels`:
   - `customWidgets.cancellationsWidget.alertTitle`
   - `customWidgets.cancellationsWidget.mainTitle`
   - `customWidgets.cancellationsWidget.alertMessage`
   - `customWidgets.cancellationsWidget.autoRefreshMessage`
   - `customWidgets.cancellationsWidget.lastUpdatedPrefix`
   - `customWidgets.cancellationsWidget.openStatusMessage`
   - `customWidgets.cancellationsWidget.openStatusSubtext`

3. **03_api_custom_CancellationsWidget_JSON.sql** - Creates the stored procedure and registers it in `API_Procedures`

4. **04_SampleData.sql** (Optional) - Inserts sample test data for development

## Stored Procedure Parameters

```sql
EXEC api_custom_CancellationsWidget_JSON
    @CongregationID = NULL,    -- Filter by specific campus ID
    @Campus = NULL,            -- Filter by campus slug (e.g., 'troy', 'farmington-hills')
    @DomainID = 1,             -- Multi-tenant domain
    @UserName = NULL           -- Standard MP parameter
```

## JSON Response Structure

```json
{
  "Information": {
    "alertTitle": "Weather Advisory",
    "mainTitle": "Cancellations",
    "alertMessage": "Due to hazardous conditions...",
    "autoRefreshMessage": "This page refreshes automatically...",
    "lastUpdatedPrefix": "Last updated:",
    "openStatusMessage": "All activities are proceeding as scheduled",
    "openStatusSubtext": "No cancellations or modifications at this time"
  },
  "LastUpdated": "2026-01-25T15:30:00Z",
  "Campuses": [
    {
      "id": 1,
      "name": "Troy",
      "slug": "troy",
      "status": "closed",
      "reason": "Power outage",
      "expectedResumeTime": "Pending power restoration",
      "affectedServices": [
        { "name": "All Services", "status": "cancelled", "details": null }
      ],
      "updates": [
        { "timestamp": "Jan 25, 11:00 AM", "message": "DTE working..." }
      ]
    }
  ]
}
```

## API Endpoint

After installation, call via the MinistryPlatform API:

```
GET https://{subdomain}.ministryplatform.com/ministryplatformapi/procs/api_custom_CancellationsWidget_JSON
```

## Campus Filtering

The stored procedure only returns campuses that meet these criteria:

- `Available_Online = 1` - Only shows congregations marked as available online
- `Congregation_ID <> 1` - Excludes "Church Wide" congregation
- `End_Date IS NULL` - Only active congregations

## Managing Cancellations

Use MinistryPlatform's standard interface to manage records:

1. **Create a cancellation**: Insert record into `Congregation_Cancellations`
2. **Add affected services**: Insert records into `Congregation_Cancellation_Services`
3. **Post updates**: Insert records into `Congregation_Cancellation_Updates`
4. **End a cancellation**: Set `End_Date` to current datetime

Campuses without an active cancellation record automatically display as "Open".
