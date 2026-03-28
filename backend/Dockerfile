# Node.js Production Dockerfile for TypeScript Backend
FROM node:20-alpine AS build

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev for TypeScript compilation)
RUN npm ci

# Copy source code and config
COPY tsconfig.json tsconfig.build.json ./
COPY src ./src

# Build TypeScript to JavaScript
RUN npm run build

# Create runtime stage
FROM node:20-alpine AS runtime

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy compiled JavaScript from build stage
COPY --from=build /app/dist ./dist

# Copy TypeScript sources for Swagger/OpenAPI docs
# (swagger-jsdoc reads annotations from ./src/**/*.ts)
COPY --from=build /app/src ./src

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S lunara -u 1001 -G nodejs

# Change ownership
RUN chown -R lunara:nodejs /app
USER lunara

# Expose port (matches server.ts PORT default)
EXPOSE 10000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:10000/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the application
CMD ["npm", "start"]
