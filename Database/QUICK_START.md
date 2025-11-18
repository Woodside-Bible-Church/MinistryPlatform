# Database Quick Start Guide

## Once Network Access is Working

After IT enables the network firewall rule, you'll be able to work directly from your Mac without RDP!

---

## Daily Workflow

### 1. Connect to VPN
Always connect to WatchGuard VPN first:
- VPN will automatically route `10.206.0.0/22` traffic
- Your VPN IP will be `10.11.113.4` or similar

### 2. Test Connection (First Time / Verify Access)
```bash
cd ~/MinistryPlatform/Database
npm run test:sandbox
```

**Expected:** Shows database info, confirms connection works

---

## Common Tasks

### Deploy RSVP Email Campaigns (Next Priority)

Once network access works, deploy the email system we built:

```bash
cd ~/MinistryPlatform/Database

# Test on sandbox first
npm run rsvp:emails:test        # Create email campaign tables
npm run rsvp:scheduler:test     # Deploy email scheduler
npm run rsvp:submit:test        # Deploy updated RSVP submission

# If successful, deploy to production
npm run rsvp:emails             # Create email campaign tables (prod)
npm run rsvp:scheduler          # Deploy email scheduler (prod)
npm run rsvp:submit             # Deploy updated RSVP submission (prod)
```

See `NextJS/Widgets/RSVP/database/RSVP_EMAIL_CAMPAIGNS_GUIDE.md` for full documentation.

---

### Run Any SQL Script

**Sandbox/Testing database:**
```bash
npm run db:run:test path/to/script.sql
```

**Production database:**
```bash
npm run db:run path/to/script.sql
```

**Example:**
```bash
npm run db:run:test StoredProcs/RSVP/sp-submit-rsvp-with-audit.sql
```

---

### Using VS Code SQL Extension

1. **Connect to Database:**
   - Press `Cmd+Shift+P`
   - Type "MS SQL: Connect"
   - Select "MP Sandbox" or "MP Production"
   - Enter password: `Kx9m!Yn2@Qz7^Wt8&Rj5`

2. **Browse Database:**
   - Left sidebar → SQL Server icon
   - Expand server → Databases → Tables/Views/etc.

3. **Run Queries:**
   - Open any `.sql` file
   - Select the SQL you want to run
   - Press `Cmd+Shift+E` (or right-click → Execute Query)
   - Results appear in a new tab

4. **IntelliSense:**
   - Type table names → autocomplete suggestions
   - Type `SELECT * FROM ` → shows available tables
   - Ctrl+Space → manual autocomplete

---

## Available npm Scripts

### Test Connection
```bash
npm test                  # Test production database connection
npm run test:sandbox      # Test sandbox database connection
```

### RSVP Scripts
```bash
# Schema
npm run rsvp:schema           # Deploy RSVP schema (prod)
npm run rsvp:schema:test      # Deploy RSVP schema (sandbox)

# Stored Procedures
npm run rsvp:submit           # Deploy submit RSVP SP (prod)
npm run rsvp:submit:test      # Deploy submit RSVP SP (sandbox)

npm run rsvp:scheduler        # Deploy email scheduler SP (prod)
npm run rsvp:scheduler:test   # Deploy email scheduler SP (sandbox)

# Email Campaigns Migration
npm run rsvp:emails           # Deploy email tables (prod)
npm run rsvp:emails:test      # Deploy email tables (sandbox)
```

### Custom Scripts
```bash
# Campus slug customization
npm run custom:campus-slug         # Deploy campus slug (prod)
npm run custom:campus-slug:test    # Deploy campus slug (sandbox)
```

---

## File Organization

```
Database/
├── .env                          # Database credentials (local only)
├── .env.example                  # Example env file (committed to git)
├── run-sql.js                    # Node.js SQL runner (you don't need to touch this)
├── package.json                  # npm scripts
├── Custom/                       # Custom database schema
├── Customizations/               # One-off customizations
├── Migrations/                   # Database migrations
│   └── 2025-11-14-rsvp-email-campaigns.sql
├── StoredProcs/                  # Stored procedures
│   └── RSVP/
│       ├── sp-submit-rsvp-with-audit.sql
│       └── sp-schedule-rsvp-emails.sql
└── Docs/                         # Documentation
```

---

## Troubleshooting

### Connection Fails
1. **Check VPN:** Are you connected to WatchGuard VPN?
   ```bash
   # Should show 10.11.113.x IP
   ifconfig | grep "10.11.113"
   ```

2. **Test basic connectivity:**
   ```bash
   nc -zv -w 5 TM-WOODSIDE-SQL 1433
   ```
   Should say: `Connection succeeded`

3. **Check credentials:**
   ```bash
   cat ~/MinistryPlatform/Database/.env | grep SQL_
   ```

### "File not found" Error
Make sure you're in the Database directory:
```bash
cd ~/MinistryPlatform/Database
pwd  # Should show: /Users/coltonwirgau/MinistryPlatform/Database
```

### SQL Syntax Error
- Check the SQL file for typos
- Make sure `GO` statements are on their own line
- SQL comments use `--` not `#` or `//`

### Permission Denied
The `Woodside_Development` account might not have permission for that operation. You may need to:
- Use an admin account for schema changes
- Or grant additional permissions to `Woodside_Development`

---

## Next Steps (Monday)

1. ✅ Check email from IT about network firewall rule
2. ✅ Connect to VPN
3. ✅ Test connection: `npm run test:sandbox`
4. ✅ If works, deploy RSVP email campaigns (commands above)
5. ✅ Set up VS Code SQL extension
6. ✅ Celebrate not needing RDP anymore! 🎉

---

## Reference Documents

- **NETWORK_TROUBLESHOOTING_SUMMARY.md** - For IT team (comprehensive network analysis)
- **SETUP_COMPLETED.md** - What was set up (Node.js approach, why it's better)
- **TESTING.md** - Detailed testing and deployment guide
- **ENABLE_REMOTE_ACCESS.md** - Windows PowerShell commands we ran
- **README.md** - Main database folder overview

---

## Pro Tips

### Faster Terminal Navigation
Add this to your `~/.zshrc`:
```bash
alias db='cd ~/MinistryPlatform/Database'
alias dbtest='cd ~/MinistryPlatform/Database && npm run test:sandbox'
```

Then just type `db` to jump to Database folder or `dbtest` to test connection!

### VS Code Workspace
Open the entire MinistryPlatform folder in VS Code:
```bash
code ~/MinistryPlatform
```

This gives you:
- File explorer with all projects
- SQL extension with database connections
- Integrated terminal
- Git integration

### Git Best Practices
When making database changes:
```bash
cd ~/MinistryPlatform/Database
git status                          # See what changed
git add Migrations/                 # Stage specific files
git commit -m "Add RSVP email campaigns"
git push
```

---

## Questions?

All documentation is in `/Users/coltonwirgau/MinistryPlatform/Database/`

If you run into issues, check:
1. VPN connection
2. Network firewall rule (from IT)
3. `.env` file credentials
4. Existing documentation files

Once the network is working, everything should be smooth sailing!
