# Enable Remote SQL Server Access

## Problem
SQL Server connections from your Mac over VPN are timing out, even though:
- VPN is connected and routing `10.206.0.0/22` traffic
- `Woodside_Development` SQL login exists with correct permissions
- You can connect via RDP and use SQL Server locally

## Root Cause
Most likely **Windows Firewall** is blocking port 1433 from remote IPs.

## Solution: Run This Inside RDP

1. **Open RDP** to `10.206.0.131` (SQL Server machine)
2. **Open PowerShell as Administrator**
3. **Run these commands** to check and fix firewall:

### Step 1: Check if SQL Server is listening on network

```powershell
# Check SQL Server network configuration
Get-ItemProperty -Path "HKLM:\SOFTWARE\Microsoft\Microsoft SQL Server\MSSQL*\MSSQLServer\SuperSocketNetLib\Tcp\IPAll"
```

**Expected output:**
- `TcpPort` should be `1433`
- `TcpDynamicPorts` should be empty

### Step 2: Check Windows Firewall rules

```powershell
# Check for SQL Server firewall rule
Get-NetFirewallRule -DisplayName "*SQL*" | Format-Table DisplayName, Enabled, Direction, Action
```

**Look for:**
- A rule for SQL Server port 1433
- Should be Enabled, Inbound, Allow

### Step 3: Create firewall rule if missing

```powershell
# Create firewall rule to allow SQL Server from VPN network
New-NetFirewallRule `
    -DisplayName "SQL Server (TCP-In) from VPN" `
    -Direction Inbound `
    -LocalPort 1433 `
    -Protocol TCP `
    -Action Allow `
    -RemoteAddress 10.11.113.0/24 `
    -Profile Domain,Private
```

This allows connections from the VPN subnet (`10.11.113.0/24`) to SQL Server port 1433.

### Step 4: Verify SQL Server is accepting remote connections

```powershell
# Check SQL Server configuration
sqlcmd -S localhost -E -Q "SELECT SERVERPROPERTY('IsIntegratedSecurityOnly')"
```

**Expected output:** `0` (means SQL Server auth is enabled)

### Step 5: Test from Mac

After running the firewall command, test from your Mac terminal:

```bash
cd /Users/coltonwirgau/MinistryPlatform/Database
npm run test:sandbox
```

**Expected output:**
```
Connecting to: TM-WOODSIDE-SQL/MinistryPlatformTesting
Running: test-connection.sql

┌─────────┬────────────────────────┬─────────────────┐
│ (index) │   DatabaseName         │ CurrentDateTime │
├─────────┼────────────────────────┼─────────────────┤
│    0    │ MinistryPlatformTesting│ 2025-11-14 ...  │
└─────────┴────────────────────────┴─────────────────┘

✓ Successfully executed test-connection.sql
```

## Alternative: More Permissive Firewall Rule

If the VPN subnet rule doesn't work, you can try allowing from the entire VPN network:

```powershell
New-NetFirewallRule `
    -DisplayName "SQL Server (TCP-In) - All Networks" `
    -Direction Inbound `
    -LocalPort 1433 `
    -Protocol TCP `
    -Action Allow `
    -Profile Domain,Private,Public
```

**⚠️ Warning:** This is less secure. Prefer the VPN-specific rule above.

## Troubleshooting

### Still can't connect?

1. **Check SQL Server service is running:**
   ```powershell
   Get-Service -Name MSSQL*
   ```

2. **Check SQL Server error log for connection attempts:**
   ```powershell
   Get-Content "C:\Program Files\Microsoft SQL Server\MSSQL13.MSSQLSERVER\MSSQL\Log\ERRORLOG" -Tail 50
   ```

3. **Verify SQL Browser service (if using named instances):**
   ```powershell
   Get-Service -Name SQLBrowser
   ```

4. **Check if another firewall/security software is blocking:**
   - Third-party antivirus
   - Network security policies
   - SQL Server connection limits

## Once Working

After you can connect from your Mac:

1. **Update VS Code connection profiles** to use `TM-WOODSIDE-SQL` or `10.206.0.131`
2. **Test all npm scripts** work:
   - `npm test` (production)
   - `npm run test:sandbox` (testing)
3. **Deploy RSVP email campaigns:**
   - `npm run rsvp:emails:test`
   - `npm run rsvp:scheduler:test`
   - `npm run rsvp:submit:test`

## Still Need Help?

If firewall rules don't work, check with your IT admin about:
- Network ACLs between VPN and SQL Server
- SQL Server connection limits
- Domain security policies blocking SQL auth from network
