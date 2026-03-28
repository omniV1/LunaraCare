# LUNARA Backend API

Express.js backend for the LUNARA Postpartum Support Platform - a comprehensive platform connecting postpartum mothers with certified doulas and support specialists.

## Technology Stack

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
- **Containerization**: Docker

### Architecture Overview

LUNARA follows a **microservices architecture** with the main platform handling core functionality and a separate Resource Library Service for content management. This approach provides:

- **Scalability**: Independent scaling of content-heavy features
- **Specialization**: Focused development on core vs. content features  
- **Maintainability**: Clear separation of concerns
- **Future Flexibility**: Easy enhancement or replacement of services

## Current Features (Sprint 1 Complete)

### Authentication & Authorization
- User registration with role-based access (client/provider/admin)
- JWT token management with refresh tokens
- Email verification system (configurable for development)
- Password reset functionality
- Role-based permissions and middleware
- Secure password hashing with bcrypt

### User Management
- Comprehensive user profiles with MongoDB schemas
- Client profile management with intake forms
- Provider profile management with professional info
- User role validation and permissions
- Profile update endpoints

### Infrastructure
- MongoDB connection with Mongoose ODM
- RESTful API design with Express.js
- Comprehensive error handling middleware
- Request validation and sanitization
- Rate limiting and security headers
- API documentation with Swagger
- Docker containerization support

### Data Models
- User model with authentication fields
- Client model with postpartum-specific data
- Provider model with professional information
- Appointment model for scheduling
- Message model for communication

## Upcoming Features (Sprint 2-3)

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
- **File upload with Cloudinary** for document sharing
- **Mobile app development** for native experience
- **Performance optimization** and scalability improvements

## Getting Started

### Prerequisites

- **Node.js** 18 or higher
- **MongoDB** (local installation or MongoDB Atlas)
- **Gmail account** for email service (with app password)
- **Git** for version control

