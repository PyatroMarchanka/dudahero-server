FROM node:18

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install dependencies
RUN npm install

RUN npm install morgan winston

# If you are building your code for production
# RUN npm ci --only=production

# Copy the rest of the application code to the working directory
COPY . .

# Install Dependencies globally
RUN npm install -g typescript nodemon ts-node

# Build the TypeScript code
RUN tsc

# Make port 3000 available to the world outside this container
EXPOSE 3000

# Define the command to run the application
CMD [ "npm", "start" ]
