# Prayer Widget

A Next.js-based prayer request widget that integrates with MinistryPlatform's Feedback table. This widget can be embedded on WordPress sites (no iframes) and provides a modern, mobile-friendly interface for submitting and viewing prayer requests.

## Features

- **Submit Prayer Requests**: Form for adding new prayer requests with category selection
- **Swipe Interface**: Modern swipe left/right functionality to mark prayers as prayed for
- **Approval Workflow**: Staff approval system before prayers are publicly visible
- **Filtering**: Filter prayers by category, date, and status
- **MP Integration**: Uses MinistryPlatform's native Login Widget for authentication
- **Responsive Design**: Mobile-first design with smooth animations

## Stack

- **Framework**: Next.js 15 with App Router
- **Authentication**: MinistryPlatform OAuth (via MP Login Widget)
- **Database**: MinistryPlatform Feedback table via REST API
- **UI**: Tailwind CSS v4 + Radix UI + Framer Motion
- **Validation**: Zod schemas with React Hook Form
- **Deployment**: Vercel

## Authentication

This widget uses MinistryPlatform's native login widget (`<mpp-user-login>`) which stores the auth token in localStorage as `mpp-widgets_AuthToken`. The Next.js API validates this token against MP's `/widgets/Api/Auth/User` endpoint.

## Development

```bash
# Install dependencies
npm install

# Run development server (on port 3002)
npm run dev

# Build for production
npm build

# Start production server
npm start
```

## Environment Variables

See `.env.example` for required environment variables:

```env
MINISTRY_PLATFORM_CLIENT_ID=TM.Widgets
MINISTRY_PLATFORM_CLIENT_SECRET=<your-secret>
MINISTRY_PLATFORM_BASE_URL=https://my.woodsidebible.org/ministryplatformapi
NEXTAUTH_SECRET=<random-string>
NEXTAUTH_URL=http://localhost:3002
NEXT_PUBLIC_APP_NAME=Prayer
```

## Integration

### Add to WordPress Site

1. Add the MP widgets script:
```html
<script id="MPWidgets" src="https://my.woodsidebible.org/widgets/dist/MPWidgets.js"></script>
```

2. Add the login widget:
```html
<mpp-user-login customcss="https://your-domain.vercel.app/CSS/userLogin.css">
  <a href="https://woodsidebible.org/manage-my-giving/">Giving</a>
  <a href="https://woodsidebible.org/my-groups/">Groups</a>
</mpp-user-login>
```

3. Embed the Prayer widget (no iframe needed with proper CORS configuration)

## MinistryPlatform Setup

### Feedback Table Schema

The widget uses the following fields from the Feedback table:
- `Feedback_ID` (Primary Key)
- `Contact_ID` (Foreign Key to Contacts)
- `Feedback_Type_ID` (Foreign Key to Feedback_Types)
- `Description` (Prayer request text)
- `Date_Submitted`
- `Approved` (Boolean - staff approval)
- `Visibility_Level_ID` (Who can see this prayer)
- `Ongoing_Need` (Boolean)
- Custom fields may be added per church configuration

### Required Configuration

1. Create OAuth client credentials in MP (TM.Widgets)
2. Ensure Feedback table is accessible via REST API
3. Configure Feedback_Types for prayer categories
4. Set up security roles for approval workflow

## License

MIT
