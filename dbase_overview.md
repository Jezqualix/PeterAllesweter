# Database Schema — `PeterAllesweterdb`

```
┌─────────────────────────────────────────────────────────────────────────┐
│  EngineTypes                     RentalLocations                        │
│  ─────────────────────           ─────────────────────                  │
│  id          INT PK              id          INT PK                     │
│  name        NVARCHAR            name        NVARCHAR                   │
│  fuelType    NVARCHAR            address     NVARCHAR                   │
│  co2Category NVARCHAR            ...                                    │
└──────────┬──────────────────────────────────────┬───────────────────────┘
           │                                      │
           │ FK engineTypeId                      │ FK locationId
           ▼                                      ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  Vehicles                                                                │
│  ─────────────────────────────────────────────────────────────────────  │
│  id                 INT PK                                               │
│  make               NVARCHAR                                             │
│  model              NVARCHAR                                             │
│  type               NVARCHAR                                             │
│  seats              INT                                                  │
│  licensePlate       NVARCHAR                                             │
│  year               INT                                                  │
│  engineTypeId       INT FK → EngineTypes.id                             │
│  engineCC           INT                                                  │
│  powerKW            INT                                                  │
│  transmissionType   NVARCHAR                                             │
│  mileage            INT                                                  │
│  availabilityStatus NVARCHAR  ('available' | 'unavailable')             │
│  locationId         INT FK → RentalLocations.id                         │
│  notes              NVARCHAR                                             │
└──────────┬──────────────────────────────────────────────────────────────┘
           │                               │
           │ FK vehicleId                  │ FK vehicleId
           ▼                               ▼
┌──────────────────────────┐   ┌──────────────────────────────────────────┐
│  VehiclePricing          │   │  Rentals                                 │
│  ────────────────────    │   │  ─────────────────────────────────────   │
│  id           INT PK     │   │  id              INT PK                  │
│  vehicleId    INT FK      │   │  vehicleId       INT FK → Vehicles.id   │
│  halfDayPrice DECIMAL    │   │  conversationId  INT FK → Conversations.id│
│  fullDayPrice DECIMAL    │   │  startDateTime   DATETIME                │
│  weekendPrice DECIMAL    │   │  endDateTime     DATETIME                │
│  weekPrice    DECIMAL    │   │  status          NVARCHAR                │
│  monthPrice   DECIMAL    │   │          ('confirmed'|'active'|          │
│  validFrom    DATE       │   │           'completed'|'cancelled')       │
│  validUntil   DATE NULL  │   └──────────────────────────────────────────┘
│               ↑          │
│   NULL = current price   │
└──────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│  Conversations                                                           │
│  id         INT PK                                                       │
│  sessionId  NVARCHAR                                                     │
│  createdAt  DATETIME                                                     │
└──────────┬───────────────────────────────────────────────────────────────┘
           │ FK conversationId (gebruikt door Rentals, Messages, VehicleQueries)
           ├──────────────────────────────────────────────────────┐
           ▼                                                      ▼
┌──────────────────────────┐              ┌───────────────────────────────┐
│  Messages                │              │  VehicleQueries               │
│  ────────────────────    │              │  ─────────────────────────    │
│  id              INT PK  │              │  id              INT PK       │
│  conversationId  INT FK  │              │  conversationId  INT FK       │
│  role            NVARCHAR│              │  queryType       NVARCHAR     │
│  content         NVARCHAR│              │  params          NVARCHAR     │
│  createdAt       DATETIME│              │  createdAt       DATETIME     │
└──────────────────────────┘              └───────────────────────────────┘
```

## Belangrijke regels

- `VehiclePricing.validUntil IS NULL` = huidige prijs (nooit in-place updaten, altijd oude rij sluiten + nieuwe aanmaken)
- Beschikbaarheid = `availabilityStatus = 'available'` **EN** geen overlappende `Rentals` met `status IN ('confirmed','active')`
- Bij verwijderen van een `Vehicle`: eerst `VehiclePricing` rijen verwijderen (FK constraint)

## Standaard JOIN patroon

```sql
LEFT JOIN VehiclePricing p ON v.id = p.vehicleId AND p.validUntil IS NULL
LEFT JOIN EngineTypes e ON v.engineTypeId = e.id
```

## Beschikbaarheidscheck

```sql
availabilityStatus = 'available'
AND NOT EXISTS (
  SELECT 1 FROM Rentals r
  WHERE r.vehicleId = v.id
    AND r.status IN ('confirmed', 'active')
    AND r.startDateTime < @end
    AND r.endDateTime > @start
)
```
