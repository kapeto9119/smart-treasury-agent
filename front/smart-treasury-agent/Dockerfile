FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Accept build arguments for Next.js public env vars
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_WORKOS_CLIENT_ID

# Set them as environment variables for the build
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_WORKOS_CLIENT_ID=$NEXT_PUBLIC_WORKOS_CLIENT_ID

# Build Next.js app with env vars
RUN npm run build

# Expose port
EXPOSE 3000

# Start application
CMD ["npm", "start"]

