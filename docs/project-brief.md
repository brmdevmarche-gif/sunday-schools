# Knasty Portal - Project Brief

**Version:** 1.0
**Date:** January 2026
**Author:** Mary (Business Analyst Agent)

---

## Executive Summary

**Knasty Portal** is a comprehensive **Sunday School Management System** built specifically for the Coptic Orthodox Church. It provides a multi-tenant platform enabling dioceses, churches, and individual classes to manage students, track attendance, facilitate spiritual activities, and operate a points-based reward system.

The platform addresses the unique needs of Sunday school administrators, teachers, parents, and students through a modern, bilingual (English/Arabic) web application with full RTL support.

---

## Problem Statement

Sunday schools within the Coptic Orthodox Church face several operational challenges:

1. **Fragmented Management**: No unified system for tracking students across dioceses, churches, and classes
2. **Manual Attendance**: Paper-based or spreadsheet attendance tracking is error-prone and time-consuming
3. **Lack of Engagement**: Limited tools to motivate and reward student participation in spiritual activities
4. **Communication Gaps**: Difficulty in sending targeted announcements to the right groups
5. **Administrative Overhead**: Church administrators spend excessive time on manual data management
6. **Language Barriers**: Need for bilingual support (English/Arabic) with proper RTL layout

---

## Solution Overview

Knasty Portal provides an integrated platform with:

| Capability | Description |
|------------|-------------|
| **Hierarchical Organization** | Diocese > Church > Class structure with role-based access |
| **User Management** | Students, Parents, Teachers, and Administrators with family linking |
| **Attendance Tracking** | Digital attendance with automatic points integration |
| **Activities & Points** | Gamified spiritual activities with approval workflows |
| **Enhanced Activities** | Spiritual Notes, Competitions, Daily Bible Readings |
| **Trips Management** | Multi-destination trips with participant tracking and payments |
| **Store System** | Points-based store where students redeem rewards |
| **Announcements** | Targeted communications across organizational levels |
| **Bilingual Support** | Full English/Arabic with RTL layout support |

---

## Target Users

### Primary Users

| Role | Description | Key Needs |
|------|-------------|-----------|
| **Super Admin** | System-wide administrators | Full platform management, reporting |
| **Diocese Admin** | Diocese-level managers | Oversight of churches, user management |
| **Church Admin** | Church-level administrators | Class management, store operations |
| **Teacher** | Sunday school instructors | Attendance, activity approvals, grading |
| **Parent** | Student guardians | View child progress, trip approvals |
| **Student** | Sunday school attendees | Participate in activities, earn points, shop |

### User Distribution (Estimated)

- 5-10 Dioceses
- 50-200 Churches
- 500-2,000 Classes
- 10,000-50,000 Students

---

## Key Features

### 1. User & Organization Management
- Hierarchical structure: Diocese > Church > Class
- Role-based access control with 6 user roles
- Family relationships (parent-child linking)
- 6-digit user codes for easy student login

### 2. Attendance System
- Class-based attendance tracking
- Multiple statuses: Present, Absent, Excused, Late
- Automatic points awarding based on church configuration
- Historical attendance reports

### 3. Activities & Points System

**Core Activities:**
- General activities with participation/completion workflows
- Time-sensitive activities with full/reduced points windows
- Multi-level scoping (diocese/church/class)

**Enhanced Activities (New):**
- **Spiritual Notes**: Track daily spiritual practices (prayer, mass, fasting, etc.)
- **Competitions**: Contests with text, PDF, or Google Form submissions
- **Daily Readings**: Bible reading schedules with verse tracking

**Points Economy:**
- Earn points from attendance, activities, trips
- Suspend points for pending store orders
- Spend points in the store
- Teacher/admin adjustments with audit trail

### 4. Trips Management
- Multi-destination trip planning
- Tiered pricing (Normal, Mastor, BOTL)
- Participant registration with approval workflow
- Parent approval for student trips
- Payment tracking

### 5. Store System
- Points-based redemption store
- Church-specific inventory
- Tiered pricing based on student status
- Order workflow: Pending > Approved > Fulfilled
- Admin order creation on behalf of students

### 6. Announcements
- Targeted by role, diocese, church, or class
- Multiple announcement types (tags)
- Scheduled publishing with expiration
- Read tracking per user

---

## Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | Next.js 16, React 19, TypeScript | Modern web framework |
| **Styling** | Tailwind CSS 4, Radix UI | Responsive, accessible UI |
| **Forms** | React Hook Form, Zod | Form management & validation |
| **i18n** | next-intl | Bilingual support |
| **Backend** | Supabase (PostgreSQL, Auth, Storage) | Backend-as-a-Service |
| **Security** | Row Level Security (RLS) | Database-level authorization |
| **Deployment** | Vercel (planned) | Serverless hosting |

---

## Current Project Status

### Completed Features
- User authentication (email/password, user code)
- Full admin panel with all CRUD operations
- Attendance management
- Core activities system
- Points system with transactions
- Trips management
- Store with orders
- Announcements system
- Bilingual support (EN/AR)

### In Progress
- Enhanced Activities (Spiritual Notes, Competitions, Readings)
- Admin interfaces for new activity types

### Database Status
- **35 migrations** completed
- All core tables with RLS policies
- Points transaction system

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| **User Adoption** | 70% of churches active within 6 months | Weekly active users |
| **Attendance Digitization** | 90% of classes using digital attendance | Classes with attendance records |
| **Student Engagement** | 50% students earning points monthly | Points transactions |
| **Admin Efficiency** | 50% reduction in manual work | Admin feedback surveys |
| **System Reliability** | 99.5% uptime | Monitoring |

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| **User Adoption** | Low usage if complex | Intuitive UI, training materials, user codes for easy login |
| **Data Migration** | Loss of existing records | Import tools, gradual rollout |
| **Language Quality** | Poor Arabic translations | Native speaker review, community feedback |
| **Scalability** | Performance with growth | Efficient RLS policies, pagination, caching |
| **Data Privacy** | Student data exposure | RLS at database level, role-based access |

---

## Stakeholders

| Stakeholder | Interest | Engagement Level |
|-------------|----------|------------------|
| Diocese Leadership | Strategic oversight | Informed |
| Church Administrators | Daily operations | Consulted |
| Teachers | Activity management | Active User |
| Parents | Child monitoring | Active User |
| Students | Points & activities | End User |
| Development Team | Technical delivery | Responsible |

---

## Project Constraints

1. **Technical**: Must work on mobile web (no native app initially)
2. **Language**: Full bilingual support required (EN/AR)
3. **Accessibility**: Must support RTL layouts properly
4. **Security**: Student data privacy is critical
5. **Cost**: Supabase free tier initially, scalable pricing

---

## Next Steps

1. Complete Enhanced Activities implementation
2. User acceptance testing with pilot churches
3. Documentation and training materials
4. Production deployment
5. Phased rollout starting with 2-3 churches

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Jan 2026 | Mary (Analyst) | Initial project brief |

---

*Document generated by Mary, Business Analyst Agent*
