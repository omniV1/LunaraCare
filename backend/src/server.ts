import express, { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import http from 'node:http';
import { Server as SocketIOServer } from 'socket.io';
import passport from 'passport';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import logger from './utils/logger';
import { validateJWTEnvironment } from './utils/tokenUtils';
import Category from './models/Category';
import Message from './models/Message';
import User from './models/User';
import Client from './models/Client';
import { socketConnectionManager } from './services/socketConnectionManager';
import { securityHeaders, sanitizeRequest, errorHandler, notFoundHandler } from './middleware';
import { verifyAccessToken } from './utils/tokenUtils';
import {
  isRateLimited,
  MESSAGE_WINDOW_MS,
  MESSAGE_MAX_PER_WINDOW,
} from './services/messageRateLimiter';

dotenv.config();

// Import passport configuration
import './config/passport';

// Import types (unused but kept for future use)

// Import routes
import authRouter from './routes/auth';
import appointmentsRouter from './routes/appointments';
import messagesRouter from './routes/messages';
import resourcesRouter from './routes/resources';
import categoriesRouter from './routes/categories';
import checkinsRouter from './routes/checkins';
import intakeRouter from './routes/intake';
import carePlansRouter from './routes/carePlans';
import adminRouter from './routes/admin';
import blogRouter from './routes/blog';
import usersRouter from './routes/users';
import providersRouter from './routes/providers';
import clientRouter from './routes/client';
import publicRouter from './routes/public';
import documentsRouter from './routes/documents';
import recommendationsRouter from './routes/recommendations';
import filesRouter from './routes/files';
import mfaRouter from './routes/mfa';
import pushNotificationsRouter from './routes/pushNotifications';
import interactionsRouter from './routes/interactions';
import { initGridFS } from './services/gridfsService';
import { startReminderScheduler } from './services/appointmentReminderService';
import { seedContent } from './seeds/seedContent';

const app = express();

// Trust proxy when behind Render/nginx (X-Forwarded-For) - required for express-rate-limit
app.set('trust proxy', 1);

const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.FRONTEND_URL ?? 'https://www.lunaracare.org',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Startup check for required environment variables
const REQUIRED_ENV_VARS = [
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'MONGODB_URI',
  'EMAIL_USER',
  'EMAIL_PASS',
  'FRONTEND_URL',
];

const missingVars = REQUIRED_ENV_VARS.filter(v => !process.env[v]);
if (missingVars.length > 0) {
  logger.error(`FATAL: Missing required environment variables: ${missingVars.join(', ')}`);
  process.exit(1);
}

validateJWTEnvironment();

// Hard fail-safe: SKIP_EMAIL_VERIFICATION is a dev convenience that bypasses email
// confirmation on signup. If it accidentally leaks into production, anyone can
// create verified accounts without owning the email address.
if (process.env.NODE_ENV === 'production' && process.env.SKIP_EMAIL_VERIFICATION === 'true') {
  logger.error('FATAL: SKIP_EMAIL_VERIFICATION must not be "true" in production');
  process.exit(1);
}

/** Host segment of MONGODB_URI without userinfo (for logs only; never log full URI). */
function mongoHostFromUri(uri: string): string {
  const at = uri.lastIndexOf('@');
  const tail = at >= 0 ? uri.slice(at + 1) : uri.replace(/^mongodb(\+srv)?:\/\//i, '');
  return tail.split('/')[0]?.split('?')[0] || 'unknown';
}

// MongoDB Connection
const connectDatabase = async (): Promise<void> => {
  try {
    const uri = process.env.MONGODB_URI ?? 'mongodb://localhost:27017/lunara';
    await mongoose.connect(uri, {
      // Note: useNewUrlParser and useUnifiedTopology are deprecated in newer versions
    });
    const conn = mongoose.connection;
    const dbName = conn.name || conn.db?.databaseName || 'unknown';
    const hostSummary = conn.host || mongoHostFromUri(uri);
    const dbHint = uri.includes('mongodb.net')
      ? 'Atlas'
      : uri.includes('localhost') || uri.includes('127.0.0.1') || uri.includes('mongo:')
        ? 'local'
        : 'custom';
    logger.info(`MongoDB connected (${dbHint}) — database="${dbName}" host="${hostSummary}"`);

    // Initialize GridFS for file storage
    try {
      initGridFS();
      logger.info('GridFS initialized for file storage');
    } catch (gridfsError) {
      logger.error('Failed to initialize GridFS:', gridfsError);
    }

    // Seed default categories if none exist
    try {
      const categoryCount = await Category.countDocuments();
      if (categoryCount === 0) {
        logger.info('No categories found. Seeding default categories...');
        const defaultCategories = [
          { name: 'General', description: 'General postpartum resources and information' },
          { name: 'Pregnancy', description: 'Pregnancy-related resources and guidance' },
          { name: 'Postpartum', description: 'Postpartum-related resources and guidance' },
          { name: 'Breastfeeding', description: 'Breastfeeding support and resources' },
          { name: 'Nutrition', description: 'Postpartum nutrition and meal planning' },
          { name: 'Mental Health', description: 'Mental health and emotional wellness resources' },
          { name: 'Physical Recovery', description: 'Physical recovery and exercise resources' },
          { name: 'Newborn Care', description: 'Newborn care and parenting resources' },
          { name: 'Self-Care', description: 'Self-care and wellness resources' },
        ];

        await Category.insertMany(defaultCategories);
        logger.info(`Seeded ${defaultCategories.length} default categories`);
      } else {
        logger.info(`Database already has ${categoryCount} categories`);
      }
    } catch (error) {
      logger.error('Error seeding categories:', error);
    }

    // Seed blog posts and resources if none exist
    try {
      await seedContent();
    } catch (error) {
      logger.error('Error seeding content:', error);
    }
  } catch (err) {
    logger.error(`MongoDB connection error: ${err}`);
  }
};

void connectDatabase();

// Security Middleware
// Note: For API servers serving JSON, we disable CSP at the global level
// CSP is mainly for protecting HTML pages from XSS, not needed for JSON APIs
// We keep CSP enabled only for Swagger UI (see swaggerCSPMiddleware below)
// Security Note: CSP disabled for JSON API endpoints is safe because:
// 1. JSON responses cannot execute JavaScript (unlike HTML)
// 2. XSS attacks require HTML/JavaScript injection, which JSON prevents
// 3. CSP is still enabled for Swagger UI (HTML) via swaggerCSPMiddleware
app.use(
  helmet({
    // Security hotspot reviewed: CSP disabled intentionally for JSON-only API
    // This is safe as JSON cannot execute scripts, and CSP is enabled for HTML endpoints
    contentSecurityPolicy: false,
  })
);
app.use(compression());

// Extend allowed origins to cover Vite dev/preview servers and make it easy to override via env var list
const allowedOriginsSet = new Set<string>(
  (
    process.env.CORS_ALLOWED_ORIGINS ??
    [
      process.env.FRONTEND_URL ?? 'https://www.lunaracare.org',
      'https://www.lunaracare.org',
      'https://lunaracare.org',
      'http://localhost:3000',
      'http://localhost:5000', // Backend (local dev) for Swagger UI
      'http://localhost:10000', // Backend (Docker) for Swagger UI
      'http://localhost:5173', // Vite dev default
      'http://localhost:4173', // Vite preview default
      'http://127.0.0.1:5173', // Vite dev via 127.0.0.1
      'http://127.0.0.1:10000', // Backend (Docker) via 127.0.0.1
      'https://lunara.onrender.com',
    ].join(',')
  )
    .split(',')
    .map(o => o.trim())
    .filter(Boolean)
);

app.use(
  cors({
    origin: (origin, callback) => {
      // allow requests with no origin (like mobile apps, curl, etc.)
      if (!origin) return callback(null, true);
      if (allowedOriginsSet.has(origin)) {
        return callback(null, true);
      }
      try {
        const url = new URL(origin);
        if (
          url.protocol === 'https:' &&
          (url.hostname.endsWith('.vercel.app') ||
            url.hostname === 'lunaracare.org' ||
            url.hostname.endsWith('.lunaracare.org'))
        ) {
          return callback(null, true);
        }
      } catch {
        // invalid origin URL
      }
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Rate Limiting - More lenient for development
const isProduction = process.env.NODE_ENV === 'production';
// Localhost IP addresses - configurable via environment variables for flexibility.
// Defaults below are well-known localhost representations; used only to skip rate limiting in dev.
const WELL_KNOWN_LOCALHOST_IPV4 = '127.0.0.1'; // NOSONAR - localhost for dev rate-limit skip
const WELL_KNOWN_LOCALHOST_IPV6 = '::1'; // NOSONAR - localhost for dev rate-limit skip
const WELL_KNOWN_LOCALHOST_IPV4_MAPPED = '::ffff:127.0.0.1'; // NOSONAR - IPv4-mapped localhost for dev skip
const LOCALHOST_IPV4 = process.env.LOCALHOST_IPV4 ?? WELL_KNOWN_LOCALHOST_IPV4;
const LOCALHOST_IPV6 = process.env.LOCALHOST_IPV6 ?? WELL_KNOWN_LOCALHOST_IPV6;
const LOCALHOST_IPV4_MAPPED_PREFIX =
  process.env.LOCALHOST_IPV4_MAPPED_PREFIX ?? WELL_KNOWN_LOCALHOST_IPV4_MAPPED;

const isLocalhost = (ip: string | undefined): boolean => {
  if (!ip) return false;
  return (
    ip === LOCALHOST_IPV4 || ip === LOCALHOST_IPV6 || ip.startsWith(LOCALHOST_IPV4_MAPPED_PREFIX)
  );
};

if (process.env.RATE_LIMIT_DISABLED === 'true' && !isProduction) {
  logger.info('Rate limiting disabled for development');
} else {
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: isProduction ? 100 : 1000, // 1000 requests in dev, 100 in prod
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    // Skip rate limiting for localhost in development
    skip: (req): boolean => {
      if (isProduction) {
        return false;
      }
      return isLocalhost(req.ip);
    },
  });
  app.use('/api', limiter);
}

// Security middleware
app.use(securityHeaders);

// Cookie parser — required for httpOnly refresh-token cookies
app.use(cookieParser());

// Body Parsing Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request sanitization
app.use(sanitizeRequest);

// Logging – pipe HTTP logs through Winston
app.use(
  morgan('combined', { stream: { write: (message: string) => logger.info(message.trim()) } })
);

// Passport middleware
app.use(passport.initialize());

// Swagger Documentation
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'LUNARA API',
      version: '1.0.0',
      description: 'Postpartum Support Platform API',
    },
    servers: [
      {
        url: process.env.API_URL ?? 'http://localhost:5000/api',
        description: 'Local development',
      },
      {
        url: 'https://lunara.onrender.com/api',
        description: 'Production (Render)',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description:
            'Enter your JWT token in the format: your-token-here (without "Bearer" prefix)',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/routes/**/*.ts', './src/models/**/*.ts'],
};

const specs = swaggerJsdoc(swaggerOptions);

// FIXED: Proper CSP middleware function
function swaggerCSPMiddleware(_req: Request, res: Response, next: NextFunction): void {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline'; " +
      "style-src 'self' 'unsafe-inline'; " +
      "img-src 'self' data:; " +
      "font-src 'self'; " +
      "connect-src 'self'; " +
      "object-src 'none'; " +
      "frame-src 'none'; " +
      "base-uri 'self'; " +
      "form-action 'self';"
  );
  next();
}

// FIXED: Separate middleware registration to avoid type conflicts
app.use('/api-docs', swaggerCSPMiddleware);
app.use('/api-docs', ...swaggerUi.serve);
app.get('/api-docs', swaggerUi.setup(specs));

// Routes
app.use('/api/auth', authRouter);
app.use('/api/auth/mfa', mfaRouter);
app.use('/api/users', usersRouter);
app.use('/api/providers', providersRouter);
app.use('/api/client', clientRouter);
app.use('/api/public', publicRouter);
app.use('/api/appointments', appointmentsRouter);
app.use('/api/messages', messagesRouter);
app.use('/api/resources', resourcesRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/checkins', checkinsRouter);
app.use('/api/blog', blogRouter);
app.use('/api/documents', documentsRouter);
app.use('/api/recommendations', recommendationsRouter);
app.use('/api/files', filesRouter);
app.use('/api/intake', intakeRouter);
app.use('/api/care-plans', carePlansRouter);
app.use('/api/admin', adminRouter);
app.use('/api/interactions', interactionsRouter);
app.use('/api/push', pushNotificationsRouter);

// Health Check
app.get('/api/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV ?? 'development',
  });
});

// Socket.io for real-time messaging
interface MessageData {
  conversationId: string;
  message: string;
  sender: string;
  receiver: string;
  type?: 'text' | 'image' | 'file' | 'appointment_request' | 'system';
}

// JWT auth for Socket.io: require a valid access token on connection
io.use((socket, next) => {
  try {
    // Check both auth and query for the token — socket.io clients use handshake.auth,
    // but older browser-based transports (long-polling) fall back to query params.
    const auth = socket.handshake.auth as { token?: string };
    const query = socket.handshake.query as Record<string, string | undefined>;
    const token = auth?.token || query?.token;

    if (!token || typeof token !== 'string') {
      logger.warn(`Socket ${socket.id} missing JWT token`);
      next(new Error('Authentication error: missing token'));
      return;
    }

    const payload = verifyAccessToken(token);
    // Attach user context to socket for later use
    socket.data.userId = payload.id;
    socket.data.role = payload.role;

    next();
  } catch (err) {
    logger.warn(`Socket ${socket.id} failed JWT verification: ${String(err)}`);
    next(new Error('Authentication error: invalid or expired token'));
  }
});

io.on('connection', socket => {
  const userId =
    typeof socket.data.userId === 'string' ? (socket.data.userId as string) : undefined;
  logger.info(`Socket connected: ${socket.id} (user: ${userId ?? 'unknown'})`);

  // User joins their own room; userId is taken from JWT, not trusted client input
  socket.on('join_user_room', () => {
    const authedUserId =
      typeof socket.data.userId === 'string' ? (socket.data.userId as string) : undefined;
    if (!authedUserId) {
      logger.warn(`Socket ${socket.id} attempted to join user room without auth context`);
      socket.emit('auth_error', { error: 'Not authenticated' });
      return;
    }
    socket.join(authedUserId);
    socketConnectionManager.addConnection(authedUserId, socket);
    logger.info(`User ${authedUserId} joined their personal room via socket ${socket.id}`);
  });

  socket.on('join_conversation', async (conversationId: string) => {
    if (!conversationId) {
      logger.warn(`Socket ${socket.id} attempted to join conversation with empty id`);
      return;
    }
    const authedUserId = typeof socket.data.userId === 'string' ? socket.data.userId : undefined;
    if (!authedUserId) {
      socket.emit('auth_error', { error: 'Not authenticated' });
      return;
    }

    // Verify user is a participant in this conversation
    const isParticipant = await Message.exists({
      conversationId,
      $or: [{ sender: authedUserId }, { receiver: authedUserId }],
    });

    if (!isParticipant) {
      logger.warn(`Socket ${socket.id} (user ${authedUserId}) denied join to conversation ${conversationId}`);
      socket.emit('message_error', { error: 'Not a participant in this conversation' });
      return;
    }

    socket.join(conversationId);
    logger.info(`Socket ${socket.id} joined conversation ${conversationId}`);
  });

  socket.on('send_message', async (messageData: MessageData) => {
    try {
      const { conversationId, message, sender, receiver, type } = messageData;

      if (!conversationId || !sender || !receiver || !message) {
        socket.emit('message_error', { error: 'Invalid message payload' });
        return;
      }

      const authedUserId =
        typeof socket.data.userId === 'string' ? (socket.data.userId as string) : undefined;
      if (!authedUserId) {
        logger.warn(`Socket ${socket.id} attempted to send message without auth context`);
        socket.emit('auth_error', { error: 'Not authenticated' });
        return;
      }

      if (sender !== authedUserId) {
        logger.warn(
          `Socket ${socket.id} attempted to spoof sender id (${sender}) for user ${authedUserId}`
        );
        socket.emit('message_error', { error: 'Sender mismatch' });
        return;
      }

      // Verify sender-receiver relationship
      const senderUser = await User.findById(sender);
      const receiverUser = await User.findById(receiver);
      if (!senderUser || !receiverUser) {
        socket.emit('message_error', { error: 'Invalid sender or receiver' });
        return;
      }
      const senderRole = senderUser.role;
      const hasRelationship =
        senderRole === 'admin' ||
        receiverUser.role === 'admin' ||
        (senderRole === 'provider' && await Client.exists({ userId: receiver, assignedProvider: sender })) ||
        (senderRole === 'client' && await Client.exists({ userId: sender, assignedProvider: receiver }));
      if (!hasRelationship) {
        socket.emit('message_error', { error: 'No relationship with receiver' });
        return;
      }

      // Rate limit per authenticated user
      if (isRateLimited(authedUserId)) {
        logger.warn(`Rate limit exceeded for user ${authedUserId} on socket ${socket.id}`);
        socket.emit('rate_limit', {
          error: 'Too many messages, please slow down',
          windowMs: MESSAGE_WINDOW_MS,
          max: MESSAGE_MAX_PER_WINDOW,
        });
        return;
      }

      const doc = new Message({
        conversationId,
        sender,
        receiver,
        content: message,
        type: type ?? 'text',
        read: false,
      });

      await doc.save();

      const payload = {
        // Use String(...) to avoid calling toString on an 'unknown' _id type
        id: String(doc._id),
        conversationId: doc.conversationId.toString(),
        sender: doc.sender.toString(),
        receiver: doc.receiver.toString(),
        content: doc.content,
        type: doc.type,
        read: doc.read,
        createdAt: doc.createdAt,
      };

      // Emit to all users in the conversation room
      io.to(payload.conversationId).emit('new_message', payload);

      // Also emit to receiver's personal room so they can get notifications
      io.to(payload.receiver).emit('new_message_notification', payload);

      logger.info('Socket message persisted and broadcast', {
        messageId: payload.id,
        conversationId: payload.conversationId,
        sender: payload.sender,
        receiver: payload.receiver,
      });

      // Confirm delivery back to sender
      socket.emit('message_delivered', {
        messageId: payload.id,
        conversationId: payload.conversationId,
        receiverId: payload.receiver,
        deliveredAt: new Date().toISOString(),
      });
    } catch (error) {
      logger.error(`Error sending message via Socket.io: ${String(error)}`);
      socket.emit('message_error', { error: 'Failed to send message' });
    }
  });

  socket.on('disconnect', () => {
    socketConnectionManager.removeConnection(socket.id);
    logger.info(`Socket disconnected: ${socket.id}`);
  });
});

// 404 Handler - must run before error handler (catches unmatched routes)
app.use(notFoundHandler);

// Centralized error handler - handles APIError, Mongoose, JWT, and generic errors
app.use(errorHandler);

// ── Process-level crash handlers ────────────────────────────────────────────
process.on('unhandledRejection', (reason: unknown) => {
  logger.error('Unhandled Rejection:', reason);
  // Let the process exit so the orchestrator (Docker/Render) can restart it
  process.exit(1);
});

process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// FIXED: Proper port binding for Render
const PORT = Number.parseInt(process.env.PORT ?? '', 10) || 10000;

server.listen(PORT, '0.0.0.0', () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`API Documentation available at http://localhost:${PORT}/api-docs`);

  // Start appointment reminder scheduler
  startReminderScheduler();
});

// Make io globally available for document notifications
// Socket.io instance shared via globalThis for document/blog notification helpers
(globalThis as unknown as { io: typeof io }).io = io;

export { app, server, io };
