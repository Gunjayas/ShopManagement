# Thread & Stock — Project Learning Guide

This guide explains the project from the first browser request to the final database write. It is written for someone who wants to learn the application rather than only run it.

The project is an inventory and sales management app for a small clothing shop. The owner records imported orders, divides each order into bundles, records what arrives or is lost, creates individual inventory items, and sets selling prices for those items.

---

## 1. Start with the project map

```text
ShopManagement/
├── client/                 React + TypeScript + Vite frontend
│   └── src/
│       ├── App.tsx         React Router entry point
│       ├── main.tsx        Browser mount point
│       ├── pages/          Full-screen route components
│       ├── components/     Reusable UI and feature components
│       └── lib/api.ts      Frontend-to-backend API calls
├── server/                 Fastify + TypeScript backend
│   ├── index.ts            Server composition and startup
│   ├── src/
│   │   ├── routes/         HTTP endpoints and thin handlers
│   │   ├── services/       Business rules and database operations
│   │   └── lib/            Prisma, validation, and shared errors
│   ├── prisma/
│   │   └── schema.prisma   Database model source of truth
│   └── generated/prisma/   Generated Prisma client (do not edit)
├── shared/types.ts         TypeScript shapes used by client and server
├── package.json             Workspace commands
└── .clinerules              Project rules and immutable business logic
```

### The most important direction of travel

```text
User action
  → React page
  → feature component/form
  → client/src/lib/api.ts
  → Fastify route in server/src/routes/
  → service in server/src/services/
  → Prisma client
  → SQLite database
  → JSON response
  → React state refresh
```

When learning a feature, read files in that direction first. When debugging a feature, follow the same path from the UI request to the database operation.

---

## 2. Read the rules before reading code

Open `.clinerules` first. It contains the business rules that are more important than implementation convenience.

The key concepts are:

### Order versus bundle versus inventory item

- **Order** is the complete purchase or shipment from a supplier or country.
- **Bundle** is one purchasing unit inside an order. A bundle contains many identical clothing items.
- **InventoryItem** is one physical item that can be sold individually.

The relationship is:

```text
One Order
  └── many Bundles
        └── many InventoryItems
```

### Cost price is fixed when an item is generated

When a bundle arrives:

```text
InventoryItem.costPrice = Bundle.costPerItem
```

This is a direct copy. It is not a division, average, or transportation-fee calculation. Once copied, the inventory item cost cannot be edited.

### Transportation fee stays on the order

`Order.transportationFee` is a separate business expense. It never flows into `InventoryItem.costPrice`.

### Bundle total cost is display-only

The UI may display:

```text
itemsOrdered × costPerItem
```

but that total is never stored as a database column.

### Arrival and loss are atomic

Arrival writes three related outcomes together:

1. Update bundle status, received count, and arrival date.
2. Create exactly the received number of inventory rows.
3. Create one partial loss row if the received count is short.

The bundle arrival service uses one Prisma `$transaction` so those writes all succeed or all roll back.

The lost action also uses one transaction:

1. Mark the bundle as lost and set received count to zero.
2. Create one full-bundle loss row.

No inventory is created for a lost bundle.

---

## 3. Learn the application startup path

### Browser startup: `client/src/main.tsx`

`main.tsx` is the browser mount point. It:

1. Imports global CSS.
2. Finds the HTML element with `id="root"`.
3. Mounts the React `App` component.
4. Wraps the app in `StrictMode` during development.

You normally do not add page logic here.

### Routing: `client/src/App.tsx`

`App.tsx` creates the React Router tree:

| URL | Page | Purpose |
|---|---|---|
| `/orders` | `OrdersPage` | List orders and create a new order |
| `/orders/:id` | `OrderDetailPage` | View/edit one order and manage its bundles |
| `/inventory` | `InventoryPage` | Filter inventory and edit item pricing |
| anything else | Redirect | Sends the user back to `/orders` |

`AppShell` wraps every route with the header and main navigation.

### Backend startup: `server/index.ts`

The backend startup file is responsible for composition, not feature-specific business logic. It:

1. Loads environment variables.
2. Creates the Fastify application.
3. Registers order, bundle, and inventory routes.
4. Registers static-file serving for the production frontend.
5. Falls back to `index.html` for client-side routes.
6. Converts known `AppError` instances into JSON error responses.
7. Starts Fastify on `0.0.0.0:3000`.

