# Tennis Connect Application

Tennis Connect is a full-stack application designed to help tennis players find partners, courts, events, and communities in their area.

## Features

- User authentication and profiles
- Court finder with maps integration
- Nearby player matching based on skill level and location
- Play bulletins to find match partners
- Tennis events and RSVPs
- Tennis communities and discussions

## Technology Stack

### Backend
- Go (Gin framework)
- PostgreSQL database
- JWT authentication
- Docker for containerization

### Frontend
- React
- React Router for navigation
- CSS for styling
- Axios for API requests

## Project Structure

```
tennis-connect/
├── backend/             # Go backend API
│   ├── config/          # Application configuration
│   ├── database/        # Database connection and management
│   ├── handlers/        # HTTP request handlers
│   ├── middleware/      # HTTP middleware
│   ├── migrations/      # Database migrations
│   ├── models/          # Data models
│   ├── repository/      # Database repositories
│   └── utils/           # Utility functions
├── frontend/            # React frontend
│   ├── public/          # Static assets
│   └── src/
│       ├── components/  # React components
│       ├── services/    # API services
│       └── styles/      # CSS styles
└── docker-compose.yml   # Docker Compose configuration
```

## Getting Started

### Prerequisites

- Docker and Docker Compose
- Node.js and npm (for local frontend development)
- Go 1.20+ (for local backend development)
- PostgreSQL (for local database development)

### Environment Setup

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/tennis-connect.git
   cd tennis-connect
   ```

2. Create environment files:
   ```
   cp .env.example .env
   ```

3. Run the application with Docker Compose:
   ```
   docker-compose up -d
   ```

4. Access the application:
   - Frontend: http://localhost:80
   - Backend API: http://localhost:8080

### Local Development

#### Backend

1. Set up the PostgreSQL database:
   ```
   docker-compose up -d db
   ```

2. Install backend dependencies:
   ```
   cd backend
   go mod download
   ```

3. Run database migrations:
   ```
   make migrate
   ```

4. Start the backend server:
   ```
   make run
   ```
   
   Or for development with auto-reload (requires Air):
   ```
   make dev
   ```

#### Frontend

1. Install frontend dependencies:
   ```
   cd frontend
   npm install
   ```

2. Start the development server:
   ```
   npm start
   ```

## Testing

### Backend Tests

Run all tests:
```
cd backend
make test
```

Run only unit tests:
```
make test-unit
```

Run only integration tests:
```
make test-integration
```

### Frontend Tests

```
cd frontend
npm test
```

## Deployment

The application is containerized and can be deployed to any environment that supports Docker containers.

### Production Deployment

1. Set production environment variables in `.env.production`.

2. Build and deploy using Docker Compose:
   ```
   docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
   ```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Thanks to all contributors who have helped build Tennis Connect. 