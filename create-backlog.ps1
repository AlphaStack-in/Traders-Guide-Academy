$yaml = @'
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

Set-Content -Path ".\backlog.yaml" -Value $yaml -Encoding UTF8

Write-Host ""
Write-Host "====================================" -ForegroundColor Green
Write-Host " backlog.yaml created successfully " -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Green
Write-Host ""
Write-Host "Location: $(Resolve-Path .\backlog.yaml)"