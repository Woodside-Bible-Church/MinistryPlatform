# Network Troubleshooting Summary - SQL Server Remote Access

**Date:** November 14, 2025
**Goal:** Enable direct SQL Server access from Mac over WatchGuard VPN (eliminate need for RDP)
**Current Status:** ❌ Blocked at network layer
**Tested By:** Colton Wirgau with Claude Code assistance

---

## Executive Summary

We successfully configured SQL Server and Windows Firewall to accept remote connections, but connections from the VPN are being blocked at the **network/router level** between the VPN gateway and SQL Server. This is NOT a SQL Server or Windows configuration issue.

**What works:**
- ✅ SQL Server is properly configured and accepting network connections
- ✅ SQL authentication account exists with correct permissions
- ✅ Windows Firewall rules are configured correctly
- ✅ TCP/IP protocol is enabled on SQL Server

**What's blocking:**
- ❌ Network layer between WatchGuard VPN subnet and SQL Server subnet
- ❌ Likely WatchGuard firewall, network firewall, or VLAN restrictions

---

## Environment Details

### VPN Configuration
- **VPN Type:** WatchGuard SSL VPN
- **VPN Gateway:** tmvpn.highergroundtech.com (216.37.67.66:4443)
- **VPN Subnet:** `10.11.113.0/24`
- **Client VPN IP:** `10.11.113.4`
- **VPN Gateway IP:** `10.11.113.1`

### SQL Server Configuration
- **Server Hostname:** TM-WOODSIDE-SQL
- **Server IP:** `10.206.0.131`
- **SQL Server Subnet:** `10.206.0.0/22` (includes 10.206.0.0 - 10.206.3.255)
- **SQL Server Port:** 1433 (TCP)
- **SQL Server Version:** 13.0.7065.1
- **Authentication:** SQL Server authentication
- **Login Account:** `Woodside_Development`
- **Databases:** MinistryPlatform, MinistryPlatformTesting

### Network Routing
VPN is configured to route `10.206.0.0/255.255.252.0` through gateway `10.11.113.1`:
```
route add -net 10.206.0.0 10.11.113.1 255.255.252.0
```

---

## Tests Performed

### ✅ Test 1: SQL Server Listening on Network
**Command:** `netstat -an | findstr :1433`

**Result:** SUCCESS - SQL Server listening on all interfaces
```
TCP    0.0.0.0:1433           0.0.0.0:0              LISTENING
TCP    10.206.0.131:1433      10.206.0.130:XXXXX     ESTABLISHED (multiple connections)
```

**Conclusion:** SQL Server is properly configured for network connections.

---

### ✅ Test 2: TCP/IP Protocol Enabled
**Command:**
```powershell
Get-ItemProperty -Path "HKLM:\SOFTWARE\Microsoft\Microsoft SQL Server\MSSQL*\MSSQLServer\SuperSocketNetLib\Tcp" -Name Enabled
```

**Result:** SUCCESS - Enabled : 1

**Conclusion:** TCP/IP protocol is enabled in SQL Server configuration.

---

### ✅ Test 3: Windows Firewall ALLOW Rules
**Commands:**
```powershell
# First rule (VPN-specific)
New-NetFirewallRule -DisplayName "SQL Server VPN" -Direction Inbound -LocalPort 1433 -Protocol TCP -Action Allow -RemoteAddress 10.11.113.0/24 -Profile Domain,Private

# Second rule (all networks - broader)
New-NetFirewallRule -DisplayName "SQL Server All Networks" -Direction Inbound -LocalPort 1433 -Protocol TCP -Action Allow -Profile Any
```

**Result:** SUCCESS - Both rules created successfully
- Enabled: True
- Direction: Inbound
- Action: Allow
- Status: OK

**Conclusion:** Windows Firewall configured to allow SQL Server traffic.

---

### ✅ Test 4: No BLOCK Rules on Port 1433
**Command:**
```powershell
Get-NetFirewallRule | Where-Object { $_.Enabled -eq $true -and $_.Direction -eq "Inbound" -and $_.Action -eq "Block" } | Get-NetFirewallPortFilter | Where-Object { $_.LocalPort -eq 1433 }
```

**Result:** SUCCESS - No output (no blocking rules)

**Conclusion:** No Windows Firewall rules are blocking port 1433.

---

### ❌ Test 5: Connection from VPN
**Command:** `npm run test:sandbox` (connects to TM-WOODSIDE-SQL:1433)

**Result:** FAILED - Connection timeout after 30 seconds
```
Error: Failed to connect to TM-WOODSIDE-SQL:1433 in 30000ms
```

**Also tested:**
- `ping 10.206.0.131` → 100% packet loss (ICMP blocked)
- `nc -zv -w 5 10.206.0.131 1433` → Connection timeout (TCP blocked)

**Conclusion:** Network layer is blocking traffic from VPN to SQL Server.

