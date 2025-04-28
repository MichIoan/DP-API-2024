# XML Support Documentation

This document describes the XML support implementation for the Netflix API project.

## Overview

The API now supports both JSON and XML response formats, allowing clients to choose their preferred data format. This implementation follows content negotiation principles and provides multiple ways to request XML data.

## How to Use XML Responses

### As a Client

Clients can request XML responses in two ways:

1. **Using the Accept Header**:
   ```
   Accept: application/xml
   ```

2. **Using a Query Parameter**:
   ```
   ?format=xml
   ```

### As a Developer

Developers can use XML responses in two ways:

1. **Using Content Negotiation (Recommended)**:
   ```javascript
   res.format({
     'application/json': () => {
       res.json(data);
     },
     'application/xml': () => {
       res.respondXml('rootElement', data);
     },
     'default': () => {
       res.json(data);
     }
   });
   ```

2. **Using the Response Middleware**:
   ```javascript
   return res.response(req, res, 200, data);
   ```

## Example Endpoints

The API includes example endpoints to demonstrate XML responses:

- `/xml/public` - Public endpoint that demonstrates content negotiation
- `/xml/protected` - Protected endpoint that demonstrates the response middleware

## Implementation Details

The XML support is implemented using:

- `express-xml-bodyparser` - For parsing XML request bodies
- `js2xmlparser` - For converting JSON to XML
- Custom middleware - For handling XML responses

## Files

- `src/utils/xmlUtils.js` - Utility functions for XML conversion
- `src/middleware/xmlResponse.js` - Middleware for XML responses
- `src/controllers/xmlExampleController.js` - Example controller
- `src/routes/xmlExampleRoutes.js` - Example routes

## Testing XML Responses

You can test XML responses using curl:

```bash
# Request JSON (default)
curl http://localhost:8081/xml/public

# Request XML using Accept header
curl -H "Accept: application/xml" http://localhost:8081/xml/public

# Request XML using query parameter
curl http://localhost:8081/xml/public?format=xml
```
