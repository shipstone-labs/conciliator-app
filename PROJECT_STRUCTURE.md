# SafeIdea.net / Conciliator App - Project Structure

This document outlines the structure of the SafeIdea/Conciliator application, including existing and planned components. It serves as a living document to track the evolution of the application architecture.

## Feature Status Legend

- **No Tag**: Feature is implemented and available
- **(IN PROGRESS)**: Feature is currently being developed
- **(TBD)**: Feature is planned but development has not started

## Pages and Their Functions

### 1. Home Page (`/`)
- Landing page with app introduction
- Authentication state detection
- Navigation to main functions (Add/Explore ideas)
- Component: `home-app.tsx`

### 2. Add Idea Page (`/add-ip`)
- 3-step process for adding intellectual property
- Document encryption and storage
- Terms setting for idea sharing
- Creates a new Idea page with a unique tokenId
- Component: `AddIP.tsx`

### 3. Idea Discovery Page (`/idea-discovery`) **(TBD)**
- Advanced search and exploration of ideas
- Filtering and pagination capabilities
- Recommendation engine for related ideas
- Accessible from Individual Idea Pages
- Would replace or enhance current `/list-ip` functionality
- Implementation needs: Search algorithms, filtering system, recommendation engine

### 4. Idea Analytics Page (`/[tokenId]/analytics`) **(TBD)**
- Displays view counts for the idea
- Shows interaction metrics with Idea Discovery
- Lists purchase/access statistics
- Graphs and visualizations of engagement data
- Accessible from Individual Idea Pages
- Implementation needs: Analytics tracking system, visualization components, metrics storage

### 5. Account Page (`/account`) **(TBD)**
- User profile information (name, email, phone)
- Editable profile fields (name is optional)
- "Your Ideas" button to view owned/accessed ideas
- Account settings and preferences
- Implementation needs: Profile form components, data storage for profile info, settings management

### 6. My Ideas Page (`/my-ideas`) **(TBD)**
- Filtered view of ideas owned by the user
- Also shows ideas the user has transacted with for access
- Same layout/functionality as idea discovery but with personal filter
- Implementation needs: User-to-idea relationship tracking, access permission tracking

### 7. Individual Idea Page (`/[tokenId]`)
- Displays a specific idea with details
- Q&A interface via the Conciliator
- Document access controls based on permissions
- Navigation buttons to Idea Discovery and Idea Analytics **(TBD)**
- Component: Dynamic page via `/app/[tokenId]/page.tsx`

### 8. Dashboard (`/dashboard`)
- Authenticated home page
- Functionally similar to home page

### 9. Demo Pages
- `/demo` - Generic demo page
- `/lilypad-demo` - Lilypad-specific functionality demo

## API Routes

### 1. Store API (`/api/store`)
- Stores new ideas with encryption
- Creates blockchain tokens for verification
- Called from: Add Idea page
- Implementation: `/app/api/store/route.ts`

### 2. List API (`/api/list`)
- Retrieves paginated lists of ideas
- Called from: List-IP page (future Idea Discovery)
- Implementation: `/app/api/list/route.ts`

### 3. Conciliator API (`/api/concilator`)
- Handles Q&A about specific idea documents
- Called from: Individual Idea pages
- Implementation: `/app/api/concilator/route.ts`

### 4. Analytics API (`/api/analytics/[tokenId]`) **(TBD)**
- Retrieves engagement metrics for specific ideas
- Tracks views, interactions, and purchases
- Called from: Idea Analytics page
- Implementation needs: Metrics collection system, database schema for analytics

### 5. Chat API (`/api/chat`)
- General chat functionality
- Called from: Various pages with chat components
- Implementation: `/app/api/chat/route.ts`

### 6. User Profile API (`/api/profile`) **(TBD)**
- Store and retrieve user profile information
- Update user details (name, contact info)
- Called from: Account page
- Implementation needs: Database schema for profile data, validation logic

### 7. My Ideas API (`/api/my-ideas`) **(TBD)**
- Retrieve ideas owned by the user
- Retrieve ideas the user has accessed via transactions
- Called from: My Ideas page
- Implementation needs: Query logic to filter by ownership/access

### 8. Supporting APIs
- `/api/seeker` - Search functionality
- `/api/snapshot` - Conversational state preservation
- `/api/download/[...cid]` - IPFS content retrieval

## Navigation Flow