---

### ❌ Test 6: Connection with Windows Firewall Completely Disabled
**Command:**
```powershell
Set-NetFirewallProfile -Profile Domain,Public,Private -Enabled False
```

**Result:** STILL FAILED - Connection timeout persists

**Conclusion:** This definitively proves Windows Firewall is NOT the issue. The block is happening at the network/router level.

---

## Root Cause Analysis

### Confirmed NOT the Issue
- ❌ SQL Server configuration
- ❌ SQL Server TCP/IP protocol
- ❌ Windows Firewall configuration
- ❌ VPN connectivity (VPN connects successfully)
- ❌ DNS resolution (hostname resolves correctly)

### Confirmed IS the Issue
- ✅ **Network layer blocking between VPN gateway and SQL Server**

### Most Likely Causes (in order of probability)

1. **WatchGuard VPN Firewall**
   - The WatchGuard appliance itself may have packet filtering rules
   - Default VPN policies often block database ports for security
   - Needs configuration to allow port 1433 from VPN clients to 10.206.0.131

2. **Network Firewall/Router**
   - Firewall between VPN subnet (10.11.113.0/24) and SQL Server subnet (10.206.0.0/22)
   - May have ACLs (Access Control Lists) restricting traffic
   - Needs rule to allow TCP/1433 from 10.11.113.0/24 to 10.206.0.131

3. **VLAN Segmentation**
   - SQL Server may be on a restricted VLAN
   - VPN clients may be on different VLAN with inter-VLAN routing restrictions
   - Needs VLAN ACL update or routing configuration

4. **Hosting Company Firewall**
   - If server is hosted, hosting company may have external firewall
   - Needs configuration to allow inbound SQL traffic from VPN IPs

---

## Required Changes

### For WatchGuard VPN Administrator

**Check and modify WatchGuard firewall rules:**

1. **Allow SQL Server traffic from VPN clients:**
   - Source: `10.11.113.0/24` (VPN client subnet)
   - Destination: `10.206.0.131` (SQL Server)
   - Protocol: TCP
   - Port: 1433
   - Action: Allow

2. **Verify VPN routing:**
   - Ensure `10.206.0.0/22` subnet is properly routed through VPN tunnel
   - Current routing appears correct (pushed via VPN config)

3. **Check VPN packet filtering:**
   - Some VPN appliances have deep packet inspection that blocks database traffic
   - May need to disable DPI for SQL traffic or add exception

**WatchGuard Configuration Path:**
- Fireware Web UI → Firewall → Firewall Policies
- Look for policies affecting VPN traffic (Mobile VPN, SSLVPN policies)

---

### For Network Administrator

**Check network firewalls/routers between:**
- VPN gateway IP: `10.11.113.1`
- SQL Server IP: `10.206.0.131`

**Required firewall rule:**
- Source: `10.11.113.0/24` (or specific IP: `10.11.113.4`)
- Destination: `10.206.0.131`
- Protocol: TCP
- Port: 1433
- Action: Allow
- Direction: Inbound

**Verify routing:**
```bash
# On network firewall/router
traceroute 10.206.0.131
```

---

### For Hosting Company (if applicable)

If TM-WOODSIDE-SQL is hosted, the hosting company may need to:

1. **Allow inbound SQL traffic:**
   - From: WatchGuard VPN public IP: `216.37.67.66`
   - Or from: VPN subnet after NAT
   - To: Server IP `10.206.0.131`
   - Port: TCP/1433

2. **Verify no port blocking:**
   - Confirm port 1433 is not blocked at edge firewall
   - Check if hosting firewall has SQL-specific filtering

---

## Testing Steps (After Network Changes)

### Step 1: Basic Connectivity Test
```bash
# On Mac (while connected to VPN)
nc -zv -w 5 TM-WOODSIDE-SQL 1433
```

**Expected result:** `Connection to TM-WOODSIDE-SQL port 1433 [tcp] succeeded!`

---

### Step 2: SQL Server Connection Test
```bash
cd ~/MinistryPlatform/Database
npm run test:sandbox
```

**Expected result:**
```
Connecting to: TM-WOODSIDE-SQL/MinistryPlatformTesting
Running: test-connection.sql

┌─────────┬──────────────────────────┬──────────────────┐
│ (index) │ DatabaseName             │ CurrentDateTime  │
├─────────┼──────────────────────────┼──────────────────┤
│    0    │ MinistryPlatformTesting  │ 2025-11-14 ...   │
└─────────┴──────────────────────────┴──────────────────┘

✓ Successfully executed test-connection.sql
```

---

### Step 3: VS Code SQL Extension
Once connection works:
1. Open VS Code
2. Press `Cmd+Shift+P` → "MS SQL: Connect"
3. Select "MP Sandbox" or "MP Production"
4. Enter password: `Kx9m!Yn2@Qz7^Wt8&Rj5`
5. Browse databases, run queries directly in VS Code