### 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   # Copy environment template
   cp env.example .env
   
   # Edit .env with your configuration
   ```

4. **Required Environment Variables**
   ```env
   # Server Configuration
   NODE_ENV=development
   PORT=5000
   API_URL=http://localhost:5000/api
   FRONTEND_URL=http://localhost:5173
   
   # Database Configuration
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/lunara?retryWrites=true&w=majority
   
   # JWT Configuration
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production
   JWT_EXPIRE=1h
   JWT_REFRESH_EXPIRE=7d
   
   # Email Configuration (Gmail SMTP)
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   EMAIL_FROM=noreply@lunara.com
   EMAIL_FROM_NAME=LUNARA Platform
   
   # Security Configuration
   BCRYPT_ROUNDS=12
   SESSION_SECRET=your-session-secret-change-this-in-production
   
   # Development Configuration
   SKIP_EMAIL_VERIFICATION=true
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```

6. **Access API Documentation**
   - **Swagger UI**: http://localhost:5000/api-docs
   - **Health Check**: http://localhost:5000/api/health
   - **API Base URL**: http://localhost:5000/api

## Database Documentation

We have comprehensive database documentation for the team:

- **[DATABASE_TEAM_GUIDE.md](./Docs/Guides/DATABASE_TEAM_GUIDE.md)** - **START HERE!** Complete guide for team members setting up MongoDB
- **[MONGODB_SETUP_GUIDE.md](./Docs/Guides/MONGODB_SETUP_GUIDE.md)** - Step-by-step setup instructions in plain English
- **[DATABASE_SCHEMA.md](./Docs/backend/DATABASE_SCHEMA.md)** - Detailed data structure and relationships explanation
- **[DATABASE_QUICK_REFERENCE.md](./Docs/backend/DATABASE_QUICK_REFERENCE.md)** - Quick reference for developers

**For the team member setting up the database**: Start with [DATABASE_TEAM_GUIDE.md](./Docs/Guides/DATABASE_TEAM_GUIDE.md) - it has everything you need!

### Database Architecture

Our MongoDB database is designed to support the unique needs of postpartum care:

- **User Management**: Role-based access (clients, providers, admins)
- **Client Profiles**: Comprehensive postpartum-specific data collection
- **Provider Profiles**: Professional certifications and availability management
- **Relationship Mapping**: Provider-client assignments and care tracking
- **Data Validation**: Automatic schema validation and business logic enforcement

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user (client/provider)
- `POST /api/auth/login` - Email/password login
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout user
- `POST /api/auth/verify-email` - Verify email address
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password

### Users
- `GET /api/users/profile` - Get current user profile
- `PUT /api/users/profile` - Update user profile

### Appointments (Basic CRUD)
- `GET /api/appointments` - List appointments for current user
- `GET /api/appointments/:id` - Get specific appointment
- `POST /api/appointments` - Create new appointment
- `PUT /api/appointments/:id` - Update appointment
- `DELETE /api/appointments/:id` - Delete appointment

### Messages (Basic CRUD)
- `GET /api/messages` - List messages for current user
- `GET /api/messages/:id` - Get specific message
- `POST /api/messages` - Send new message
- `PUT /api/messages/:id` - Update message
- `DELETE /api/messages/:id` - Delete message

### Resources (Static)
- `GET /api/resources` - Get available resources

### Public Endpoints
- `GET /api/public/platform-info` - Get platform information
- `GET /api/public/doulas` - Get featured doula profiles
- `POST /api/public/contact` - Submit contact form

### Upcoming Endpoints (Sprint 2-3)
- Clients: `/api/clients/*` - Client management
- Providers: `/api/providers/*` - Provider management
- Check-ins: `/api/checkins/*` - Wellness tracking
- Blog: `/api/blog/*` - Content management

## Data Models

### User
- Basic user information (name, email, role)
- Authentication data (password hash, tokens)
- OAuth provider information
- Profile settings and preferences

### Client
- References User model (role: 'client')
- Intake form data
- Birth and pregnancy information
- Provider assignment
- Onboarding progress tracking

### Provider
- References User model (role: 'doula')
- Professional certifications and experience
- Specialties and services offered
- Availability and client management
- Service areas and pricing

## Security Features

- JWT access tokens (1 hour expiry)
- Refresh tokens (7 day expiry)
- Password hashing with bcrypt
- Rate limiting (100 requests/15 minutes)
- Helmet security headers
- CORS configuration
- Input validation and sanitization

## Email Templates

Pre-built email templates for:
- Welcome/email verification
- Password reset
- Appointment confirmations

## Development

### Available Scripts
```bash
npm run dev          # Start development server with nodemon
npm run dev:watch    # Start with file watching
npm start            # Production start
npm run build        # Build TypeScript to JavaScript
npm run type-check   # TypeScript type checking
npm test             # Run all tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Run tests with coverage report
```

### Testing
```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Watch mode for development
npm run test:watch

# Run specific test file
npm test -- appointments.test.ts
```

### 🗄️ Database Operations

The application automatically handles:
- MongoDB connection with retry logic
- Schema validation and casting
- Automatic timestamps (createdAt, updatedAt)
- Index creation for performance
- Relationship population
- Data sanitization

### Docker Support

```bash
# Build Docker image
docker build -t lunara-backend .

# Run container
docker run -p 5000:5000 --env-file .env lunara-backend

# Docker Compose (if available)
docker-compose up
```

## Deployment

### Production Environment Variables

Ensure these are set in production:
```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://...
JWT_SECRET=strong-secure-secret
JWT_REFRESH_SECRET=strong-refresh-secret
EMAIL_USER=production-email@gmail.com
EMAIL_PASS=production-app-password
FRONTEND_URL=https://your-frontend-domain.com
SKIP_EMAIL_VERIFICATION=false
```

### Security Checklist

- [ ] Strong JWT secrets (32+ characters)
- [ ] MongoDB Atlas with IP whitelisting
- [ ] Gmail app password (not regular password)
- [ ] CORS configured for production domain
- [ ] Rate limiting enabled
- [ ] Helmet security headers
- [ ] Input validation on all endpoints
- [ ] Error handling without sensitive data exposure

## Migration from Spring Boot

This Express.js backend replaces the previous Spring Boot implementation:

### Mapping
- Spring Controllers → Express Routes
- JPA Entities → Mongoose Models
- Spring Security → Passport.js + JWT
- Spring Data JPA → Mongoose ODM
- PostgreSQL → MongoDB

### Key Differences
- Document-based storage vs relational
- Embedded documents vs foreign keys
- JSON-based configuration vs annotations
- Middleware pattern vs AOP

## Contributing

1. **Follow existing code patterns** and TypeScript conventions
2. **Add tests** for new features (unit and integration)
3. **Update API documentation** with Swagger comments
4. **Validate** with existing environment and database
5. **Use conventional commit messages**
6. **Ensure all tests pass** before submitting PR

### Code Style
- Use TypeScript strict mode
- Follow ESLint configuration
- Use meaningful variable and function names
- Add JSDoc comments for complex functions
- Keep functions small and focused

## Support & Troubleshooting

### Common Issues
- **MongoDB Connection**: Check connection string and network access
- **JWT Errors**: Verify JWT secrets are set correctly
- **Email Issues**: Ensure Gmail app password is configured
- **CORS Errors**: Check FRONTEND_URL environment variable

### 📚 Resources
- **API Documentation**: http://localhost:5000/api-docs
- **Health Check**: http://localhost:5000/api/health
- **Console Logs**: Check terminal output for debugging
- **Database Logs**: MongoDB connection status in startup logs

### 🐛 Debugging
```bash
# Enable debug logging
DEBUG=* npm run dev

# Check environment variables
node -e "console.log(process.env)"

# Test database connection
node -e "require('./dist/server.js')"
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Team & Project Context

### Academic Project
**LUNARA** is a senior capstone project developed by software engineering students at **Grand Canyon University** under the guidance of Professor Amr Elchouemi.

### Team Members
- **Owen Lindsey** - Backend Lead & DevOps
  - Primary Responsibilities: System architecture, database design, API development, CI/CD
  - Technical Focus: Node.js, TypeScript, MongoDB, security, infrastructure
  - Leadership Role: Overall project vision, timeline management, deployment

- **Carter Wright** - Frontend Lead & UI/UX Designer  
  - Primary Responsibilities: React development, user interface design, component library
  - Technical Focus: React, TypeScript, Tailwind CSS, responsive design
  - Leadership Role: Interface decisions, design system, usability testing

### Project Architecture
- **Backend**: Node.js/Express API with MongoDB
- **Frontend**: React with TypeScript and Tailwind CSS
- **CI/CD**: GitHub Actions with Docker support

### Timeline
- **Duration**: 20 weeks (May - October 2025)
- **Current Phase**: Sprint 1 Complete, Sprint 2-3 in progress
- **Target Launch**: October 2025 