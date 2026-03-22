# PeterAllesweter — Claude Code Project Guide

## Project Overview
Car rental chatbot website for PeterAllesweter, built with **Next.js 14 (App Router)**, **TypeScript**, **Tailwind CSS**, and a **Microsoft SQL Server** backend (`PeterAllesweterdb`). Includes an AI chatbot powered by a local LLM via LM Studio.

## Tech Stack
- **Framework**: Next.js 14 (App Router, `src/` dir not used)
- **Styling**: Tailwind CSS with custom Dockx color scheme
- **Database**: MS SQL Server via `mssql` package
- **LLM**: Local LM Studio API (OpenAI-compatible endpoint)
- **UI Components**: shadcn/ui (custom-themed)

## Environment Variables (`.env`)
| Variable | Purpose |
|---|---|
| `DB_SERVER` | SQL Server hostname\instance |
| `DB_DATABASE` | `PeterAllesweterdb` |
| `DB_USER` / `DB_PASSWORD` | SQL auth credentials |
| `LLM_URL` | LM Studio API endpoint |
| `LLM_MODEL` | Loaded model name in LM Studio |
| `LLM_TIMEOUT` | Request timeout (ms) |
| `CONTACT_EMAIL` | Email shown in UI |

## Database Schema (`PeterAllesweterdb`)
8 tables — always JOIN for current data:

```sql
EngineTypes       -- id, name, fuelType, co2Category
RentalLocations   -- id, name, address, ...
Vehicles          -- id, make, model, type, seats, licensePlate, year,
                  --   engineTypeId (FK), engineCC, powerKW, transmissionType,
                  --   mileage, availabilityStatus, locationId (FK), notes
VehiclePricing    -- id, vehicleId (FK), halfDayPrice, fullDayPrice,
                  --   weekendPrice, weekPrice, monthPrice,
                  --   validFrom, validUntil  (NULL = current price)
Rentals           -- id, vehicleId, conversationId, startDateTime, endDateTime,
                  --   status ('confirmed'|'active'|'completed'|'cancelled')
Conversations     -- id, sessionId, createdAt
Messages          -- id, conversationId, role, content, createdAt
VehicleQueries    -- id, conversationId, queryType, params, createdAt
```

**Key JOIN pattern** (always use `validUntil IS NULL` for current pricing):
```sql
LEFT JOIN VehiclePricing p ON v.id = p.vehicleId AND p.validUntil IS NULL
LEFT JOIN EngineTypes e ON v.engineTypeId = e.id
```

**Availability check**: `availabilityStatus = 'available'` AND no overlapping Rentals with `status IN ('confirmed','active') AND startDateTime < @end AND endDateTime > @start`

## Color Scheme (Dockx-inspired)
| Token | Hex | Usage |
|---|---|---|
| `brand-600` | `#007c30` | Primary green, navbar, buttons |
| `brand-700` | `#026c3d` | Hover state |
| `brand-900` | `#003012` | Dark green, footer, hero gradient |
| `accent` | `#ffdd00` | Yellow CTA buttons |
| text | `#494949` / `#616161` | Body text |
| bg | `#f3f3f3` | Page background |
| border | `#d6d6d6` | Input/card borders |

## Key Files
```
app/
  page.tsx              # Home page — vehicle listing + hero
  login/page.tsx        # Admin login
  admin/page.tsx        # Admin dashboard (vehicles, conversations)
  api/
    chat/route.ts       # SSE streaming chat endpoint
    vehicles/route.ts   # CRUD for vehicles (+ VehiclePricing)
    engine-types/route.ts  # GET all engine types
lib/
  db.ts                 # All SQL queries (mssql)
  llm.ts                # LLM integration + system prompt builder
types/
  index.ts              # All TypeScript interfaces
components/
  Navbar.tsx
  VehicleCard.tsx
  ui/                   # shadcn/ui components (button, badge, input, ...)
tailwind.config.ts
app/globals.css
```

## Important Behaviours / Known Fixes
- **Chat history bug (fixed)**: In `app/api/chat/route.ts`, fetch conversation history BEFORE saving the new user message to DB. If reversed, the new message appears twice in the LLM context.
- **VehiclePricing updates**: When updating a vehicle's prices via PUT, close the old row (`validUntil = today`) and insert a new row — never update in place.
- **FK constraint on DELETE**: Delete `VehiclePricing` rows before deleting a `Vehicle`.

## Running the Project
```bash
npm install
npm run dev       # http://localhost:3000
npm run build
npm start
```
## MCP servers
- mcp_servers ["context7"]

## Rules
- For all prompts, auto-append 'use conect7'
