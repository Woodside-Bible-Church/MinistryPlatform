# Quick Reference - Database Commands

## Test Connection

```bash
cd /Users/coltonwirgau/MinistryPlatform/Database

# Sandbox (recommended first)
npm run test:sandbox

# Production
npm test
```

---

## Deploy RSVP Email System

### Sandbox (Test First)
```bash
npm run rsvp:emails:test     # Create tables
npm run rsvp:scheduler:test  # Deploy scheduler
npm run rsvp:submit:test     # Deploy submit procedure
```

### Production (After testing)
```bash
npm run rsvp:emails          # Create tables
npm run rsvp:scheduler       # Deploy scheduler
npm run rsvp:submit          # Deploy submit procedure
```

---

## Run Custom SQL File

```bash
# Sandbox
npm run db:run:test path/to/file.sql

# Production
npm run db:run path/to/file.sql
```

---

## Check Installation Status

```bash
# Check if sqlcmd is installed
sqlcmd -?

# Check brew installation
brew list | grep mssql
```

---

## VS Code SQL Server

1. Install extension: `ms-mssql.mssql`
2. Press `Cmd+Shift+P`
3. Type: "MS SQL: Connect"
4. Select: "MP Sandbox" or "MP Production"
5. Enter password: `Kx9m!Yn2@Qz7^Wt8&Rj5`

---

## Credentials

**Location:** `/Users/coltonwirgau/MinistryPlatform/Database/.env`

```
SQL_USER=Woodside_Development
SQL_PASSWORD=Kx9m!Yn2@Qz7^Wt8&Rj5
SQL_SERVER=10.206.0.131
```

**Note:** Must be on VPN to connect

---

## Documentation

- `README.md` - Overview
- `GETTING_STARTED.md` - Setup guide
- `TESTING.md` - Testing & deployment
- `SETUP_SUMMARY.md` - What was done today
- `TODO.md` - Long-term tasks

---

## Troubleshooting

**"sqlcmd: command not found"**
```bash
brew install msodbcsql18 mssql-tools18
```

**"Login failed"**
- Check VPN connection
- Verify .env credentials

**Need help?**
See `TESTING.md` for detailed troubleshooting
