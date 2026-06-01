# Roles API

## Overview

The Roles API is used to manage user roles and permissions within the Roofing CRM application.

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

# Role Object

| Field       | Type   | Description                              |
| ----------- | ------ | ---------------------------------------- |
| roleId      | string | Unique role identifier                   |
| name        | string | Role name                                |
| description | string | Role description                         |
| permissions | array  | List of permissions assigned to the role |
| status      | string | Role status                              |
| CreatedAt   | string | Creation timestamp (ISO 8601)            |
| UpdatedAt   | string | Last update timestamp (ISO 8601)         |

---

# Get All Roles

Returns all available roles.

## Endpoint

```http
GET /roles
```

## Request Body

None

## Success Response

**Status:** `200 OK`

```json
[
  {
    "roleId": "4df2a9f5-c5a9-44a9-8db1-6bcb0e2ef2c1",
    "name": "Admin",
    "description": "System administrator",
    "permissions": [
      "users:create",
      "users:update",
      "users:delete",
      "roles:create",
      "roles:delete"
    ],
    "status": "Active",
    "CreatedAt": "2026-06-01T10:00:00.000Z",
    "UpdatedAt": "2026-06-01T10:00:00.000Z"
  }
]
```

---

# Create Role

Creates a new role.

## Endpoint

```http
POST /roles
```

## Request Body

```json
{
  "name": "Project Manager",
  "description": "Manages projects and employees",
  "permissions": [
    "projects:create",
    "projects:update",
    "projects:view",
    "employees:view"
  ]
}
```

## Field Requirements

| Field       | Required | Notes                    |
| ----------- | -------- | ------------------------ |
| name        | Yes      | Must be unique           |
| description | No       | Defaults to empty string |
| permissions | Yes      | Must be an array         |

## Success Response

**Status:** `201 Created`

```json
{
  "data": {
    "roleId": "4df2a9f5-c5a9-44a9-8db1-6bcb0e2ef2c1",
    "name": "Project Manager",
    "description": "Manages projects and employees",
    "permissions": [
      "projects:create",
      "projects:update",
      "projects:view",
      "employees:view"
    ],
    "status": "Active",
    "CreatedAt": "2026-06-01T10:00:00.000Z",
    "UpdatedAt": "2026-06-01T10:00:00.000Z"
  }
}
```

## Error Responses

### Missing Required Fields

**Status:** `400 Bad Request`

```json
{
  "message": "name are required"
}
```

### Invalid Permissions Format

**Status:** `400 Bad Request`

```json
{
  "message": "permissions must be an array"
}
```

### Duplicate Role Name

**Status:** `409 Conflict`

```json
{
  "message": "Role name already exists"
}
```

---

# Delete Role

Deletes an existing role.

## Endpoint

```http
DELETE /roles/{roleId}
```

## Path Parameters

| Parameter | Type   | Required |
| --------- | ------ | -------- |
| roleId    | string | Yes      |

## Success Response

**Status:** `200 OK`

```json
{
  "message": "Role 4df2a9f5-c5a9-44a9-8db1-6bcb0e2ef2c1 deleted"
}
```

## Error Responses

### Missing Role ID

**Status:** `400 Bad Request`

```json
{
  "message": "roleId is required"
}
```

### Role Not Found

**Status:** `404 Not Found`

```json
{
  "message": "Role not found"
}
```

---

# CORS Support

Supported methods:

```text
GET
POST
DELETE
OPTIONS
```

Response headers:

```http
Access-Control-Allow-Origin: *
Access-Control-Allow-Headers: Content-Type
Access-Control-Allow-Methods: GET,POST,DELETE,OPTIONS
```
---