---

## Benefits Once Working

### Current Workflow (RDP)
1. Connect to VPN
2. Open Remote Desktop app
3. Wait for RDP to connect
4. Navigate to SQL Server Management Studio
5. Execute queries/deploy scripts
6. Copy results back to Mac

**Estimated time per operation:** 2-5 minutes

### New Workflow (Direct Connection)
1. Connect to VPN
2. Run npm script from terminal OR use VS Code SQL extension
3. See results immediately

**Estimated time per operation:** 5-10 seconds

### Additional Benefits
- ✅ Version control for all SQL scripts
- ✅ One-command deployment (`npm run rsvp:emails`)
- ✅ Separate test/production environments
- ✅ Work in native Mac environment
- ✅ No RDP lag or display issues
- ✅ Better integration with development workflow

---

## Files and Configuration

### Local Mac Setup (Already Complete)
- **Database folder:** `/Users/coltonwirgau/MinistryPlatform/Database/`
- **Environment config:** `Database/.env` (credentials configured)
- **Node.js SQL runner:** `Database/run-sql.js` (working correctly)
- **npm scripts:** `Database/package.json` (all commands ready)
- **VS Code config:** `Database/.vscode/settings.json` (connection profiles ready)
- **Hosts file entry:** `/etc/hosts` contains `10.206.0.131 TM-WOODSIDE-SQL`

### SQL Server Setup (Already Complete)
- **Listening:** All network interfaces on port 1433 ✅
- **TCP/IP:** Enabled ✅
- **SQL Auth:** Woodside_Development account exists ✅
- **Windows Firewall:** Allow rules configured ✅
- **Databases:** MinistryPlatform and MinistryPlatformTesting accessible ✅

### Still Needed
- **Network firewall rule** to allow VPN → SQL Server traffic

---

## Contact Information

**User:** Colton Wirgau
**Organization:** Woodside Bible Church
**VPN Provider:** Higher Ground Technologies (tmvpn.highergroundtech.com)
**Server:** TM-WOODSIDE-SQL (10.206.0.131)

---

## Questions for IT Team

1. **WatchGuard VPN Configuration:**
   - Does the WatchGuard appliance have firewall rules filtering VPN traffic?
   - Are there packet filtering policies that might block port 1433?
   - Can you add a policy to allow TCP/1433 from VPN clients to 10.206.0.131?

2. **Network Firewall:**
   - Is there a firewall between the VPN gateway (10.11.113.1) and SQL Server (10.206.0.131)?
   - Can you check logs to see if traffic is being blocked?
   - Can you add a rule to allow TCP/1433 from 10.11.113.0/24 to 10.206.0.131?

3. **Hosting Company (if applicable):**
   - Is TM-WOODSIDE-SQL hosted externally?
   - Does the hosting company have firewall rules that might block this?
   - What is the process to request firewall changes?

---

## Appendix: Technical Commands Used

### Windows PowerShell (Run on SQL Server as Administrator)

**Check SQL Server listening:**
```powershell
netstat -an | findstr :1433
```

**Check TCP/IP enabled:**
```powershell
Get-ItemProperty -Path "HKLM:\SOFTWARE\Microsoft\Microsoft SQL Server\MSSQL*\MSSQLServer\SuperSocketNetLib\Tcp" -Name Enabled
```

**Create firewall rules:**
```powershell
New-NetFirewallRule -DisplayName "SQL Server VPN" -Direction Inbound -LocalPort 1433 -Protocol TCP -Action Allow -RemoteAddress 10.11.113.0/24 -Profile Domain,Private
New-NetFirewallRule -DisplayName "SQL Server All Networks" -Direction Inbound -LocalPort 1433 -Protocol TCP -Action Allow -Profile Any
```

**Check for blocking rules:**
```powershell
Get-NetFirewallRule | Where-Object { $_.Enabled -eq $true -and $_.Direction -eq "Inbound" -and $_.Action -eq "Block" } | Get-NetFirewallPortFilter | Where-Object { $_.LocalPort -eq 1433 }
```

### Mac Terminal (Testing from Mac)

**Test port connectivity:**
```bash
nc -zv -w 5 TM-WOODSIDE-SQL 1433
```

**Test SQL connection:**
```bash
cd ~/MinistryPlatform/Database
npm run test:sandbox
```

---

## Summary

Everything on the SQL Server and Mac sides is configured correctly. The final hurdle is a **network firewall rule** that needs to be added to allow SQL Server traffic from the VPN subnet to the SQL Server. Once this network change is made, Colton will be able to work directly from his Mac without needing Remote Desktop.

**Next Step:** Work with IT/hosting company to add the required firewall rule allowing TCP/1433 from `10.11.113.0/24` to `10.206.0.131`.
