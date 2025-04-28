/**
 * XML Utilities for API responses
 * Provides methods to convert JSON to XML and handle XML responses
 */

const js2xmlparser = require('js2xmlparser');

/**
 * Convert a JavaScript object to XML
 * @param {string} rootElement - The root element name for the XML
 * @param {Object} data - The data to convert to XML
 * @returns {string} - XML string
 */
const convertToXml = (rootElement, data) => {
  return js2xmlparser.parse(rootElement, data);
};

/**
 * Middleware to add XML response capability to Express
 * Usage: app.use(xmlResponseMiddleware);
 */
const xmlResponseMiddleware = (req, res, next) => {
  // Add a respondXml method to the response object
  res.respondXml = (rootElement, data) => {
    res.setHeader('Content-Type', 'application/xml');
    res.send(convertToXml(rootElement, data));
  };

  // Check if client accepts XML
  res.format = function(formatters) {
    const originalFormat = res.format;
    return originalFormat.call(this, {
      'application/json': formatters['application/json'],
      'application/xml': formatters['application/xml'] || (() => {
        if (formatters['application/json']) {
          const data = formatters['application/json']();
          if (data) {
            res.respondXml('response', data);
          }
        }
      }),
      'default': formatters['default'] || formatters['application/json']
    });
  };

  next();
};

module.exports = {
  convertToXml,
  xmlResponseMiddleware
};
