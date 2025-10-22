# Development & Testing Guide

## Local Development Setup

Your Prayer widget is now configured for easy local development with the MP login widget built-in!

### Quick Start

1. **Start the development server:**
   ```bash
   cd /Users/coltonwirgau/MinistryPlatform/NextJS/Widgets/Prayer
   npm run dev
   ```

2. **Open your browser:**
   ```
   http://localhost:3002
   ```

3. **What you'll see:**
   - **Blue development header** at the top with the MP login widget
   - Status indicator showing if MP Widgets script loaded successfully
   - The main prayer wall interface below

### How It Works

The development environment now includes:

1. **MP Widgets Script** - Automatically loaded via `next/script` in the root layout
2. **DevLoginWidget Component** - Shows at the top of the page (only in dev mode)
3. **Auto-detection** - The widget checks for the token in localStorage every second

### Authentication Flow

```
1. MP Widgets script loads → Sets up custom elements
2. You click "Sign In" in the blue dev header
3. MP login modal appears → You authenticate
4. Token is stored in localStorage as "mpp-widgets_AuthToken"
5. Prayer widget detects token → Authenticated! 🎉
```

### Testing Scenarios

#### ✅ Happy Path - Full Authentication
```bash
# Start dev server
npm run dev

# In browser:
1. Navigate to http://localhost:3002
2. See blue dev header with login widget
3. Click "Sign In"
4. Enter MP credentials
5. See prayer wall appear automatically
```

#### 🧪 Testing Different Users
```javascript
// To test with a different user, clear the token:
localStorage.removeItem('mpp-widgets_AuthToken');
// Refresh page, sign in with different account
```

#### 🎭 Testing Staff Permissions
```javascript
// The auth response shows your roles
// Staff members have isStaff: true
// Or roles containing "Staff", "Administrators", etc.

// To check if you're detected as staff, use browser console:
fetch('/api/prayers/1/approve', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('mpp-widgets_AuthToken')}`,
    'Content-Type': 'application/json'
  }
})
.then(r => r.json())
.then(console.log);

// If you get 403, you're not detected as staff
// If you get 200 or 404, staff permissions are working
```

#### 🐛 Debug Mode
```javascript
// Check if token exists
console.log('Token:', localStorage.getItem('mpp-widgets_AuthToken'));

// Manually validate token
fetch('https://my.woodsidebible.org/widgets/Api/Auth/User', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('mpp-widgets_AuthToken')}`
  }
})
.then(r => r.json())
.then(console.log);

// Check API directly
fetch('http://localhost:3002/api/prayers?approved=true', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('mpp-widgets_AuthToken')}`
  }
})
.then(r => r.json())
.then(console.log);
```

### Testing with Real Data

#### Create Test Prayer Categories (Feedback Types)

In MinistryPlatform, add records to `Feedback_Types`:
```sql
INSERT INTO Feedback_Types (Feedback_Type, Description, Domain_ID)
VALUES
  ('Prayer Request', 'General prayer requests', 1),
  ('Praise Report', 'Answered prayers and praises', 1),
  ('Urgent Need', 'Urgent prayer needs', 1),
  ('Healing', 'Prayers for healing', 1);
```

#### Create Test Prayers (Feedback)

```sql
-- Approved prayer (will show immediately)
INSERT INTO Feedback (Contact_ID, Feedback_Type_ID, Entry_Title, Description, Date_Submitted, Approved, Domain_ID)
VALUES (
  YOUR_CONTACT_ID,
  1,
  'Prayer for Peace',
  'Please pray for peace in our community during these challenging times.',
  GETDATE(),
  1,
  1
);

