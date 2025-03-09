FROM node:18-alpine

# Install dependencies needed for Prisma and Next.js
RUN apk add --no-cache libc6-compat openssl

WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the app
COPY . .

# Set permissions for the prisma directory
RUN mkdir -p /app/node_modules/.prisma && \
    chmod -R 777 /app/node_modules/.prisma && \
    chmod -R 777 /app/node_modules/@prisma

# Generate Prisma client
RUN npx prisma generate

# Build the Next.js app
RUN npm run build

# Expose the port
EXPOSE 3000

# Start the app
CMD ["npm", "run", "dev"]
