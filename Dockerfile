FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Set build-time environment variables
ARG NEXT_PUBLIC_USER_SERVICE_URL=http://211.188.63.186:31250
ARG NEXT_PUBLIC_PRODUCT_SERVICE_URL=http://211.188.63.186:31251

# Build the application with environment variables
RUN npm run build

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"] 