The production build emits the server entry point at `server/dist/server/index.js`, which is why the server start script uses that path.

---

## 4. Understand the backend layers

The backend deliberately has three layers.

### Layer A: routes — `server/src/routes/`

Routes define HTTP paths and status codes. Their handlers should stay thin:

```text
request body and URL params
  → call one service function
  → send the service result
```

For example, `server/src/routes/orders.ts` maps:

```text
POST   /api/orders
GET    /api/orders
GET    /api/orders/:id
PATCH  /api/orders/:id
PATCH  /api/orders/:id/status
```

The route handler should not calculate loss values, validate lifecycle state, or perform several database writes itself. That belongs in a service.

### Layer B: services — `server/src/services/`

Services contain business intent and Prisma calls:

- `order-service.ts` handles order creation, listing, editing, and closing.
- `bundle-service.ts` handles bundle creation, listing, pending-only edits, arrival, and loss.
- `inventory-service.ts` handles inventory filtering and pricing changes.

When learning a feature, this is usually the most important backend file to study.

### Layer C: infrastructure helpers — `server/src/lib/`

- `prisma.ts` creates the shared Prisma client using the better-sqlite3 adapter.
- `app-error.ts` defines safe errors with status code, category, message, and optional business code.
- `validation.ts` contains readable request validation helpers for text, dates, numbers, and whole-number counts.

The central error handler in `server/index.ts` ensures errors include a plain-English `message` field.

---

## 5. Understand the data model

The authoritative model is `server/prisma/schema.prisma`. Do not edit it casually. `shared/types.ts` mirrors the data that travels over the API.

### Order

Important fields:

- `id`: database identifier.
- `supplierOrCountry`: supplier or origin country.
- `orderDate`: date used for purchasing records and future reports.
- `transportationFee`: separate order-level expense.
- `expectedBundleCount`: owner’s expected number of bundles.
- `status`: `ongoing` or `closed`.

### Bundle

Important fields:

- `orderId`: parent order.
- `type` and `designName`: business labels shown to the owner.
- `itemsOrdered`: fixed at creation and never editable.
- `costPerItem`: source value copied into generated inventory items.
- `status`: pending, arrived, lost, refunded, or replaced.
- `itemsReceived` and `arrivalDate`: null until arrival.

### InventoryItem

Important fields:

- `bundleId`: source bundle.
- `variant`: optional size, color, or other label.
- `costPrice`: immutable acquisition cost copied from the bundle.
- `markedPrice`, `listedPrice`, `targetPrice`, `floorPrice`, `maxDiscountPercent`: pricing controls.
- `status`: in stock, sold, damaged, or returned.

The schema currently requires numeric values for all five pricing controls. Newly generated inventory therefore starts with neutral `0` values until the owner sets prices. That does not affect `costPrice`.

### LossEntry

Loss rows are history. Core fields such as `lossType`, `itemsLost`, `lossValue`, and `lossDate` are not edited later. Recovery fields are reserved for a future recovery workflow.

---

## 6. Follow the Orders feature from screen to database

### Starting point: `client/src/pages/OrdersPage.tsx`

This page:

1. Calls `fetchOrders()` when it opens.
2. Displays orders newest first because the server orders by `orderDate desc`.
3. Shows an order status badge.
4. Opens `OrderForm` when the owner chooses **New order**.
5. Links each order to `/orders/:id`.

### Form: `client/src/components/OrderForm.tsx`

The form collects:

- supplier or country
- order date
- transportation fee
- expected bundle count

For a new order it calls `postOrder`. For an existing order it calls `patchOrder`.

The form never includes a status field in normal order editing.

### API client: `client/src/lib/api.ts`

`postOrder` sends:

```json
{
  "supplier_or_country": "China",
  "order_date": "2026-06-10T00:00:00.000Z",
  "transportation_fee": 150,
  "expected_bundle_count": 2
}
```

### Backend: `server/src/routes/orders.ts` → `order-service.ts`

The service validates the body, maps API field names to Prisma field names, and creates the record. Prisma supplies the default `ongoing` status.

The normal edit endpoint updates only the four editable order fields. The dedicated status endpoint sets the order to `closed` without checking bundle states. That lack of validation is intentional.

---

## 7. Follow the Order Detail and Bundles feature

