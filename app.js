// Load environment variables from .env file
require('dotenv').config();

const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const helmet = require("helmet");
const bodyParser = require("body-parser");
const xmlparser = require("express-xml-bodyparser");
const responseMiddleware = require("./src/middleware/responseMiddleware");
const { initDatabase, testDatabaseFeatures } = require("./src/config/dbInit");
const swaggerUi = require("swagger-ui-express");
const swaggerSpecs = require("./src/config/swagger");

// Load model associations
require("./src/models/associations");

const port = process.env.PORT || 8083;

const app = express();
app.use(helmet());
app.use(bodyParser.json());
app.use(morgan("dev"));
app.use(cors({ origin: true, credentials: true }));

// XML body parser middleware - parses XML request bodies
app.use(xmlparser({
  explicitArray: false, // Don't create arrays for single elements
  normalize: true,      // Normalize tag names to lowercase
  normalizeTags: true,  // Normalize tag names to lowercase
  trim: true            // Trim whitespace
}));

app.options("*", cors());

// Add response formatting middleware
app.use(responseMiddleware);

// XML request handling middleware
app.use((req, res, next) => {
  // Check if request content type is XML
  const contentType = req.get("Content-Type") || "";
  const isXmlRequest = contentType.includes("application/xml");
  
  // Check if client accepts XML responses
  const acceptHeader = req.get("Accept") || "";
  const wantsXmlResponse = acceptHeader.includes("application/xml") || req.query.format === "xml";
  
  // Set flags on request object for later use
  req.isXml = wantsXmlResponse;
  
  // Process XML request body if present
  if (isXmlRequest && req.body && typeof req.body === "object") {
    // XML parser already converted the XML to JSON
    // We may need to flatten nested structures
    const rootElement = Object.keys(req.body)[0];
    if (req.body[rootElement] && typeof req.body[rootElement] === "object") {
      req.body = req.body[rootElement];
      
      // Flatten arrays with single elements for easier handling
      for (let key in req.body) {
        if (Array.isArray(req.body[key]) && req.body[key].length === 1) {
          req.body[key] = req.body[key][0];
        }
      }
    }
  }
  
  next();
});

// Initialize database connection
initDatabase(false)
  .then(() => {
    // Test database features after initialization
    return testDatabaseFeatures();
  })
  .then(() => {
    console.log('Database initialization complete');
  })
  .catch(err => {
    console.error('Database initialization failed:', err);
  });

//routes for register, login, activation and passw reset
const authRoutes = require("./src/routes/authRoutes");
app.use("/auth", authRoutes);

//routes for user account management
const userRoutes = require("./src/routes/userRoutes");
app.use("/user", userRoutes);

//routes for admin operations
const adminRoutes = require("./src/routes/adminRoutes");
app.use("/admin", adminRoutes);

//routes for media (movies and series)
const mediaRoutes = require("./src/routes/mediaRoutes");
app.use("/media", mediaRoutes);

//routes for movies
const movieRoutes = require("./src/routes/movieRoutes");
app.use("/movies", movieRoutes);

//routes for series, season and episodes
const seriesRoutes = require("./src/routes/seriesRoutes");
app.use("/series", seriesRoutes);

//routes for profiles
const profileRoutes = require("./src/routes/profileRoutes");
app.use("/profiles", profileRoutes);

//routes for subscriptions
const subscriptionRoutes = require("./src/routes/subscriptionRoutes");
app.use("/subscriptions", subscriptionRoutes);

//routes for subtitles
const subtitlesRoutes = require("./src/routes/subtitlesRoutes");
app.use("/subtitles", subtitlesRoutes);

//routes for watch list
const watchListRoutes = require("./src/routes/watchListRoutes");
app.use("/watchlist", watchListRoutes);

//routes for watch history
const watchHistoryRoutes = require("./src/routes/watchHistoryRoutes");
app.use("/history", watchHistoryRoutes);

//routes for XML examples
const xmlExampleRoutes = require("./src/routes/xmlExampleRoutes");
app.use("/xml", xmlExampleRoutes);

// Swagger API documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

// Global error handling middleware
app.use((error, req, res, next) => {
  if (!error) {
    return next();
  }
  
  const status = error.statusCode || 500;
  const message = error.message || "An unexpected error occurred";
  const data = error.data || null;
  
  // Use the response middleware to handle XML or JSON responses
  res.response(req, res, status, { 
    success: false, 
    error: message,
    data: data
  });
});

// 404 handler
app.use((req, res) => {
  res.response(req, res, 404, { 
    success: false, 
    error: "Route not found" 
  });
});

app.listen(port, () => console.log(`Server is running on port ${port}`));

process.on("unhandledRejection", (error) => {
  console.error("Unhandled Rejection:", error);
});