-- Unapproved prayer (requires staff approval)
INSERT INTO Feedback (Contact_ID, Feedback_Type_ID, Entry_Title, Description, Date_Submitted, Approved, Domain_ID)
VALUES (
  YOUR_CONTACT_ID,
  1,
  'Prayer for Guidance',
  'Seeking guidance for an important decision.',
  GETDATE(),
  0,
  1
);
```

### Development Features (Auto-Removed in Production)

These features only appear when `NODE_ENV === 'development'`:

1. **Blue Dev Header** - Shows MP login widget status
2. **Enhanced Error Messages** - More helpful development hints
3. **Console Logging** - API calls are logged to console

In production builds (`npm run build`), these are automatically hidden.

### Common Issues & Solutions

#### 🚫 "MP Widgets script doesn't load"

**Problem:** The DevLoginWidget shows "Loading MP Widgets script..."

**Solutions:**
1. Check network tab - is `MPWidgets.js` loading?
2. Try accessing https://my.woodsidebible.org/widgets/dist/MPWidgets.js directly
3. Check for CORS errors in console
4. Verify you're connected to internet

#### 🚫 "Token exists but still showing login prompt"

**Problem:** Token in localStorage but widget says not authenticated

**Solutions:**
```javascript
// 1. Check if token is valid
fetch('https://my.woodsidebible.org/widgets/Api/Auth/User', {
  headers: { 'Authorization': `Bearer ${localStorage.getItem('mpp-widgets_AuthToken')}` }
})
.then(r => {
  console.log('Token valid:', r.ok);
  return r.json();
})
.then(console.log);

// 2. Check token format
const token = localStorage.getItem('mpp-widgets_AuthToken');
console.log('Token format:', token?.substring(0, 20) + '...');

// 3. Clear and re-authenticate
localStorage.removeItem('mpp-widgets_AuthToken');
// Refresh page and sign in again
```

#### 🚫 "API returns 401 Unauthorized"

**Problem:** API calls failing with 401

**Solutions:**
1. Verify token is being sent:
   ```javascript
   // Check API request headers
   fetch('http://localhost:3002/api/prayers', {
     headers: {
       'Authorization': `Bearer ${localStorage.getItem('mpp-widgets_AuthToken')}`
     }
   }).then(r => console.log('Status:', r.status));
   ```

2. Check server logs for auth errors
3. Verify `NEXT_PUBLIC_MP_WIDGETS_AUTH_ENDPOINT` in `.env`

#### 🚫 "No prayers showing up"

**Problem:** Successfully authenticated but no prayers display

**Solutions:**
1. Check if prayers exist in Feedback table:
   ```sql
   SELECT TOP 10 * FROM Feedback WHERE Approved = 1 ORDER BY Date_Submitted DESC
   ```

2. Check API response:
   ```javascript
   fetch('http://localhost:3002/api/prayers?approved=true', {
     headers: {
       'Authorization': `Bearer ${localStorage.getItem('mpp-widgets_AuthToken')}`
     }
   })
   .then(r => r.json())
   .then(prayers => console.log('Prayers:', prayers));
   ```

3. Check for console errors
4. Verify MP API credentials in `.env`

### Testing Checklist

Before considering development complete, test these scenarios:

- [ ] MP Widgets script loads successfully
- [ ] Can sign in via MP login widget
- [ ] Token is stored in localStorage
- [ ] Prayer wall appears after authentication
- [ ] Can submit a new prayer
- [ ] Submitted prayer appears in MP Feedback table
- [ ] New prayers have `Approved = 0`
- [ ] Only approved prayers show in main view
- [ ] Can filter by category
- [ ] Search functionality works
- [ ] Swipe right removes prayer from view
- [ ] Swipe left removes prayer from view
- [ ] Stack/List toggle works
- [ ] Mobile responsive (test with browser DevTools)
- [ ] Staff can approve prayers (if you have staff role)
- [ ] Can edit own prayers
- [ ] Can delete own prayers

### Next Steps

Once local development is working:

1. **Deploy to Vercel** - Push to GitHub and connect to Vercel
2. **Configure Production** - Set environment variables in Vercel
3. **Test Production** - Verify everything works on production URL
4. **Embed on WordPress** - Follow SETUP.md instructions
5. **Configure CORS** - Add your WordPress domain to allowed origins

### Tips for Faster Development

1. **Keep DevTools Open** - Monitor Network and Console tabs
2. **Use React DevTools** - Install extension for component debugging
3. **Hot Reload** - Next.js auto-refreshes on file changes
4. **Quick Token Check** - Bookmark this JavaScript snippet:
   ```javascript
   javascript:(function(){alert('Token: ' + (localStorage.getItem('mpp-widgets_AuthToken') ? 'EXISTS' : 'MISSING'))})();
   ```

Happy coding! 🚀
