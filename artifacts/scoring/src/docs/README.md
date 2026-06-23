# VScor - System Design Documentation

## Overview

This directory contains comprehensive system design artifacts for the VScor football scoring and tournament management application.

**Last Updated**: March 8, 2026  
**Version**: 2.0 (Current Implementation State)

---

## Document Index

### 1. [Feature Map](./1-Feature-Map.md)
**Purpose**: Hierarchical overview of all VScor features and modules

**Contents**:
- Complete feature hierarchy (12 major modules)
- Sub-features and relationships
- Feature ownership matrix
- Scoring level comparison
- Priority tiers (MVP to Future)

**Use Cases**:
- Product planning and roadmap
- Feature prioritization
- Understanding feature dependencies
- Onboarding new team members

---

### 2. [Screen Flow Diagrams](./2-Screen-Flow-Diagrams.md)
**Purpose**: Visual navigation flows for the mobile application

**Contents**:
- 9 major user flows with ASCII diagrams
- Login and onboarding flow
- Home dashboard navigation
- Info tab browsing
- Player, team, tournament profile flows
- Match creation and scoring flows
- Match payments workflow

**Use Cases**:
- UI/UX design reference
- User journey mapping
- Navigation implementation
- Testing scenario creation

---

### 3. [Database Schema](./3-Database-Schema.md)
**Purpose**: Complete data architecture specification

**Contents**:
- 6 core tables (Users, Players, Teams, Tournaments, Matches, Events)
- Field definitions with types and constraints
- Relationship diagrams (ERD)
- Indexes and performance optimization
- Sample data and validation rules

**Use Cases**:
- Backend development
- Database migrations
- Data modeling
- Query optimization

---

### 4. [Component Architecture](./4-Component-Architecture.md)
**Purpose**: UI component structure and design system

**Contents**:
- 60+ React components organized into 9 categories
- Component hierarchy and props definitions
- Reusable UI components (buttons, inputs, modals, etc.)
- Feature-specific components (match, tournament, profile)
- State management patterns
- Performance optimization strategies

**Use Cases**:
- Frontend development
- Component reusability planning
- Design system implementation
- Code structure reference

---

### 5. [State Management Map](./5-State-Management-Map.md)
**Purpose**: Application state structure and update workflows

**Contents**:
- 7 global state groups
- Component-level state patterns
- 4 detailed state update workflows
- Sync state management
- State persistence strategies
- Optimization techniques (memoization, debouncing)

**Use Cases**:
- State architecture planning
- Data flow understanding
- Performance optimization
- Debugging state issues

---

### 6. [API Structure](./6-API-Structure.md)
**Purpose**: REST API specification for cloud synchronization

**Contents**:
- 30+ endpoints across 6 resource types
- Authentication flows
- Request/response schemas
- Error handling patterns
- Rate limiting rules
- Usage examples

**Use Cases**:
- Backend API development
- API integration
- Error handling implementation
- API documentation

---

### 7. [Event Taxonomy](./7-Event-Taxonomy.md)
**Purpose**: Complete football event classification system

**Contents**:
- 8 event types across 5 categories
- Event schemas for each scoring level
- Recording rules and validation
- Statistics mapping
- Future event roadmap

**Use Cases**:
- Match scoring implementation
- Event validation logic
- Statistics calculation
- Feature expansion planning

---

### 8. [System Architecture](./8-System-Architecture.md)
**Purpose**: Complete system architecture diagrams and data flows

**Contents**:
- High-level architecture overview
- Layer-by-layer breakdown (Client, State, Sync, Backend, Database)
- Data flow diagrams (create match, record event, view scores)
- Authentication flow
- Match event recording flow
- Synchronization architecture
- Deployment architecture

**Use Cases**:
- Understanding system design
- Backend/frontend integration
- Sync mechanism implementation
- Deployment planning
- Performance optimization

---

### 9. [Football Match Events Data Model](./9-Football-Match-Events-Data-Model.md)
**Purpose**: Comprehensive data model for match events and analytics

**Contents**:
- Core event structure with 50+ fields
- Event taxonomy (30+ event types across 9 categories)
- Event metadata for ML/analytics
- Pre-calculated metrics and statistics
- Player and team performance indices
- ML feature vectors
- Event sequences for pattern recognition
- Database schema and indexes
- Analytics query examples

**Use Cases**:
- Advanced analytics implementation
- Machine learning model development
- Performance tracking
- Pattern recognition
- Player scouting and comparison
- xG (expected goals) calculations
- Fantasy football scoring

---

## Quick Reference

### Core Technologies
- **Frontend**: React 18, Tailwind CSS v4
- **Backend**: Supabase (PostgreSQL, Edge Functions with Hono)
- **Authentication**: Supabase Auth (Email/Password)
- **Storage**: localStorage (primary), Supabase KV Store (cloud sync)
- **Icons**: lucide-react
- **Charts**: Recharts

