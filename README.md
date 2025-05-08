# My Project

A web application providing an API.

## Prerequisites

- [Docker](https://www.docker.com/get-started) installed on your machine.

## Getting Started

To set up and run the project, follow these steps:

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Bakhromov-02/basic-api-task.git
   cd basic-api-task
   ```

2. **Create a `.env` file**:
   - Copy the `example.env` file to create a `.env` file:
     ```bash
     cp example.env .env
     ```
   - Edit the `.env` file to set the necessary environment variables. Use the `example.env` file as a template for configuration.

3. **Build and run the project**:
   - Start the project using Docker Compose:
     ```bash
     docker compose up --build
     ```

## Usage

- Once the project is running, you can access the Swagger documentation at [http://localhost:7001/docs](http://localhost:7001/docs).
- To stop the application, run:
  ```bash
  docker compose down
  ```
