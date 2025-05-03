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

const port = process.env.PORT || 8081;

const app = express();
app.use(helmet());
app.use(bodyParser.json());
app.use(morgan("dev"));
app.use(cors({ origin: true, credentials: true }));

app.use(xmlparser());

app.options("*", cors());

app.use(responseMiddleware);

//accepts xml input based on accept header
app.use((req, res, next) => {
	const contentType = req.get("Accept");
	req.isXml = contentType && contentType.includes("application/xml");

	if (req.isXml && req.body && typeof req.body === "object") {
		const rootElement = Object.keys(req.body)[0];
		if (req.body[rootElement] instanceof Object) {
			req.body = req.body[rootElement];

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

app.use((error, req, res) => {
	const status = error.statusCode || 500;
	const message = error.message;
	const data = error.data;
	res.status(status).json({ message: message, data: data });
});

app.use((req, res) => {
	res.status(404).json({ message: "Route not found" });
});

app.listen(port, () => console.log(`Server is running on port ${port}`));

process.on("unhandledRejection", (error) => {
	console.error("Unhandled Rejection:", error);
});
