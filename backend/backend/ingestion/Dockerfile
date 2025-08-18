# IngestionService Dockerfile
FROM node:20

# Set the working directory
WORKDIR /ingestion

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose the port your service runs on
EXPOSE 5001

# Command to start the service
CMD ["npm", "start"]
