const { convertToXml } = require('../utils/xmlUtils');

/**
 * Middleware to standardize response format
 * Supports both JSON and XML responses based on client preference
 */
const responseMiddleware = (req, res, next) => {
  // Add a response method to handle both JSON and XML formats
  res.response = (req, res, statusCode, data) => {
    // Set the status code
    res.status(statusCode);
    
    // Check if client wants XML (either through Accept header or query param)
    const acceptHeader = req.headers.accept || '';
    const wantsXml = acceptHeader.includes('application/xml') || req.query.format === 'xml';
    
    if (wantsXml) {
      // Set XML content type
      res.setHeader('Content-Type', 'application/xml');
      // Convert data to XML with 'response' as root element
      const xmlData = convertToXml('response', data);
      return res.send(xmlData);
    } else {
      // Default to JSON
      return res.json(data);
    }
  };
  
  next();
};

module.exports = responseMiddleware;