### Starting point: `client/src/pages/OrderDetailPage.tsx`

When `/orders/:id` opens, the page loads two resources together:

```text
fetchOrder(id)
fetchBundles(id)
```

The page displays:

- order date and supplier/country
- transportation fee
- expected bundle count
- status badge
- edit order action
- close order action
- embedded bundle section

Bundles do not have a separate standalone page. They belong inside the order detail workspace.

### Adding and editing: `client/src/components/BundleForm.tsx`

For a new bundle, the form collects:

- type
- design name
- items ordered
- cost per item

For an existing bundle, the form deliberately omits `items_ordered`. It only sends type, design name, and cost per item.

### Display and actions: `client/src/components/BundleCard.tsx`

Each card displays:

- type and design
- ordered count
- cost per item
- display-only bundle total
- status badge

Pending bundles show:

- Edit
- Mark arrived
- Mark lost

Arrived and lost bundles show no edit or lifecycle actions because their relevant history is already fixed.

### Arrival form: `client/src/components/ArrivalForm.tsx`

The arrival form collects:

- items received
- arrival date
- optional variant

The native date input has no minimum date, so past arrival dates are allowed. This is important for future dead-stock and aging reports.

### Arrival backend flow: `bundle-service.ts`

`arriveBundle` performs this sequence inside one Prisma transaction:

```text
find bundle inside transaction
→ confirm it is pending
→ reject received count above ordered count
→ update bundle to arrived
→ create exactly itemsReceived inventory rows
→ copy costPerItem directly into every costPrice
→ create one partial LossEntry when short
→ return updated bundle
```

If all five items were ordered and all five arrived, no loss row is created.

### Lost backend flow

`loseBundle` performs this sequence inside one transaction:

```text
find bundle inside transaction
→ confirm it is pending
→ update status to lost and received count to zero
→ create one full_bundle LossEntry
→ create no InventoryItem rows
```

---

## 8. Follow the Inventory Pricing feature

### Starting point: `client/src/pages/InventoryPage.tsx`

The inventory page:

1. Keeps the selected status filter in React state.
2. Calls `fetchInventory(status)` when the filter changes.
3. Renders one `InventoryCard` per physical item.
4. Keeps the layout stacked and responsive instead of using a wide table.

### Item display: `client/src/components/InventoryCard.tsx`

The card shows:

- item ID
- bundle type and design
- variant
- item status
- fixed cost price
- marked, listed, target, and floor prices
- maximum discount percentage

The UI labels cost price as fixed and does not provide an input for it.

### Pricing form: `client/src/components/PricingForm.tsx`

The form sends exactly these five fields:

```json
{
  "marked_price": 40,
  "listed_price": 38,
  "target_price": 35,
  "floor_price": 30,
  "max_discount_percent": 10
}
```

Even if a malicious client sends `cost_price`, the service ignores it.

### Backend flow

```text
GET /api/inventory?status=in_stock
  → inventory route
  → listInventory service
  → optional status validation
  → Prisma inventoryItem.findMany(include: bundle)
```

```text
PATCH /api/inventory/:id/pricing
  → inventory route
  → updateInventoryPricing service
  → find item
  → validate five price fields
  → update only those five fields
```

The bundle relation is included in list results so the inventory page can show the source bundle’s type and design without making another request per item.

---

## 9. API endpoint reference

All endpoints begin with `/api`.

### Orders

| Method | Endpoint | Purpose | Success |
|---|---|---|---|
| POST | `/orders` | Create ongoing order | 201 |
| GET | `/orders` | List newest orders first | 200 |
| GET | `/orders/:id` | Get one order | 200 |
| PATCH | `/orders/:id` | Edit order fields, never status | 200 |
| PATCH | `/orders/:id/status` | Set status to closed | 200 |

### Bundles

| Method | Endpoint | Purpose | Success |
|---|---|---|---|
| POST | `/orders/:orderId/bundles` | Create pending bundle | 201 |
| GET | `/orders/:orderId/bundles` | List an order’s bundles | 200 |
| PATCH | `/bundles/:id` | Edit pending bundle fields | 200 |
| PATCH | `/bundles/:id/arrive` | Atomically receive bundle | 200 |
| PATCH | `/bundles/:id/lost` | Atomically record full loss | 200 |

### Inventory

