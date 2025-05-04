# DP-API-2024

Dataprocessing API 2024

## Prerequisites

- **PostgreSQL** (recommended version 16)
- **Node.js** (v14 or higher)
- **npm** (v6 or higher)

## Setup Instructions

### Database Setup

1. **Install PostgreSQL**
   - During installation, set a password for the 'postgres' user
   - Restart your computer after installation

2. **Create a Database**
   ```bash
   # Log in to PostgreSQL
   psql -U postgres
   
   # Create a new database
   CREATE DATABASE <database_name>;
   
   # Exit psql
   \q
   ```
   Replace `<database_name>` with the name of your database.

3. **Import Database Schema**
   ```bash
   # Import the SQL file
   psql -U postgres -d <database_name> -f <path_to_sql_file>
   ```
   Replace `<path_to_sql_file>` with the path to the SQL file in the project.

### API Setup

1. **Install Dependencies**
   ```bash
   # Navigate to the project directory in a terminal or if you have the option to open the folder with your IDE:
   cd path/to/project
   
   # Install required packages
   npm install
   ```

2. **Environment Configuration**
   - Copy the example environment file to create your own either by command or manually:
   ```bash
   cp .env.example .env
   ```
   - Open the `.env` file and update the values as needed, especially:
     - Database credentials
     - JWT secret key
     - API URLs

## Running the API

1. **Start the Server**
   ```bash
   npm start
   ```
   The API will be available at `http://localhost:<port>`

   <port> is the port you specified in your `.env` file

2. **Run in Development Mode** (with auto-reload)
   ```bash
   npm run dev
   ```

## Testing

Run the tests with:
```bash
npm test
```

For test coverage report:
```bash
npm test -- --coverage
```

## API Documentation

API documentation is available in the `/docs` directory or by accessing the `/api-docs` endpoint when the server is running.