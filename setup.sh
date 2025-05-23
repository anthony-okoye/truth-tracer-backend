#!/bin/bash

set -e

# 1. Install Node dependencies
echo "Installing Node.js dependencies..."
npm install

# 2. Check for psql
if ! command -v psql &> /dev/null; then
  echo "psql (PostgreSQL CLI) could not be found. Please install PostgreSQL and ensure psql is in your PATH."
  exit 1
fi

# 3. Load environment variables
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
else
  echo ".env file not found! Please create one before running this script."
  exit 1
fi

# 4. Create database if it doesn't exist
echo "Creating database $DB_DATABASE if it does not exist..."
psql -h "$DB_HOST" -U "$DB_USERNAME" -tc "SELECT 1 FROM pg_database WHERE datname = '$DB_DATABASE'" | grep -q 1 || psql -h "$DB_HOST" -U "$DB_USERNAME" -c "CREATE DATABASE \"$DB_DATABASE\";"

echo "Database ready."

echo "Setup complete! You can now run:"
echo "  npm run start:dev" 