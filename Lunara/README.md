# LUNARA Frontend

React + TypeScript + Vite frontend for the **LUNARA Postpartum Support Platform** - a compassionate digital sanctuary connecting postpartum mothers with certified doulas and support specialists during their fourth trimester journey.

## Project Vision

LUNARA transforms the postpartum support experience through a thoughtfully designed digital platform that feels less like traditional software and more like opening a treasured storybook. We aim to create a digital sanctuary that nurtures families through their transformative postpartum period with personalized guidance, emotional support, and practical resources.

## Technology Stack

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router v6
- **State Management**: React Context API
- **HTTP Client**: Axios with interceptors
- **Authentication**: JWT tokens with refresh logic
- **UI Components**: Custom components with Tailwind
- **Testing**: Jest + React Testing Library
- **Linting**: ESLint + TypeScript
- **Code Quality**: SonarQube integration

## Current Features (Sprint 1 Complete)

### Authentication & Authorization
- User registration for clients and providers
- Login system with JWT token management
- Automatic token refresh with Axios interceptors
- Role-based routing and access control
- Protected routes with authentication guards
- Logout functionality with token cleanup

### User Interface
- Responsive design with Tailwind CSS
- Modern, accessible UI components
- Landing page with platform information
- Provider registration and login forms
- Client registration and login forms
- Provider dashboard with client management
- Navigation with role-based menu items

### User Management
- Provider dashboard with statistics overview
- Client creation form for providers
- User profile management
- Role-based UI rendering
- Form validation and error handling

### Infrastructure
- TypeScript for type safety
- Vite for fast development and building
- React Router for client-side routing
- Axios for API communication
- Environment configuration
- Error handling and loading states

## Upcoming Features (Sprint 2-3)

### Client Experience Enhancements
- **Complete client dashboard** with personalized journey tracking
- **Wellness check-in forms** with mood and symptom tracking
- **Digital journaling space** with AI-powered prompts and affirmations
- **Personalized resource recommendations** based on postpartum phase

### Communication & Scheduling
- **Appointment scheduling interface** with calendar integration
- **Real-time messaging system** with file sharing capabilities
- **Video call integration** for virtual doula support
- **Push notifications** for appointment reminders and support