### Architecture Principles
1. **Offline-First**: localStorage as source of truth
2. **Cloud Sync**: Asynchronous background synchronization
3. **Mobile-First**: Optimized for smartphones
4. **Component-Based**: Reusable React components
5. **Type-Safe**: TypeScript schemas throughout

### Key Features
- ✅ Three-tier scoring levels (Basic, Intermediate, Advanced)
- ✅ Dual-scorer support (Advanced mode only)
- ✅ Automatic tournament standings calculation
- ✅ Match payment tracking with auto-save
- ✅ Offline-capable with cloud sync
- ✅ Role-based permissions (Owner, Coordinator, Scorer)
- ✅ Real-time match scoring with sub-2-second event recording

---

## Development Workflow

### 1. Understanding the Product
Start with:
1. [Feature Map](./1-Feature-Map.md) - Understand what VScor does
2. [Screen Flow Diagrams](./2-Screen-Flow-Diagrams.md) - See how users navigate
3. Product Requirements Document (in `/imports/`)

### 2. Planning Backend Development
Reference:
1. [Database Schema](./3-Database-Schema.md) - Data structure
2. [API Structure](./6-API-Structure.md) - Endpoints and contracts
3. [Event Taxonomy](./7-Event-Taxonomy.md) - Event data models

### 3. Planning Frontend Development
Reference:
1. [Component Architecture](./4-Component-Architecture.md) - Component structure
2. [State Management Map](./5-State-Management-Map.md) - State patterns
3. [Screen Flow Diagrams](./2-Screen-Flow-Diagrams.md) - Navigation

### 4. Implementing Features
Workflow:
1. Check [Feature Map](./1-Feature-Map.md) for feature scope
2. Review [Database Schema](./3-Database-Schema.md) for data needs
3. Design components using [Component Architecture](./4-Component-Architecture.md)
4. Plan state with [State Management Map](./5-State-Management-Map.md)
5. Implement API calls per [API Structure](./6-API-Structure.md)

---

## Document Maintenance

### Update Frequency
- **Feature Map**: After each major feature addition
- **Screen Flow Diagrams**: When navigation changes
- **Database Schema**: When data model changes
- **Component Architecture**: When new components added
- **State Management Map**: When state structure changes
- **API Structure**: When endpoints added/modified
- **Event Taxonomy**: When new event types added

### Version Control
Each document includes:
- Last updated date
- Version number
- Change log (for major updates)

---

## Related Documents

### In `/imports/` Directory:
- `vscor-product-requirements-doc.md` - Original PRD template
- `vscor-complete-prd.md` - Complete PRD (30,000+ words)
- `vscor-system-design.md` - This documentation request
- `match-scoring-enhancements.md` - Recent feature specifications

### In Root:
- `VScor-Product-Requirements-Document.md` - Comprehensive PRD (alternative format)

---

## For AI Builders (Lovable, Cursor, etc.)

These documents are structured for AI consumption:
- **Clear hierarchies**: Easy to parse and understand
- **Consistent formatting**: Predictable structure across docs
- **Complete schemas**: All data types and validations defined
- **Workflow diagrams**: Step-by-step process flows
- **Code examples**: Practical implementation snippets

### Recommended Reading Order for AI:
1. Feature Map (understand scope)
2. Database Schema (understand data)
3. Component Architecture (understand UI)
4. API Structure (understand integration)
5. State Management Map (understand data flow)
6. Screen Flow Diagrams (understand navigation)
7. Event Taxonomy (understand domain specifics)

---

## Contributing

When updating these documents:
1. Update the "Last Updated" date
2. Increment version number if major changes
3. Keep formatting consistent
4. Add examples where helpful
5. Cross-reference related sections
6. Validate schemas and diagrams

---

## Contact & Support

For questions about these documents or VScor architecture:
- Review the comprehensive PRD first
- Check related documents in `/imports/`
- Ensure you understand the offline-first architecture

---

**Status**: ✅ All 7 documents completed and current as of March 8, 2026

**Coverage**: 
- Feature Map: 12 modules, 100+ features ✅
- Screen Flows: 9 major flows ✅
- Database Schema: 6 tables, complete ERD ✅
- Component Architecture: 60+ components ✅
- State Management: 7 state groups, 4 workflows ✅
- API Structure: 30+ endpoints ✅
- Event Taxonomy: 8 event types, 3 scoring levels ✅
- System Architecture: Complete diagrams and flows ✅
- Match Events Data Model: 30+ event types, ML-ready ✅

**Total Documents**: 9 comprehensive system design artifacts

---

*End of System Design Documentation Index*