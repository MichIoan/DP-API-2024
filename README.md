# DP-API-2024

Dataprocessing API 2024

INSTRUCTIONS

    Database
    Node/Express & env

DATABASE

To run the api, first of all you will need PostgreSQL installed on your computer. We recommend version 16.

During the installation you will be required to set a password for the 'postgres' user. We recommend to use the password 'root'.

After you've installed PostgreSQL, restart the computer.

Now you will need to create a database before importing the sql file.

Log in the psql with the command: "psql -U postgres" and with the password you've set during the installation.

After logging in, use the "CREATE DATABASE <database_name>". Replace database_name with whatever you'd like.

After creating the database, use "\q" to quit the psql.

Try to import the sql file with the command "psql -U -d <database_name> -f <path_to_sql_file>" in the command-line.

Replace with postgres, database_name with the database_name you've just created, and, at last, the path to the sql file.

NODE/EXPRESS & ENV

Open a command-line in the folder with the app.js, run the command "npm i" to install the necessary modules for the API.

After that, create a .env file with the next structure: JWT_KEY='' PORT = 8081 db_name = '' db_username = '' db_password = '' db_host ='localhost' db_dialect = 'postgres'

YOU ALSO NEED TO SET A JWT_KEY, db_name db_username db_password IN .ENV FILE.
