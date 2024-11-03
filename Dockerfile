# Stage 1: Build Stage
FROM node:18 AS builder

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install only production dependencies
RUN npm install --only=production

# Install Typescript to transpile TypeScript code (only for the build stage)
RUN npm install --save-dev typescript

# Copy the rest of the application code to the working directory
COPY . .

# Build the TypeScript code
RUN npx tsc

# Stage 2: Run Stage
FROM node:18-slim

# Set the working directory
WORKDIR /usr/src/app

# Copy only the production dependencies from the builder stage
COPY --from=builder /usr/src/app/node_modules ./node_modules

# Copy the transpiled application code from the builder stage
COPY --from=builder /usr/src/app/dist ./dist

# Expose port 3000
EXPOSE 3000

# Define the command to run the application
CMD [ "node", "dist/index.js" ]
