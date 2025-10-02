---
trigger: always_on
---

Project Type: MVP Windsurf App Rules Backend

Tech Stack:
- Framework: Hono.js (lightweight Node.js web framework)
- Database: MongoDB with soft-delete pattern
- Auth: JWT tokens with user ID/password authentication
- Structure: Routes → Controllers → Services → Models pattern

Core Architecture Pattern:
HTTP Request → Routes → Controllers → Services → Database
                     ↓
                Middleware (auth/validation)

Routes (/api/auth/*, /api/*):
- Auth routes: /login, /profile
- CRUD routes: Dynamic /windsurf/:collection_name endpoints for all entities

Controllers: Thin HTTP layer handling request/response, calling services for business logic

Services: Business logic layer - authentication, CRUD operations, rule constraint validation

Models: Data schemas with validation, indexes, and searchable fields for each collection

Key Business Logic:
Rule Constraints:
- Users can only submit one rule set per competition
- Enforced at service level before database insertion

Collections:
- users (user ID authentication, roles: competitor/admin)
- competitions (windsurfing events)
- rules (rule sets for competitions)
- submissions (rule submission records with constraints)

Features:
- Dynamic CRUD operations across all collections
- Search/pagination support
- Soft delete with deleted_at timestamps
- Global error handling and CORS setup

This is a well-structured MVP for a windsurf app rules system with RESTful patterns and essential rule submission constraints.