| Method | Endpoint | Purpose | Success |
|---|---|---|---|
| GET | `/inventory` | List all inventory | 200 |
| GET | `/inventory?status=in_stock` | Filter inventory | 200 |
| PATCH | `/inventory/:id/pricing` | Update five pricing fields | 200 |

### Error shape

Errors include a machine-readable category and a human-readable message:

```json
{
  "error": "business_rule_violation",
  "code": "BUNDLE_NOT_PENDING",
  "message": "Only pending bundles can be edited."
}
```

Use the `message` field when displaying an error to the owner.

---

## 10. How to run the project

Install dependencies from the workspace root and both packages:

```powershell
npm install
npm install --prefix client
npm install --prefix server
```

The root `dev` command uses `concurrently` to start both processes. If PowerShell reports that `concurrently` is not recognized, run the root `npm install` first.

Start both applications:

```powershell
npm run dev
```

The usual development URLs are:

- frontend: `http://localhost:5173`
- backend: `http://localhost:3000`

Run the production build:

```powershell
npm run build
```

Run validation checks:

```powershell
npm run typecheck
npm run lint
```

The database connection uses `DATABASE_URL`. The Prisma configuration expects a SQLite URL, for example:

```text
DATABASE_URL="file:./shop.db"
```

Do not run `prisma migrate reset` unless you explicitly intend to destroy local data.

---

## 11. A practical debugging method

When a button does not work, use this checklist:

### Step 1: Find the button

Search the page or feature component, for example:

```text
Mark arrived
```

This will usually lead to `BundleCard.tsx`.

### Step 2: Find the API client function

Follow its import into `client/src/lib/api.ts`, such as `arriveBundle`.

Check:

- URL
- HTTP method
- JSON body
- response type

### Step 3: Find the route

Search for the URL in `server/src/routes/`. The route should call a service and set the status code.

### Step 4: Read the service

This is where you should find:

- validation
- database reads
- business-state checks
- transactions
- calculated values

### Step 5: Compare the database result

Use Prisma Studio or a safe read-only database inspection to confirm the operation wrote what you expect.

For arrival specifically, verify all three outcomes:

```text
bundle status and arrival fields
inventory item count and cost prices
partial loss row when necessary
```

---

## 12. Recommended learning path

Study the project in this order:

### Lesson 1 — TypeScript contracts

Read `shared/types.ts` and `server/prisma/schema.prisma`. Learn the entity names, enums, nullable fields, and relationships.

### Lesson 2 — React startup and navigation

Read `client/src/main.tsx`, `client/src/App.tsx`, and `client/src/components/AppShell.tsx`.

### Lesson 3 — A simple read flow

Trace `OrdersPage` → `fetchOrders` → `GET /api/orders` → `listOrders` → Prisma `findMany`.

### Lesson 4 — A simple write flow

Trace `OrderForm` → `postOrder` → `POST /api/orders` → `createOrder` → Prisma `create`.

### Lesson 5 — State and lifecycle rules

Trace bundle editing and closing an order. Notice that route handlers stay small while services enforce the business rules.

### Lesson 6 — Transactions

Read `arriveBundle` and `loseBundle` slowly. Identify every write inside `$transaction` and explain why those writes must not be separated.

### Lesson 7 — Relational UI data

Read `listInventory`, especially `include: { bundle: true }`, then see how `InventoryCard` uses both item and bundle data.

### Lesson 8 — Error handling

Read `AppError`, `validation.ts`, the central Fastify error handler, and `requestJson` in the frontend API client.

### Lesson 9 — Build and deployment shape

Study the Vite proxy in `client/vite.config.ts`, the Fastify static-file registration in `server/index.ts`, and the production output paths.

---

## 13. Safe extension points for future phases

When adding the next feature, follow these boundaries:

- Add shared API/entity types to `shared/types.ts` only when the contract truly changes.
- Add business logic to a service, not to a route handler.
- Use a Prisma transaction when multiple writes represent one business event.
- Keep immutable history fields out of update payloads.
- Add a focused page or component instead of growing a large existing file.
- Keep mobile layouts stacked at 390px before adding larger-screen enhancements.
- Add a frontend API wrapper instead of calling `fetch` directly from many components.
- Include a human-readable `message` in every new error response.

Before considering a feature finished, run:

```powershell
npm run build
npm run typecheck
npm run lint
```

Then manually test the feature at approximately 390px wide and verify its important database invariants.
