const BaseController = require('./BaseController');

/**
 * Example controller demonstrating XML response capabilities
 * Extends BaseController to inherit common functionality
 */
class XmlExampleController extends BaseController {
    /**
     * Get example data in XML format
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async getXmlExample(req, res) {
        try {
            // Sample data
            const exampleData = {
                movies: [
                    { id: 1, title: "The Matrix", year: 1999 },
                    { id: 2, title: "Inception", year: 2010 }
                ],
                series: [
                    { id: 1, title: "Stranger Things", seasons: 4 },
                    { id: 2, title: "Breaking Bad", seasons: 5 }
                ]
            };
            
            // Use content negotiation to respond in XML or JSON
            // Client can request XML using Accept: application/xml header
            // or by adding ?format=xml to the URL
            res.format({
                'application/json': () => {
                    res.json(exampleData);
                },
                'application/xml': () => {
                    // XML response will be handled by response middleware
                    res.response(req, res, 200, exampleData);
                },
                'default': () => {
                    // Default to JSON
                    res.json(exampleData);
                }
            });
        } catch (error) {
            console.error("Error in XML example:", error);
            return this.handleError(req, res, 500, "Internal server error", error.message);
        }
    }

    /**
     * Alternative method using the response middleware
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async getXmlAlt(req, res) {
        try {
            // Sample data
            const exampleData = {
                success: true,
                timestamp: new Date().toISOString(),
                content: {
                    title: "XML Response Example",
                    items: [
                        { name: "Item 1", value: 100 },
                        { name: "Item 2", value: 200 }
                    ]
                }
            };
            
            // Use the handleSuccess method from BaseController
            // This will automatically handle XML conversion if needed
            return this.handleSuccess(req, res, 200, exampleData);
        } catch (error) {
            console.error("Error in XML alternative example:", error);
            return this.handleError(req, res, 500, "Internal server error", error.message);
        }
    }
}

// Create a singleton instance
const xmlExampleController = new XmlExampleController();

// Export the instance
module.exports = xmlExampleController;
