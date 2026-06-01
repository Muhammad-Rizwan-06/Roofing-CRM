# User Management API

## Overview

The User Management API is used to create, retrieve, update, and delete users within the Roofing CRM application.

## Base URL

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

# User Object

| Field       | Type          | Description                          |
| ----------- | ------------- | ------------------------------------ |
| userId      | string        | Unique user identifier               |
| name        | string        | User full name                       |
| email       | string        | User email address                   |
| phone       | string        | User phone number                    |
| roleId      | string        | Role identifier                      |
| roleName    | string        | Role name                            |
| status      | string        | User status (Active, Inactive, etc.) |
| startDate   | string        | Employment start date                |
| lastLoginAt | string | null | Last login timestamp                 |
| createdAt   | string        | Creation timestamp                   |
| updatedAt   | string        | Last update timestamp                |

---

# Create User

Creates a new user.

## Endpoint

```http
POST /users
```

## Request Body

```json
{
  "name": "John Doe",
  "email": "john.doe@roofingcrm.com",
  "phone": "+1-555-123-4567",
  "roleId": "role-001",
  "roleName": "Manager",
  "passwordHash": "hashed-password",
  "passwordSalt": "password-salt",
  "startDate": "2026-06-01"
}
```

## Business Rules

* Only one user with role `Admin` can exist.
* Creating a second Admin user returns an error.
* New users are automatically assigned:

```json
{
  "status": "Active",
  "lastLoginAt": null
}
```

## Success Response

**Status:** `201 Created`

```json
{
  "message": "User created",
  "user": {
    "userId": "6f3b95af-5ef7-4b44-90a0-7fcb6f9d2f30",
    "name": "John Doe",
    "email": "john.doe@roofingcrm.com",
    "phone": "+1-555-123-4567",
    "roleId": "role-001",
    "roleName": "Manager",
    "status": "Active",
    "startDate": "2026-06-01",
    "lastLoginAt": null,
    "createdAt": "2026-06-01T10:00:00.000Z",
    "updatedAt": "2026-06-01T10:00:00.000Z"
  }
}
```

## Error Response

### Admin Already Exists

**Status:** `400 Bad Request`

```json
{
  "message": "Admin already exists"
}
```

---

# Get All Users

Returns all users.

## Endpoint

```http
GET /users
```

## Request Body

None

## Success Response

**Status:** `200 OK`

```json
[
  {
    "userId": "6f3b95af-5ef7-4b44-90a0-7fcb6f9d2f30",
    "name": "John Doe",
    "email": "john.doe@roofingcrm.com",
    "phone": "+1-555-123-4567",
    "roleId": "role-001",
    "roleName": "Manager",
    "status": "Active",
    "startDate": "2026-06-01",
    "lastLoginAt": null,
    "createdAt": "2026-06-01T10:00:00.000Z",
    "updatedAt": "2026-06-01T10:00:00.000Z"
  }
]
```

---

# Get User By ID

Returns a specific user.

## Endpoint

```http
GET /users/{userId}
```

## Path Parameters

| Parameter | Type   | Required |
| --------- | ------ | -------- |
| userId    | string | Yes      |

## Success Response

**Status:** `200 OK`

```json
{
  "userId": "6f3b95af-5ef7-4b44-90a0-7fcb6f9d2f30",
  "name": "John Doe",
  "email": "john.doe@roofingcrm.com",
  "phone": "+1-555-123-4567",
  "roleId": "role-001",
  "roleName": "Manager",
  "status": "Active",
  "startDate": "2026-06-01",
  "lastLoginAt": null,
  "createdAt": "2026-06-01T10:00:00.000Z",
  "updatedAt": "2026-06-01T10:00:00.000Z"
}
```

## Error Response

**Status:** `404 Not Found`

```json
{
  "message": "User not found"
}
```

---

# Update User

Updates an existing user.

## Endpoint

```http
PUT /users/{userId}
```

## Path Parameters

| Parameter | Type   | Required |
| --------- | ------ | -------- |
| userId    | string | Yes      |

## Request Body

All fields are optional.

```json
{
  "name": "John Smith",
  "email": "john.smith@roofingcrm.com",
  "phone": "+1-555-987-6543",
  "roleId": "role-002",
  "roleName": "Supervisor",
  "status": "Inactive"
}
```

## Success Response

**Status:** `200 OK`

```json
{
  "message": "User updated",
  "emailChanged": false
}
```

or

```json
{
  "message": "User updated with new email",
  "emailChanged": true
}
```

## Notes

* Only supplied fields are updated.
* Changing email automatically updates email indexes.
* Changing role automatically updates role indexes.
* `updatedAt` is automatically refreshed.

## Error Response

**Status:** `404 Not Found`

```json
{
  "message": "User not found"
}
```

---

# Delete User

Deletes an existing user.

## Endpoint

```http
DELETE /users/{userId}
```

## Path Parameters

| Parameter | Type   | Required |
| --------- | ------ | -------- |
| userId    | string | Yes      |

## Success Response

**Status:** `200 OK`

```json
{
  "message": "User deleted"
}
```

## Error Response

**Status:** `404 Not Found`

```json
{
  "message": "User not found"
}
```

---

# CORS Support

Supported methods:

```text
GET
POST
PUT
DELETE
OPTIONS
```

Response headers:

```http
Access-Control-Allow-Origin: *
Access-Control-Allow-Headers: *
Access-Control-Allow-Methods: GET,POST,PUT,DELETE,OPTIONS
```
