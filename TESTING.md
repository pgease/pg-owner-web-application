# PG Owner Web App – Testing Guide

This guide explains how to test the **Property Owner (PG Owner)** web application end-to-end with **dynamic data** from the backend.

---

## 1. Prerequisites

- **Backend**: Property owner API running (e.g. `https://pg-ease-nest.vercel.app` or your base URL).
- **Env**: In `.env` or `.env.local`, set:
  - `VITE_API_BASE_URL=https://pg-ease-nest.vercel.app` (or your API base).

```sh
npm i
npm run dev
```

Open the app (e.g. `http://localhost:8080`).

---

## 2. Complete flow: “Added as a PG owner”

### Step 1 – Login (Auth)

1. Go to **/** or **/login**.
2. Enter a **valid mobile number** (10 digits) that the backend can send OTP to.
3. Click **Request OTP**.
4. Enter the **OTP** you receive and submit.
5. You should be redirected into the app (e.g. **/kpis** or **/dashboard**).

**APIs used:** `POST property-owners/otp/request`, `POST property-owners/otp/verify`.

---

### Step 2 – Onboarding (if new user)

- If the verify response has `isNewUser: true` or `hasProperties: false`, you may be sent to **/onboarding**.
- Complete:
  - Language
  - PG details (name, type from API, bed range, address, pincode)
- Submit to create your first property.

**APIs used:** `GET property-owners/property-type-and-amenities`, `POST property-owners/properties`.

---

### Step 3 – Select a PG

- In the **header**, use the **PG switcher** dropdown.
- Select one of the properties returned by **GET property-owners/properties**.
- All PG-scoped pages (Complaints, Staff, Tenants add, etc.) use this selected PG.

---

### Step 4 – Pages and what uses dynamic data

| Page | What’s dynamic | What’s not connected yet |
|------|----------------|---------------------------|
| **Dashboard** | Total PGs from `getProperties`; stats show "—" until APIs exist | Finance numbers, recent activity, KPI values |
| **KPIs** | Same as dashboard; no KPI API in collection | All KPI metrics |
| **Tenants** | PG list from context (properties); Add Tenant uses API | Tenant list (no list API), rent types, Excel/Invite |
| **Complaints** | List from `getComplaintsByProperty(propertyId)`, update via `updateComplaintStatus` | Log complaint (no create in collection) |
| **Staff** | List from `getAllStaffWithPermissions(propertyId)`, designations, Add Staff (create) | — |
| **Plans** | Current plan from `getMyFeatures()` (FREE/PREMIUM/PRO) | Upgrade payment flow |
| **Rent & Payments** | Nothing | All data (no payments API in collection) |
| **Expenses** | Nothing | All data |
| **Reports** | Nothing | Export actions |
| **Support** | Nothing | Tickets list, submit ticket |
| **My PGs** | PG list from context; bank form is UI only | Bank save, PG info details |

---

## 3. Why “Upgrade plan” appears

- **Plans page**: Shows “You’re on the **&lt;Plan&gt;** plan” from **getMyFeatures()** (dynamic).  
  If the API returns a free-tier plan name (e.g. “Free” / “FREE”), you see upgrade messaging.
- **Staff page**: The **“Upgrade”** banner is shown **only when your plan is FREE**.  
  If `getMyFeatures()` returns a plan whose name (or display name) contains “free”, the banner appears; for PREMIUM/PRO it is hidden.

So “upgrade plan” is expected on the **free** plan; it disappears when the backend returns a higher plan.

---

## 4. How to test with “full” dynamic data

1. **Login** with a real mobile number and OTP so you have a valid token and property owner.
2. **Create at least one property** via onboarding (or ensure `getProperties` returns at least one PG).
3. **Select that PG** in the header.
4. **Complaints**: Backend must have complaints for that property; then open Complaints, use priority filter, and use **Update** to change status/remarks.
5. **Staff**: Add staff for the selected PG; list and designations come from the API.
6. **Tenants**: Use **Add Tenant** with room/bed etc.; list will stay empty until a “list tenants” API is available.
7. **Plans**: Check Plans page; current plan should match **getMyFeatures()**. Use a FREE plan user to see the upgrade banner on Staff.

---

## 5. APIs used (property-owner collection)

- **Auth:** otp/request, otp/verify, refresh-token, me  
- **Registration:** property-type-and-amenities, properties (GET/POST), language  
- **Features:** my-features  
- **Tenants:** check-room-availability, add-tenant, all-rooms-and-counts  
- **Staff:** create-staff, staff/permissions/assign, staff/permissions, staff/:id/permissions, designations, get-all-staff-with-permissions, update-staff-permissions  
- **Complaints:** GET properties/:id/complaints, PUT complaints/:id (status, remarks)

No static/fake data is used for the above; placeholders show "—" or “No data” where the API is not connected or returns empty.
