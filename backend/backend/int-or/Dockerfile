# Use an official Node.js runtime as a parent image
FROM node:20

# Set the working directory
WORKDIR /int-or

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy the rest of the application code
COPY . .

# Expose the port the app runs on
EXPOSE 3000

# Define environment variable for GCP
ENV PORT=3000

# Start the application
CMD ["npm", "start"]
