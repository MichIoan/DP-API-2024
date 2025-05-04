# DP-API-2024

Dataprocessing API 2024

## Prerequisites

- **PostgreSQL** (recommended version 16)
- **Node.js** (v14 or higher)
- **npm** (v6 or higher)

## Setup Instructions

### Database Setup

1. **Install PostgreSQL**
   - Download PostgreSQL from [the official website](https://www.postgresql.org/download/)
   - During installation, set a password for the 'postgres' user
   - Make note of the port (default is 5432)
   - Restart your computer after installation

2. **Start PostgreSQL Service**
   - **Windows**: 
     - Open Services (Run → services.msc)
     - Find "PostgreSQL" service and ensure it's running
     - Or run: `net START postgresql-x64-16` in Command Prompt as Administrator
   - **macOS**: 
     - Run: `brew services start postgresql`
   - **Linux**: 
     - Run: `sudo service postgresql start` or `sudo systemctl start postgresql`

3. **Create a Database**
   ```bash
   # Log in to PostgreSQL
   psql -U postgres
   
   # Create a new database
   CREATE DATABASE <database_name>;
   
   # Exit psql
   \q
   ```
   Replace `<database_name>` with the name of your database.

4. **Import Database Schema**
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

   `<port>` is the port you specified in your `.env` file

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

## Troubleshooting

### Database Connection Issues

1. **PostgreSQL Service Not Running**
   - Check if the PostgreSQL service is running using the commands in the "Start PostgreSQL Service" section.
   - If it's not running, start it using the appropriate command for your OS.

2. **Connection Refused Error**
   - Verify PostgreSQL is running on the expected port (default 5432)
   - Check your firewall settings to ensure the port is open
   - Verify the DB_HOST and DB_PORT in your .env file

3. **Authentication Failed**
   - Double-check your DB_USER and DB_PASSWORD in the .env file
   - Ensure the user has the necessary permissions

4. **Database Does Not Exist**
   - Verify you've created the database with the same name as in your DB_NAME setting
   - Try connecting directly with psql to confirm the database exists

5. **Schema Import Failed**
   - Check if the SQL file path is correct
   - Ensure you have the necessary permissions to read the file
   - Try running the SQL commands manually in psql

### API Startup Issues

1. **Port Already in Use** (EADDRINUSE Error)
   - Change the PORT value in your .env file to use a different port
   - Or find and kill the process using the current port:
     - **Windows**:
       ```bash
       # Find the process using port 8081 (or your configured port)
       netstat -ano | findstr :8081
       
       # Kill the process using its PID (replace 1234 with the actual PID)
       taskkill /F /PID 1234
       ```
     - **macOS/Linux**:
       ```bash
       # Find the process using port 8081 (or your configured port)
       lsof -i :8081
       
       # Kill the process using its PID (replace 1234 with the actual PID)
       kill -9 1234
       ```

2. **Missing Dependencies**
   - Run `npm install` again to ensure all dependencies are installed