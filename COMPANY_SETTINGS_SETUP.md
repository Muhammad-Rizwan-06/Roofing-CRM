# Company Settings - API Integration Setup

This document explains the new architecture for Company Settings using Context API + Custom Hooks with a real database backend.

## Architecture Overview

The implementation uses a 3-layer architecture:

1. **API Client Layer** (`apiClient.js`) - Generalized HTTP client for all API calls
2. **Context Layer** (`CompanyContext.jsx`) - Global state management for company data
3. **Component Layer** (`CompanySettings.jsx`) - React component that consumes the context

## Files Created/Modified

### New Files

1. **`src/utils/apiClient.js`**
   - Generalized API client with GET, POST, PUT, PATCH, DELETE methods
   - Handles authentication headers automatically
   - Error handling and logging
   - Base URL configurable via `REACT_APP_API_URL` environment variable

2. **`src/context/CompanyContext.jsx`**
   - React Context for company state management
   - Provides `CompanyProvider` component to wrap your app
   - Manages loading and error states
   - Methods: `fetchCompany()`, `updateCompany()`, `updateField()`

3. **`src/hooks/useCompany.js`**
   - Custom hook to access company context
   - Throws error if used outside CompanyProvider
   - Usage: `const { company, loading, error, updateCompany } = useCompany();`

### Modified Files

1. **`src/pages/settings/CompanySettings.jsx`**
   - Removed localStorage dependency
   - Removed reset functionality
   - Added Save and Discard buttons
   - Integrated with `useCompany` hook
   - Added success/error notifications

2. **`src/routes/AppRoutes.jsx`**
   - Added `CompanyProvider` wrapper around `BrowserRouter`
   - Ensures company context is available globally

## Backend Integration

### Required Endpoint

Your backend must implement the following endpoint:

```
GET  /api/company
PUT  /api/company
```

### Expected Response Format

```json
{
  "companyName": "Roofing CRM",
  "phone": "+1-234-567-8900",
  "email": "info@roofingcrm.com",
  "address": "123 Main St, City, State",
  "timezone": "America/New_York",
  "currency": "USD",
  "taxRateDefault": 0.1,
  "invoicePrefix": "INV",
  "estimatePrefix": "EST",
  "poPrefix": "PO"
}
```

### Sample Backend Implementation (Node.js/Express)

```javascript
// Get company settings
app.get('/api/company', authenticateToken, async (req, res) => {
  try {
    const company = await CompanyModel.findOne({ organizationId: req.user.organizationId });
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }
    res.json(company);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update company settings
app.put('/api/company', authenticateToken, async (req, res) => {
  try {
    const company = await CompanyModel.findOneAndUpdate(
      { organizationId: req.user.organizationId },
      req.body,
      { new: true, runValidators: true }
    );
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }
    res.json(company);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
```

## Environment Setup

Add to your `.env` file:

```
REACT_APP_API_URL=http://localhost:3000/api
```

Or for production:

```
REACT_APP_API_URL=https://api.yourdomain.com/api
```

## Usage in Components

To access company data in any component:

```jsx
import { useCompany } from '../hooks/useCompany';

const MyComponent = () => {
  const { company, loading, error, updateCompany } = useCompany();

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div>
      <h1>{company.companyName}</h1>
      <p>Email: {company.email}</p>
    </div>
  );
};

export default MyComponent;
```

## Extending for Other Resources

The `apiClient` is fully generalized. To use it for other API endpoints:

```javascript
import { apiClient } from '../utils/apiClient';

// GET request
const data = await apiClient.get('/endpoint');

// POST request
const result = await apiClient.post('/endpoint', { key: 'value' });

// PUT request
const updated = await apiClient.put('/endpoint', { key: 'newValue' });

// DELETE request
await apiClient.delete('/endpoint');
```

## Error Handling

The API client throws structured error objects:

```javascript
try {
  await updateCompany(data);
} catch (error) {
  console.log(error.status);    // HTTP status code
  console.log(error.message);   // Error message
  console.log(error.data);      // Response body
}
```

## Features

✅ Automatic authentication token injection  
✅ Centralized error handling  
✅ Loading and error states  
✅ Form state management with save/discard  
✅ Success/error notifications  
✅ Prevents duplicate API calls on mount  
✅ Easy extensibility for other resources  

## Testing

Test the integration with:

```bash
# In browser console
const { useCompany } = window; // Won't work directly, use in a component instead

// Create a test component:
const TestComponent = () => {
  const { company, loading, error } = useCompany();
  return <pre>{JSON.stringify(company, null, 2)}</pre>;
};
```

## Troubleshooting

1. **"useCompany must be used within a CompanyProvider"**
   - Make sure CompanyProvider wraps your component in AppRoutes.jsx

2. **API calls failing with 401**
   - Check that authentication token is correctly stored in localStorage
   - Verify `auth` key in localStorage contains `{ "token": "..." }`

3. **CORS errors**
   - Ensure backend has proper CORS headers
   - Check `REACT_APP_API_URL` matches your backend domain

## Next Steps

1. Implement the backend endpoints
2. Set environment variables
3. Test Company Settings page
4. Apply same pattern to other pages that need database integration
