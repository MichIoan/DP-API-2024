const { Builder } = require("xml2js");

// Helper function to convert JSON to XML
const jsonToXml = (json) => {
	const builder = new Builder();
	return builder.buildObject(json);
};

// Middleware to handle response format
const responseMiddleware = (req, res, next) => {
	res.response = (data) => {
		const accept = req.headers["Accept"] || "";
		if (accept.includes("application/xml") || req.query.format === "xml") {
			res.set("Content-Type", "application/xml");
			res.send(jsonToXml(data));
		} else {
			res.json(data);
		}
	};
	next();
};

module.exports = responseMiddleware;
