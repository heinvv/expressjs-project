# expressjs-project

Express.js app with MongoDB, Mongoose, EJS layouts, and REST-style routes for authors and books.

## Prerequisites

- Node.js >= 18
- MongoDB (mongod running locally or a remote instance)

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Configure the database:

   Copy `.env.example` to `.env` and set `DATABASE_URL`:

   ```bash
   cp .env.example .env
   ```

   Edit `.env` and set your MongoDB connection string. For local MongoDB:

   ```
   DATABASE_URL=mongodb://localhost:27017/fullstack
   ```

   Replace `fullstack` with your database name. For MongoDB Atlas or remote hosts, use the full connection string (including credentials if required).

3. Run the app:

   ```bash
   npm run devStart
   ```

   Or for production:

   ```bash
   npm start
   ```

## Environment Variables

| Variable       | Description                              | Default     |
|----------------|------------------------------------------|-------------|
| `DATABASE_URL` | MongoDB connection string                 | (required)  |
| `PORT`         | Server port                              | 3001        |
| `NODE_ENV`     | `production` disables dotenv, use system env | development |
