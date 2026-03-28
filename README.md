# LUNARA Postpartum Support Platform

LUNARA is a compassionate digital sanctuary connecting postpartum mothers with certified doulas and support specialists during their fourth trimester journey. This comprehensive platform transforms the postpartum support experience through a thoughtfully designed digital space that feels less like traditional software and more like opening a treasured storybook.

## Project Vision

LUNARA aims to create a digital sanctuary that nurtures families through their transformative postpartum period with personalized guidance, emotional support, and practical resources when they need them most. The platform combines enchanting storybook-inspired aesthetics with intuitive, practical tools to create a digital companion for new parents and powerful practice management tools for doulas.

## Technology Stack

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js with TypeScript
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT with Passport.js (Local + JWT strategies)
- **Email**: Nodemailer (Gmail SMTP)
- **Real-time**: Socket.IO
- **Documentation**: Swagger/OpenAPI
- **Security**: Helmet, CORS, Rate Limiting, bcrypt
- **Testing**: Jest with Supertest
- **Validation**: Express-validator
- **Logging**: Winston

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router v6
- **State Management**: React Context API
- **HTTP Client**: Axios with interceptors
- **UI Components**: Custom components with Tailwind
- **Testing**: Jest + React Testing Library
- **Linting**: ESLint + TypeScript
- **Code Quality**: SonarQube integration

### Infrastructure
- **Containerization**: Docker, Docker Compose
- **Code Quality**: SonarQube
- **API Documentation**: Swagger UI
- **Database**: MongoDB (local or Atlas)
- **Deployment**: Cloud-ready with environment configuration

### Architecture Overview

LUNARA follows a **microservices architecture** with the main platform handling core functionality and a separate Resource Library Service for content management. This approach provides:

- **Scalability**: Independent scaling of content-heavy features
- **Specialization**: Focused development on core vs. content features  
- **Maintainability**: Clear separation of concerns
- **Future Flexibility**: Easy enhancement or replacement of services

## Project Structure

```
LUNARA/
├── backend/                    # Node.js/Express backend API
│   ├── src/                   # Source code (TypeScript)
│   │   ├── config/           # Configuration files
│   │   ├── middleware/       # Express middleware
│   │   ├── models/          # MongoDB models
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic
│   │   ├── types/           # TypeScript type definitions
│   │   └── utils/           # Utility functions
│   ├── tests/               # Test files
│   ├── dist/                # Compiled JavaScript
│   └── package.json         # Backend dependencies
├── Lunara/                   # React frontend application
│   ├── src/                 # Source code (TypeScript)
│   │   ├── api/             # API client configuration
│   │   ├── components/      # Reusable UI components
│   │   ├── contexts/        # React contexts
│   │   ├── hooks/           # Custom React hooks
│   │   ├── pages/           # Page components
│   │   ├── services/        # Frontend services
│   │   ├── styles/          # CSS and styling
│   │   ├── tests/           # Test files
│   │   ├── types/           # TypeScript type definitions
│   │   └── utils/           # Utility functions
│   ├── public/              # Static assets
│   └── package.json         # Frontend dependencies
├── Docs/                     # Project documentation
│   ├── backend/             # Backend-specific docs
│   ├── Guides/              # Setup and team guides
│   ├── Planning/            # Project planning documents
│   └── img/                 # Images and diagrams
├── docker-compose.yml        # Development environment
├── docker-compose.yml.example # Example configuration
└── README.md                # This file
```

### Key Components

- **`backend/`**: Express.js API server with TypeScript, MongoDB integration, JWT authentication, and comprehensive API documentation
- **`Lunara/`**: React frontend with Vite, TypeScript, Tailwind CSS, and responsive design
- **`Docs/`**: Comprehensive documentation including database guides, team coordination, and project planning
- **`docker-compose.yml`**: Development environment with MongoDB, backend, frontend, and SonarQube services

## Getting Started

### Prerequisites

- **Node.js** 18 or higher
- **npm** or **yarn** package manager
- **MongoDB** (local installation or MongoDB Atlas)
- **Docker** and **Docker Compose** (optional, for containerized development)
- **Git** for version control

