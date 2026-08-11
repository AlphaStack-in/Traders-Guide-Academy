# create-files.ps1

$backlog = @'
project:
  owner: technojegan
  repo: Traders_Hub_Center

labels:
  - P0
  - P1
  - P2
  - P3
  - Epic
  - Feature
  - Backend
  - Frontend
  - Infrastructure
  - Authentication
  - Database
  - Dhan
  - Goodwill
  - Analytics
  - AI

milestones:
  - Beta v1
  - Production v1
  - Goodwill Launch
  - Analytics v1.1
  - AI Assistant v2

epics:

- title: Production Readiness
  issues:
    - Split Production and Staging Supabase
    - Configure Resend SMTP
    - Purchase Email Domain
    - Configure SPF and DKIM
    - Configure SMTP in Supabase
    - Production Monitoring
    - Backup Strategy
    - Disaster Recovery

- title: Dhan Integration
  issues:
    - Complete Live Dhan Order Test
    - Handle Order Rejections
    - Position Synchronization
    - Order Status Sync
    - Fund Balance Refresh
    - Retry Failed Orders
    - Order History

- title: Goodwill Broker
  issues:
    - OTP Confirmation Flow
    - Webhook Receiver
    - GIGAPRO API Integration
    - Live Order Placement
    - Order Status Updates

- title: Admin Portal
  issues:
    - KPI Dashboard
    - Revenue Dashboard
    - Subscriber Analytics
    - Batch Management
    - Export Reports

- title: Subscriber Portal
  issues:
    - Portfolio Dashboard
    - Trade Statistics
    - Watchlist
    - Favorite Signals
    - Notification Preferences

- title: Notifications
  issues:
    - Target Hit Animation
    - Stop Loss Animation
    - Push Notifications
    - Notification History

- title: Analytics
  issues:
    - Win Rate Dashboard
    - ROI Dashboard
    - Revenue Analytics
    - Subscriber Growth

- title: AI Features
  issues:
    - AI Signal Summary
    - AI Risk Score
    - AI Trade Analysis
    - AI Chat Assistant

- title: UI & UX
  issues:
    - Homepage Redesign
    - Pricing Page
    - FAQ Page
    - Mobile Responsive Design

- title: Security
  issues:
    - API Security Review
    - Secret Rotation
    - Audit Trail
    - Rate Limiting
'@

$python = @'
import yaml
import subprocess

with open("backlog.yaml","r",encoding="utf-8") as f:
    data=yaml.safe_load(f)

repo=f"{data['project']['owner']}/{data['project']['repo']}"

print("Repository:",repo)

print("Creating Labels...")
for label in data["labels"]:
    subprocess.run(["gh","label","create",label,"--repo",repo,"--force"])

print("Creating Milestones...")
existing=subprocess.run(
    ["gh","api",f"repos/{repo}/milestones"],
    capture_output=True,
    text=True
).stdout

for m in data["milestones"]:
    if m in existing:
        continue
    subprocess.run([
        "gh","api",
        f"repos/{repo}/milestones",
        "-X","POST",
        "-f",f"title={m}"
    ])

print("Creating Issues...")

for epic in data["epics"]:

    subprocess.run([
        "gh","issue","create",
        "--repo",repo,
        "--title",epic["title"],
        "--label","Epic",
        "--body",f"Epic: {epic['title']}"
    ])

    for issue in epic["issues"]:
        subprocess.run([
            "gh","issue","create",
            "--repo",repo,
            "--title",issue,
            "--body",f"Part of Epic: {epic['title']}"
        ])

print("Done!")
'@

Set-Content backlog.yaml $backlog -Encoding UTF8
Set-Content sync.py $python -Encoding UTF8

Write-Host ""
Write-Host "===================================" -ForegroundColor Green
Write-Host " Files Created Successfully" -ForegroundColor Green
Write-Host "===================================" -ForegroundColor Green
Write-Host ""
Write-Host "Created:"
Write-Host "  backlog.yaml"
Write-Host "  sync.py"
Write-Host ""
Write-Host "Next:"
Write-Host "pip install pyyaml"
Write-Host "python sync.py"