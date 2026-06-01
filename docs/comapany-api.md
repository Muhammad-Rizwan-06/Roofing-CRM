# Company Configuration API

## Overview

The Company Configuration API is used to create, retrieve, and update company settings used throughout the Roofing CRM application.

**Base URL**

```text
https://wi3bmu631i.execute-api.ap-south-1.amazonaws.com/prod
```

---

## Request Headers

All requests must include:

```http
Content-Type: application/json
Accept: application/json
```

---

# Company Object

| Field          | Type   | Description                            |
| -------------- | ------ | -------------------------------------- |
| PK             | string | Fixed partition key (`CONFIG#COMPANY`) |
| companyName    | string | Company name                           |
| email          | string | Company email                          |
| phone          | string | Company phone number                   |
| timeZone       | string | Company timezone                       |
| address        | string | Company address                        |
| currency       | string | Currency code (USD, PKR, etc.)         |
| taxRateDefault | number | Default tax percentage                 |
| invoicePrefix  | string | Invoice number prefix                  |
| estimatePrefix | string | Estimate number prefix                 |
| poPrefix       | string | Purchase order prefix                  |
| CreatedAt      | string | Record creation timestamp (ISO 8601)   |
| UpdatedAt      | string | Record update timestamp (ISO 8601)     |

---

# Create Company Configuration

Creates a company configuration record.

## Endpoint

```http
POST /company
```

## Request Body

```json
{
  "companyName": "ABC Roofing LLC",
  "email": "info@abcroofing.com",
  "phone": "+1-555-123-4567",
  "timeZone": "America/New_York",
  "address": "123 Main Street, New York, NY 10001",
  "currency": "USD",
  "taxRateDefault": 8.5,
  "invoicePrefix": "INV",
  "estimatePrefix": "EST",
  "poPrefix": "PO"
}
```

## Success Response

**Status:** `201 Created`

```json
{
  "PK": "CONFIG#COMPANY",
  "companyName": "ABC Roofing LLC",
  "email": "info@abcroofing.com",
  "phone": "+1-555-123-4567",
  "timeZone": "America/New_York",
  "address": "123 Main Street, New York, NY 10001",
  "currency": "USD",
  "taxRateDefault": 8.5,
  "invoicePrefix": "INV",
  "estimatePrefix": "EST",
  "poPrefix": "PO",
  "CreatedAt": "2026-05-23T12:40:59.438Z",
  "UpdatedAt": "2026-05-23T12:40:59.438Z"
}
```

## Error Responses

### Company Already Exists

**Status:** `409 Conflict`

```json
{
  "message": "Company config already exists. Use PUT to update."
}
```

---

# Get Company Configuration

Returns the current company configuration.

## Endpoint

```http
GET /company
```

## Request Body

None

## Success Response

**Status:** `200 OK`

```json
{
  "PK": "CONFIG#COMPANY",
  "companyName": "ABC Roofing LLC",
  "email": "info@abcroofing.com",
  "phone": "+1-555-123-4567",
  "timeZone": "America/New_York",
  "address": "123 Main Street, New York, NY 10001",
  "currency": "USD",
  "taxRateDefault": 8.5,
  "invoicePrefix": "INV",
  "estimatePrefix": "EST",
  "poPrefix": "PO",
  "CreatedAt": "2026-05-23T12:40:59.438Z",
  "UpdatedAt": "2026-05-23T12:40:59.438Z"
}
```

## Error Responses

### Company Configuration Not Found

**Status:** `404 Not Found`

```json
{
  "message": "Company config not found"
}
```

---

# Update Company Configuration

Updates the existing company configuration.

## Endpoint

```http
PUT /company
```

## Request Body

Send the complete company object.

```json
{
  "companyName": "ABC Roofing LLC",
  "email": "info@abcroofing.com",
  "phone": "+1-555-123-4567",
  "timeZone": "America/New_York",
  "address": "123 Main Street, New York, NY 10001",
  "currency": "USD",
  "taxRateDefault": 8.5,
  "invoicePrefix": "INV",
  "estimatePrefix": "EST",
  "poPrefix": "PO"
}
```

## Success Response

**Status:** `200 OK`

Returns the updated company configuration object.

## Notes

* The entire company object should be sent in the request body.
* `CreatedAt` is preserved automatically.
* `UpdatedAt` is updated automatically.
* If the record does not exist, a new record will be created.

---

# CORS Support

Supported methods:

```text
GET
POST
PUT
OPTIONS
```

Response headers:

```http
Access-Control-Allow-Origin: *
Access-Control-Allow-Headers: Content-Type
Access-Control-Allow-Methods: GET,POST,PUT,OPTIONS
```

---
