# Neighborhood Library Service - Documentation

This document provides a complete guide to setting up, running, testing, and using the Neighborhood Library Service application.

## Project Overview

This project is a full-stack application for managing a small neighborhood library. It includes a gRPC-based Python backend, a PostgreSQL database, a Node.js API gateway, and a React frontend with a Material-UI component library.

The system supports managing books (including inventory), members, and borrowing/returning operations. It features a robust, automated database migration system and gRPC server reflection for easy API exploration.

## Project Structure

```
.
├── backend
│   ├── Dockerfile
│   ├── entrypoint.sh
│   ├── migrate.py
│   ├── migrations
│   │   ├── 1_initial_schema.sql
│   │   └── 2_add_quantity_and_due_dates.sql
│   ├── requirements.txt
│   └── server.py
├── docker-compose.yml
├── frontend
│   ├── Dockerfile
│   ├── package.json
│   ├── public
│   │   ├── index.html
│   │   └── manifest.json
│   └── src
│       ├── App.js
│       ├── api.js
│       └── ...
├── gateway
│   ├── Dockerfile
│   ├── gateway.js
│   └── package.json
└── proto
    └── library.proto
```

## Setup and Running

You will need Docker and Docker Compose installed on your machine.

1.  **Clone the repository** and navigate into the project directory.
2.  **Create the backend environment file**: Before starting, you need to create a configuration file for the backend service.
    -   Create a new file named `.env` inside the `backend` directory (`backend/.env`).
    -   Add the following content to this file:
        ```
        DB_NAME=library
        DB_USER=user
        DB_PASSWORD=password
        DB_HOST=postgres
        DB_PORT=5432
        ```
3.  **Build and run the services**: Run the following command from the project root:
    ```bash
    docker-compose up --build
    ```
    This command will build the Docker images for all services, start the containers, and automatically run the database migrations.

## How to Use and Test the Application

Once the services are running, you can interact with the application in three main ways:

-   **Main Web UI**: `http://localhost:8080`
    -   This is the main user interface for library staff. You can manage books, members, and borrowing operations here.

-   **gRPC Web UI (`grpcui`)**: `http://localhost:8081`
    -   This is a developer tool for interacting directly with the backend gRPC server. It uses reflection to discover all available services and methods.

-   **REST API**: `http://localhost:3000`
    -   This is the RESTful API provided by the Node.js gateway. The frontend UI communicates with this API. You can also use tools like `curl` or Postman to interact with it.

### Verifying the Setup

1.  **Check Container Logs**: You can view the logs for all running services to ensure they started correctly:
    ```bash
    docker-compose logs -f
    ```
    -   Look for "Database migration process finished." and "Starting gRPC server..." from the `backend` service.
    -   Look for "API Gateway listening on port 3000" from the `gateway` service.
2.  **Access the UIs**: Open your web browser and navigate to `http://localhost:8080` and `http://localhost:8081` to ensure both the main application and the gRPC UI are accessible.

## API Guides

### gRPC API Exploration with `grpcurl`

You can also use the command-line tool `grpcurl` to explore the gRPC API via reflection.

-   **List all services:**
    ```bash
    grpcurl -plaintext localhost:50051 list
    ```
-   **List all methods in the Library service:**
    ```bash
    grpcurl -plaintext localhost:50051 list library.Library
    ```
-   **Call the `ListBooks` method:**
    ```bash
    grpcurl -plaintext -d '{}' localhost:50051 library.Library.ListBooks
    ```

### REST API Endpoints

Here are some examples of how to use the REST API with `curl`.

-   **List all books:**
    `curl http://localhost:3000/books`

-   **Create a new book:**
    ```bash
    curl -X POST -H "Content-Type: application/json" -d '{"title": "The Hobbit", "author": "J.R.R. Tolkien", "isbn": "978-0345339683", "published_year": 1937, "quantity": 3}' http://localhost:3000/books
    ```
-   **Create a new member:**
    ```bash
    curl -X POST -H "Content-Type: application/json" -d '{"name": "Bilbo Baggins", "email": "bilbo@bagend.com", "phone": "555-1234"}' http://localhost:3000/members
    ```
-   **Borrow a book:**
    ```bash
    curl -X POST -H "Content-Type: application/json" -d '{"book_id": "1", "member_id": "1"}' http://localhost:3000/borrow
    ```