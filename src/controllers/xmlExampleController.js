/**
 * Example controller demonstrating XML response capabilities
 * Shows how to use the XML response features
 */

const xmlExampleController = {
    /**
     * Get example data in XML format
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    getXmlExample: async (req, res) => {
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
                    res.respondXml('netflix', exampleData);
                },
                'default': () => {
                    res.json(exampleData);
                }
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: error.message });
        }
    },
    
    /**
     * Alternative method using the response middleware
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    getXmlAlt: async (req, res) => {
        try {
            const exampleData = {
                profiles: [
                    { id: 1, name: "Adult", age: 30 },
                    { id: 2, name: "Child", age: 10 }
                ]
            };
            
            // Using the response middleware
            return res.response(req, res, 200, exampleData);
        } catch (error) {
            console.error(error);
            return res.response(req, res, 500, { error: error.message });
        }
    }
};

module.exports = xmlExampleController;