### Integration Features
- **Resource Library Service integration** (Andrew's microservice)
- **Content browser** for articles, guides, and educational materials
- **Blog/content viewing** with personalized recommendations
- **Advanced provider-client matching** with specialty-based assignments

### Advanced Features
- **File upload functionality** for document sharing
- **Mobile app development** for native experience
- **Performance optimization** and accessibility improvements

## Getting Started

### Prerequisites

- **Node.js** 18 or higher
- **npm** or **yarn** package manager
- **Git** for version control

### 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Lunara
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   # Copy environment template
   cp .env.example .env
   
   # Edit .env with your configuration
   ```

4. **Environment Variables**
   ```env
   # API Configuration
   VITE_API_BASE_URL=http://localhost:5000/api
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```

6. **Access the Application**
   - **Frontend**: http://localhost:5173
   - **Backend API**: http://localhost:5000/api

## Development

### Available Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run test         # Run tests
npm run test:ui      # Run tests with UI
npm run lint         # Run ESLint
npm run type-check   # TypeScript type checking
```

### Testing
```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run tests with UI
npm run test:ui
```

### Styling
- **Tailwind CSS** for utility-first styling
- **Custom CSS** for specific components
- **Responsive design** with mobile-first approach
- **Dark mode support** (planned)

### Code Quality
- **TypeScript** for type safety
- **ESLint** for code linting
- **Prettier** for code formatting
- **SonarQube** for code quality analysis

## Project Structure

```
src/
├── api/                 # API client configuration
├── components/          # Reusable UI components
│   ├── auth/           # Authentication components
│   ├── layout/         # Layout components
│   ├── sections/       # Page sections
│   └── ui/             # Basic UI components
├── contexts/           # React contexts
├── hooks/              # Custom React hooks
├── pages/              # Page components
├── services/           # API services
├── styles/             # Global styles
├── tests/              # Test files
├── types/              # TypeScript type definitions
└── utils/              # Utility functions
```

## API Integration

### Authentication Flow
1. User registers/logs in through forms
2. Backend returns JWT access and refresh tokens
3. Tokens stored in localStorage
4. Axios interceptors handle token refresh automatically
5. Protected routes check authentication status

### API Client
- **Base URL**: Configurable via environment variables
- **Interceptors**: Automatic token attachment and refresh
- **Error Handling**: Centralized error handling
- **Type Safety**: Full TypeScript support

## User Roles & Permissions

### Provider (Doula)
- **Provider Dashboard**: Comprehensive practice management interface
- **Client Management**: Create and manage client accounts with detailed profiles
- **Appointment Scheduling**: Calendar integration with availability management
- **Communication Tools**: Secure messaging and video call capabilities
- **Resource Management**: Curate and share personalized content with clients
- **Analytics & Insights**: Track client engagement and care progress

### Client (Mother)
- **Personal Dashboard**: Digital sanctuary with journey tracking and support
- **Provider Connection**: View assigned doula information and communication
- **Appointment Management**: Schedule and manage support sessions
- **Wellness Tracking**: Mood and symptom monitoring with gentle guidance
- **Resource Access**: Personalized content recommendations and educational materials
- **Digital Journaling**: Reflective space with AI-powered prompts and affirmations

### Admin
- **System Management**: Full platform access and configuration
- **User Administration**: Account management and role assignments
- **Analytics Dashboard**: Comprehensive reporting and insights
- **Content Moderation**: Resource library and communication oversight
- **Integration Management**: Service coordination and API monitoring

## Design Philosophy

The platform embraces a **storybook-inspired aesthetic**, creating an experience that feels less like traditional software and more like opening a treasured book of support. Drawing inspiration from Studio Ghibli, forest imagery, and the magic of new motherhood.

### Visual Experience
- **Warm, Natural Color Palette** that shifts subtly with time of day to create rhythm and gentle transition
- **Custom Illustrations** including "Mother Tree," "Fourth Trimester Garden," and "Nest of Nurture" integrated thoughtfully throughout
- **Accessible Typography** combining serif fonts for headings with highly readable text for tired eyes and parents with dyslexia
- **Responsive Design** that works beautifully on phones, tablets, and computers (acknowledging that new parents often have a baby in one arm and a device in the other)

### Emotional Design
- **Calming Interface** that provides respite from the often clinical nature of postpartum resources
- **Gentle Guidance** through nurturing language and imagery that makes self-monitoring feel like self-care
- **Personal Sanctuary** where families can track wellbeing, access resources, and connect with their doula
- **Reflective Space** with prompts and affirmations that encourage reflection without pressure

### Accessibility & Inclusivity
- **WCAG 2.1 AA Standards** ensuring usability by people with diverse needs and abilities
- **Technical Inclusivity** for varying comfort levels with technology
- **Universal Accessibility** designed for one-handed use, sleep-deprived parents, and temporary or permanent disabilities

## Deployment

### Production Build
```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

### Environment Variables
```env
# Production API URL
VITE_API_BASE_URL=https://lunara.onrender.com/api
```

### Docker Support
```bash
# Build Docker image
docker build -t lunara-frontend .

# Run container
docker run -p 5173:5173 lunara-frontend
```

## Contributing

1. **Follow existing code patterns** and TypeScript conventions
2. **Add tests** for new components and features
3. **Use semantic commit messages**
4. **Ensure all tests pass** before submitting PR
5. **Follow accessibility guidelines** for UI components

###  Code Style
- Use TypeScript strict mode
- Follow ESLint configuration
- Use meaningful component and function names
- Add JSDoc comments for complex functions
- Keep components small and focused

## Support & Troubleshooting

### Common Issues
- **API Connection**: Check VITE_API_BASE_URL environment variable
- **Authentication**: Verify JWT tokens are being stored correctly
- **Routing**: Check React Router configuration
- **Styling**: Verify Tailwind CSS classes are applied

### 📚 Resources
- **React Documentation**: https://react.dev/
- **Vite Documentation**: https://vitejs.dev/
- **Tailwind CSS**: https://tailwindcss.com/
- **TypeScript**: https://www.typescriptlang.org/

###  Debugging
```bash
# Enable debug logging
DEBUG=* npm run dev

# Check environment variables
node -e "console.log(import.meta.env)"

# Run type checking
npm run type-check
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Team & Project Context

### Academic Project
**LUNARA** is a senior capstone project developed by software engineering students at **Grand Canyon University** under the guidance of Professor Amr Elchouemi.

###  Team Members
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

###  Project Architecture
- **Main Platform**: Core LUNARA functionality (Owen & Carter)
- **Resource Library Service**: Content management microservice (Andrew)
- **Integration**: API-based communication between services

###  Timeline
- **Duration**: 20 weeks (May - October 2025)
- **Current Phase**: Sprint 1 Complete, Sprint 2-3 in progress
- **Target Launch**: October 2025

###  Project Vision
LUNARA aims to transform the postpartum support experience through a thoughtfully designed digital platform that feels less like traditional software and more like opening a treasured storybook. Our vision is to create a digital sanctuary that nurtures families through their fourth trimester journey with personalized guidance, emotional support, and practical resources when they need them most.