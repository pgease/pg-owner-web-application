# PG Owner Web & Mobile Application — API Changes & Integration Guide

This document covers all new and updated REST APIs available for the **PG Owner Application** (Web & Mobile).

---

## Table of Contents
1. [Authentication Header](#authentication-header)
2. [Multiple Settlement Bank Accounts & UPI Management](#1-multiple-settlement-bank-accounts--upi-management)
   - [1.1 List All Bank Accounts & UPI IDs](#11-list-all-bank-accounts--upi-ids)
   - [1.2 Add a New Bank Account or UPI ID](#12-add-a-new-bank-account-or-upi-id)
   - [1.3 Set Account as Primary](#13-set-account-as-primary)
   - [1.4 Delete a Bank Account](#14-delete-a-bank-account)
   - [1.5 Backward-Compatible Legacy Endpoints](#15-backward-compatible-legacy-endpoints)
3. [Assign Settlement Account to Tenants](#2-assign-settlement-account-to-tenants)
   - [2.1 Add Tenant with Bank Account Assignment](#21-add-tenant-with-bank-account-assignment)
   - [2.2 Update Tenant Bank Account Assignment](#22-update-tenant-bank-account-assignment)
4. [Tenant Payment Links & Scannable QR Codes](#3-tenant-payment-links--scannable-qr-codes)
   - [3.1 Fetch Tenant Payment Link & Active QR String](#31-fetch-tenant-payment-link--active-qr-string)
5. [Property Creation & Updation (Swagger Schema Parity)](#4-property-creation--updation-swagger-schema-parity)
   - [4.1 Create Property](#41-create-property)
   - [4.2 Update Property](#42-update-property)
6. [TypeScript Interfaces for Client Applications](#5-typescript-interfaces-for-client-applications)

---

## Authentication Header
All endpoints require a Bearer JWT Token obtained from owner login / OTP verification:
```http
Authorization: Bearer <accessToken>
Content-Type: application/json
```

---

## 1. Multiple Settlement Bank Accounts & UPI Management

Property owners can add multiple bank accounts or UPI IDs and designate one as the default primary account.

### 1.1 List All Bank Accounts & UPI IDs
Retrieve all bank accounts and UPI IDs registered under the authenticated property owner.

- **Method**: `GET`
- **Path**: `/api/property-owners/bank-accounts`
- **Auth**: Required (Owner Bearer Token)

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "accounts": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "accountHolderName": "Rahul Sharma",
      "accountNumber": "987654321012",
      "ifscCode": "HDFC0000001",
      "bankName": "HDFC Bank",
      "branch": "Koramangala Branch",
      "accountType": "current",
      "upiId": "rahulsharma@okhdfcbank",
      "isVerified": true,
      "isPrimary": true,
      "createdAt": "2026-09-24T18:30:00.000Z"
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440002",
      "accountHolderName": "Shree Enterprises",
      "accountNumber": "112233445566",
      "ifscCode": "SBIN0001234",
      "bankName": "State Bank of India",
      "branch": "Indiranagar",
      "accountType": "savings",
      "upiId": "shreeenterprises@oksbi",
      "isVerified": true,
      "isPrimary": false,
      "createdAt": "2026-09-24T19:00:00.000Z"
    }
  ],
  "primaryAccount": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "accountHolderName": "Rahul Sharma",
    "accountNumber": "987654321012",
    "ifscCode": "HDFC0000001",
    "bankName": "HDFC Bank",
    "branch": "Koramangala Branch",
    "accountType": "current",
    "upiId": "rahulsharma@okhdfcbank",
    "isVerified": true,
    "isPrimary": true
  }
}
```

---

### 1.2 Add a New Bank Account or UPI ID
Add an additional bank account or UPI ID to the owner's settlement profile.

- **Method**: `POST`
- **Path**: `/api/property-owners/bank-accounts`
- **Auth**: Required (Owner Bearer Token)

#### Request Body
```json
{
  "accountHolderName": "Rahul Sharma",
  "accountNumber": "987654321012",
  "ifscCode": "HDFC0000001",
  "bankName": "HDFC Bank",
  "branch": "Koramangala Branch",
  "accountType": "current",
  "upiId": "rahulsharma@okhdfcbank",
  "isPrimary": false
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `accountHolderName` | `string` | **Yes** | Legal account holder name |
| `accountNumber` | `string` | **Yes** | Bank account number (min 8 digits) |
| `ifscCode` | `string` | **Yes** | Valid 11-character IFSC code |
| `bankName` | `string` | No | Bank name (auto-resolved from IFSC if omitted) |
| `branch` | `string` | No | Branch location |
| `accountType` | `"savings"` \| `"current"` | No | Account type (default: `"current"`) |
| `upiId` | `string` | No | Associated UPI VPA ID (e.g. `user@okhdfcbank`) |
| `isPrimary` | `boolean` | No | Set as default primary account if `true` |

#### Success Response (`201 Created`)
```json
{
  "success": true,
  "message": "Bank account added successfully",
  "account": {
    "id": "550e8400-e29b-41d4-a716-446655440003",
    "accountHolderName": "Rahul Sharma",
    "accountNumber": "987654321012",
    "ifscCode": "HDFC0000001",
    "bankName": "HDFC Bank",
    "branch": "Koramangala Branch",
    "accountType": "current",
    "upiId": "rahulsharma@okhdfcbank",
    "isVerified": true,
    "isPrimary": false,
    "createdAt": "2026-09-24T20:15:00.000Z"
  },
  "accounts": [ /* updated list of all accounts */ ],
  "primaryAccount": { /* active primary account */ }
}
```

---

### 1.3 Set Account as Primary
Designate one of the registered accounts as the primary account. Future tenant onboarding and fallback settlements will use this account.

- **Method**: `PUT`
- **Path**: `/api/property-owners/bank-accounts/:accountId/primary`
- **Auth**: Required (Owner Bearer Token)

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "message": "Primary settlement bank account updated",
  "accounts": [ /* list of accounts with updated isPrimary flags */ ],
  "primaryAccount": { /* the newly selected primary account */ }
}
```

---

### 1.4 Delete a Bank Account
Removes a registered bank account or UPI ID. If the deleted account was the primary account, the next available account is automatically made primary.

- **Method**: `DELETE`
- **Path**: `/api/property-owners/bank-accounts/:accountId`
- **Auth**: Required (Owner Bearer Token)

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "message": "Settlement bank account removed successfully",
  "accounts": [ /* remaining accounts */ ],
  "primaryAccount": { /* current primary account */ }
}
```

---

### 1.5 Backward-Compatible Legacy Endpoints
The following endpoints continue to work without modification:
- `GET /api/property-owners/bank-account` — Returns the current primary account as `{ success: true, bankAccount: { ... } }`.
- `POST /api/property-owners/bank-account` — Updates the primary account and keeps the `accounts` array in sync.

---

## 2. Assign Settlement Account to Tenants

### 2.1 Add Tenant with Bank Account Assignment
When onboarding a tenant, owners can specify `bankAccountId` to route all rent payments and UPI links for this tenant into that specific account.

- **Method**: `POST`
- **Path**: `/api/property-owners/add-tenant/:propertyId`
- **Auth**: Required (Owner Bearer Token)

#### Request Body
```json
{
  "name": "Shivam Kumar",
  "phone": "+918368612646",
  "roomId": "2ba6a374-6c0e-4aba-8ad5-ca1c57197310",
  "bedNumber": 2,
  "monthlyRent": 8500,
  "securityDeposit": 10000,
  "rentDueDate": 5,
  "joiningDate": "2026-10-01",
  "bankAccountId": "550e8400-e29b-41d4-a716-446655440001"
}
```

> **Note**:
> When `bankAccountId` is provided, the backend automatically copies `bankAccountNumber`, `bankIfscCode`, `bankUpiId`, `bankName`, and `bankAccountHolderName` from the owner's bank account record into the tenant record.
> If `bankAccountId` is omitted, you can optionally provide custom bank details via `bankAccountNumber`, `bankIfscCode`, `bankUpiId`, etc.

---

### 2.2 Update Tenant Bank Account Assignment
To reassign an existing tenant to a different settlement account:

- **Method**: `PATCH`
- **Path**: `/api/property-owners/properties/:propertyId/tenants/:tenantId`
- **Auth**: Required (Owner Bearer Token)

#### Request Body
```json
{
  "bankAccountId": "550e8400-e29b-41d4-a716-446655440002"
}
```

---

## 3. Tenant Payment Links & Scannable QR Codes

### 3.1 Fetch Tenant Payment Link & Active QR String
Fetches the active payment link and UPI QR details for a tenant. If the tenant has an assigned `bankAccountId`, the returned `settlement` object reflects that account. Otherwise, it falls back to the owner's primary account.

- **Method**: `GET`
- **Path**: `/api/property-owners/properties/:propertyId/tenants/:tenantId/payment-link`
- **Auth**: Required (Owner Bearer Token)

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "tenantId": "da1c9e0b-4bf6-4072-8812-fce02ac9ec03",
  "paymentLink": "https://pgease.com/rent-collection/4cbedfe4-da03-403c-9627-123e9956bf70",
  "rentCollectionId": "4cbedfe4-da03-403c-9627-123e9956bf70",
  "balanceDue": 8500,
  "settlement": {
    "accountHolderName": "Rahul Sharma",
    "accountNumber": "987654321012",
    "ifscCode": "HDFC0000001",
    "bankName": "HDFC Bank",
    "branch": "Koramangala Branch",
    "upiId": "rahulsharma@okhdfcbank",
    "upiQrString": "upi://pay?pa=rahulsharma%40okhdfcbank&pn=Rahul%20Sharma&am=8500&cu=INR"
  }
}
```

> **Client Display Tip**: Use the `upiQrString` directly in any QR code library (e.g. `qrcode.react` on Web or `react-native-qrcode-svg` on Mobile) to allow tenants to scan and pay instantly with GPay, PhonePe, or Paytm.

---

## 4. Property Creation & Updation (Swagger Schema Parity)

### 4.1 Create Property
- **Method**: `POST`
- **Path**: `/api/property-owners/properties`
- **Auth**: Required (Owner Bearer Token)

#### Request Body
```json
{
  "name": "PG Ease Premium Coliving",
  "address": "#123, 4th Cross, HSR Layout Sector 2, Bengaluru",
  "latitude": 12.9121,
  "longitude": 77.6446,
  "locationPin": "560102",
  "bedRange": "1-3 Beds",
  "propertyTypeId": "064a5796-04c0-42df-b0f1-1baa487cfd67",
  "cityId": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
  "totalRooms": 24,
  "totalBeds": 48,
  "singleSharingPrice": 14000,
  "doubleSharingPrice": 9500,
  "tripleSharingPrice": 7500,
  "fourSharingPrice": 6000,
  "securityDepositCycle": 30,
  "facilities": ["High-Speed WiFi", "3 Meals Daily", "Daily Housekeeping", "Power Backup"],
  "nearbyPlaces": ["Silk Board Metro (800m)", "HSR BDA Complex (1km)"],
  "photos": [
    {
      "url": "https://pg-ease-qa.s3.ap-south-1.amazonaws.com/properties/photo-1.jpg",
      "key": "properties/photo-1.jpg",
      "order": 1
    }
  ],
  "active": true,
  "status": "active",
  "isPublishedListing": true
}
```

---

### 4.2 Update Property
- **Method**: `PUT`
- **Path**: `/api/property-owners/properties/:propertyId`
- **Auth**: Required (Owner Bearer Token)

#### Request Body
Supports any subset of the fields in Section 4.1.

---

## 5. TypeScript Interfaces for Client Applications

Use these TypeScript types in `pg-owner-web-application` or React Native mobile apps:

```typescript
export interface SettlementBankAccountItem {
  id: string;
  accountHolderName: string;
  accountNumber: string;
  ifscCode: string;
  bankName?: string;
  branch?: string;
  accountType?: "savings" | "current";
  upiId?: string;
  isVerified?: boolean;
  isPrimary?: boolean;
  createdAt?: string;
}

export interface SettlementBankAccountsResponse {
  success: boolean;
  accounts: SettlementBankAccountItem[];
  primaryAccount: SettlementBankAccountItem | null;
  message?: string;
}

export interface AddSettlementBankAccountPayload {
  accountHolderName: string;
  accountNumber: string;
  ifscCode: string;
  bankName?: string;
  branch?: string;
  accountType?: "savings" | "current";
  upiId?: string;
  isPrimary?: boolean;
}

export interface AddTenantPayload {
  name: string;
  phone: string;
  floorId: string;
  blockId: string;
  roomId: string;
  bedNumber: number;
  monthlyRent: number;
  securityDeposit: number;
  rentDueDate: number;
  joiningDate?: string;
  bankAccountId?: string; // <-- New field: Assign specific bank account
  // ...other stay, guardian, and personal fields
}
```