```
┌───────────────┐                 ┌───────────────┐
│               │                 │               │
│   Home Page   │◄────────────────┤    Header     │◄─────────┐
│      (/)      │                 │   (Global)    │          │
│               │                 │               │          │
└───────┬───────┘                 └───────────────┘          │
        │                                  ▲                 │
        │                                  │                 │
        ▼                                  │                 │
┌───────────────┐     Auth       ┌─────────┴───────┐   ┌────┴────────┐
│               │◄──Required─────┤                 │   │             │
│     Idea      │                │  Authentication │   │ Individual  │
│   Discovery   │────────────────►                │◄──┤  Idea Page  │
│     (TBD)     │                │                │   │ /[tokenId]  │
└───────────────┘                └────────┬───────┘   │             │
                                          │          └──────┬──────┘
                                          │                 │
                                          ▼                 ▼
┌───────────────┐                 ┌───────────────┐  ┌─────────────────┐
│               │                 │               │  │                 │
│   Add Idea    │                 │   Store API   │  │ Idea Analytics  │
│   /add-ip     │─────────────────►               │  │     (TBD)       │
│               │   Create Idea   │               │  │ /[tokenId]/     │
└───────────────┘                 └───────────────┘  │  analytics      │
                                                     └─────────────────┘

  ┌─────────────────┐          ┌─────────────────┐
  │                 │          │                 │
  │  Account Page   │          │   My Ideas      │
  │   /account      │──────────►   /my-ideas     │
  │     (TBD)       │  Your    │     (TBD)       │
  │                 │  Ideas   │                 │
  └─────────────────┘          └─────────────────┘
          ▲                            │
          │                            │
          │                            ▼
          │                    ┌───────────────┐
          │                    │               │
          └────────────────────┤  Header Menu  │
             Account link      │    (TBD)      │
                              │               │
                              └───────────────┘
```

## Authentication Structure

### 1. Authentication Provider
- Stytch-based authentication wrapped in AuthLayout
- Global state for login status via context
- Implementation: `authLayout.tsx`

### 2. Authentication Components
- AuthButton - Sign in/Register for unauthenticated users
- LogoffButton - Logout for authenticated users
- AuthModal - Login/registration modal
- Implementation: Component files in `/components/`

### 3. Protected Routes
- `/add-ip` - Requires auth to add ideas
- `/idea-discovery` - Auth required to browse ideas **(TBD)**
- `/[tokenId]/analytics` - Auth required for metrics **(TBD)**
- `/account` - Auth required to view/edit profile **(TBD)**
- `/my-ideas` - Auth required to see owned/accessed ideas **(TBD)**
- Individual Idea pages - Auth required for interaction

## Key Application Flows

### 1. Idea Creation Flow
- Home → Auth → Add Idea → Enter public info → Upload document
- → Set terms → Store via API → Redirect to new Idea page
- Key components: AddIP.tsx, Modal components, Store API

### 2. Idea Exploration Flow
- Home → Auth → Idea Discovery → Browse ideas → View specific Idea
- Current implementation uses List-IP page
- Future enhancement with improved discovery features **(TBD)**

### 3. Idea Interaction Flow
- Individual Idea page → Ask questions → Conciliator answers
- → Optional: Save conversation snapshot
- Key components: Chat.tsx, Conciliator API, Snapshot API

### 4. Analytics Flow **(TBD)**
- Individual Idea page → Idea Analytics button → 
- → View engagement metrics for the idea
- Implementation needs: Analytics API, metrics visualization components

### 5. Discovery Flow **(TBD)**
- Individual Idea page → Idea Discovery button → 
- → Browse related ideas → View another Idea
- Implementation needs: Discovery page, recommendation algorithms

### 6. Account Management Flow **(TBD)**
- Header Menu → Account → View/Edit profile info
- → "Your Ideas" → View owned/accessed ideas
- Implementation needs: Account page, profile form components

### 7. Personal Ideas Flow **(TBD)**
- Header Menu → Account → "Your Ideas" button → 
- → My Ideas page → View owned and accessed ideas
- → Select specific idea → View individual Idea page
- Implementation needs: My Ideas API, filtering by ownership/access

## Technical Integration

- **Storage**: IPFS/Filecoin ecosystem for decentralized storage
- **Encryption**: LIT Protocol for document security
- **Blockchain**: Token generation for ownership verification
- **AI Integration**: Lilypad for enhanced functionality
- **Authentication**: Stytch for user management
- **User Profiles**: Storage of optional user information **(TBD)**
- **Ownership Tracking**: Association between users and their ideas **(TBD)**
- **Transaction Records**: Tracking of idea access permissions **(TBD)**
- **Analytics Engine**: Monitoring engagement metrics for ideas **(TBD)**

## Implementation Priorities

1. Individual Idea Page enhancements - Add navigation buttons to planned features
2. Account Page - User profile management
3. My Ideas Page - Personal idea collection
4. Idea Analytics - Engagement metrics
5. Idea Discovery - Advanced browsing and recommendations

## Component Relationships

- **Layout Components**: Layout.tsx, AuthLayout.tsx (global wrappers)
- **Authentication Components**: AuthButton.tsx, AuthModal.tsx, LogoffButton.tsx
- **Idea Management**: AddIP.tsx, List-IP page (future Idea Discovery)
- **Interaction Components**: Chat.tsx, QuestionIP.tsx
- **UI Components**: Various in `/components/ui/`

This document will be updated as features move from planned (TBD) to in progress to completed status.