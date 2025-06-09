FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Set build-time environment variables
ARG NEXT_PUBLIC_USER_SERVICE_URL=http://211.188.63.186:31207
ARG NEXT_PUBLIC_PRODUCT_SERVICE_URL=http://211.188.63.186:31251
ARG NEXT_PUBLIC_ENVIRONMENT=production
ARG NEXT_PUBLIC_APP_VERSION=2.0.0

# Build the application with environment variables
RUN npm run build

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"] 