### Quick Start (Development)

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd LUNARA
   ```

2. **Set up environment variables:**
   - Copy `backend/.env.example` to `backend/.env` and configure your settings
   - Copy `Lunara/.env.example` to `Lunara/.env` and configure your settings
   - See individual README files for detailed environment setup

3. **Start the backend:**
   ```bash
   cd backend
   npm install
   npm run dev
   ```

4. **Start the frontend (in a new terminal):**
   ```bash
   cd Lunara
   npm install
   npm run dev
   ```

5. **Access the application:**
   - **Frontend**: http://localhost:5173
   - **Backend API**: http://localhost:5000/api
   - **API Documentation**: http://localhost:5000/api-docs

### Running with Docker (Optional)

1. **Set up environment variables:**
   - Copy `docker-compose.yml.example` to `docker-compose.yml`
   - Configure environment variables in the compose file or `.env` files

2. **Build and run the containers:**
   ```bash
   docker-compose up --build -d
   ```

3. **Access the services:**
   - **Backend API**: http://localhost:5000
   - **Frontend Application**: http://localhost:5173
   - **MongoDB Database**: Accessible on port 27017
   - **SonarQube**: http://localhost:9000
   - **API Documentation**: http://localhost:5000/api-docs

## Current Features

### Authentication & Authorization
- User registration for clients and providers
- JWT token management with refresh tokens
- Role-based access control (client/provider/admin)
- Secure password hashing with bcrypt
- Email verification system (configurable for development)

### User Management
- Comprehensive user profiles with MongoDB schemas
- Client profile management with intake forms
- Provider profile management with professional information
- Provider dashboard with client creation functionality

### Infrastructure
- MongoDB connection with Mongoose ODM
- RESTful API design with Express.js
- Comprehensive error handling middleware
- Request validation and sanitization
- API documentation with Swagger
- Docker containerization support

## Upcoming Features

### Core Platform Features
- **Complete appointment scheduling system** with calendar integration
- **Real-time messaging** between clients and providers with file sharing
- **Wellness check-ins and mood tracking** for postpartum monitoring
- **Advanced provider-client matching** with specialty-based assignments

### Integration Features
- **Resource Library Service integration** (Andrew's microservice)
- **API integration** for personalized content recommendations
- **User profile synchronization** across services
- **Unified analytics** and engagement tracking

### Advanced Features
- **Push notifications** for appointment reminders and support
- **File upload functionality** for document sharing
- **Mobile app development** for native experience
- **Performance optimization** and scalability improvements

## Documentation

### Comprehensive Documentation

We have extensive documentation to help you understand and work with the LUNARA platform:

- **[Backend README](./backend/README.md)** - Complete backend API documentation
- **[Frontend README](./Lunara/README.md)** - Frontend application documentation
- **[Database Team Guide](./Docs/Guides/DATABASE_TEAM_GUIDE.md)** - MongoDB setup guide
- **[MongoDB Setup Guide](./Docs/Guides/MONGODB_SETUP_GUIDE.md)** - Step-by-step database setup
- **[Database Schema](./Docs/backend/DATABASE_SCHEMA.md)** - Data structure and relationships
- **[Database Quick Reference](./Docs/backend/DATABASE_QUICK_REFERENCE.md)** - Developer reference

### Project Planning Documents

- **[Main Requirements](./Docs/Planning/MAIN_LUNARA_UPDATED_REQUIREMENTS.md)** - Updated project requirements
- **[Initial Proposal](./Docs/Planning/InitialProposal.md)** - Original project proposal
- **[Team Coordination](./Docs/Planning/TEAM_COORDINATION_SUMMARY.md)** - Team coordination and handoff
- **[Andrew's Resource Library Project](./Docs/Planning/ANDREW_MACK_RESOURCE_LIBRARY_PROJECT.md)** - Resource service specification

## Team & Project Context

### Academic Project
**LUNARA** is a senior capstone project developed by software engineering students at **Grand Canyon University** under the guidance of Professor Amr Elchouemi.

### Team Members
- **Owen Lindsey** - Backend Lead & Project Manager
  - Primary Responsibilities: System architecture, database design, API development
  - Technical Focus: Node.js, TypeScript, MongoDB, security implementation
  - Leadership Role: Overall project vision, timeline management, team coordination

- **Carter Wright** - Frontend Lead & UI/UX Designer  
  - Primary Responsibilities: React development, user interface design, component library
  - Technical Focus: React, TypeScript, Tailwind CSS, responsive design
  - Leadership Role: Interface decisions, design system, usability testing

- **Andrew Mack** - DevOps Lead & Resource Service Developer
  - Primary Responsibilities: Infrastructure, CI/CD, Resource Library Service
  - Technical Focus: Backend services, cloud deployment, microservices architecture
  - Leadership Role: Development workflow, code quality, infrastructure management

### Project Architecture
- **Main Platform**: Core LUNARA functionality (Owen & Carter)
- **Resource Library Service**: Content management microservice (Andrew)
- **Integration**: API-based communication between services

### Timeline
- **Duration**: 20 weeks (May - October 2025)
- **Current Phase**: Sprint 1 Complete, Sprint 2-3 in progress
- **Target Launch**: October 2025

## Code Quality & Development

### SonarQube Integration
This project uses SonarQube for static code analysis and quality assurance:
- Access the SonarQube dashboard at `http://localhost:9000` when running via Docker Compose
- Backend SonarQube properties are configured in `backend/sonar-project.properties`
- Frontend SonarQube properties are configured in `Lunara/sonar-project.properties`

### TypeScript & Documentation
- **Full TypeScript Implementation**: Both backend and frontend are fully converted to TypeScript for type safety, maintainability, and better developer experience
- **Comprehensive Documentation**: Each major directory contains README files and JSDoc comments for all major files and exports
- **API Documentation**: All API endpoints are documented and browsable at `/api-docs` using Swagger/OpenAPI
- **Type Safety**: Strict TypeScript configuration ensures robust code quality

### Development Standards
- **Code Style**: ESLint and Prettier configurations for consistent code formatting
- **Testing**: Jest for backend testing, React Testing Library for frontend testing
- **Git Workflow**: Conventional commit messages and proper branching strategy
- **Documentation**: Comprehensive README files and inline documentation

## Contributing

We welcome contributions to the LUNARA platform! Please follow these guidelines:

1. **Follow existing code patterns** and TypeScript conventions
2. **Add tests** for new features (unit and integration)
3. **Update documentation** with any changes
4. **Use conventional commit messages**
5. **Ensure all tests pass** before submitting PR
6. **Ensure SonarQube passes** attach screenshot to PR
7. **Follow accessibility guidelines** for UI components

### Development Workflow
1. Fork the repository
2. Create a feature branch from `main`
3. Make your changes with proper testing
4. Update documentation as needed
5. Submit a pull request with a clear description

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For questions, issues, or contributions, please refer to the comprehensive documentation in the `Docs/` directory or create an issue in the repository. 