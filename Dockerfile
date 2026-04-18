# Use an official Node.js runtime as a parent image
FROM node:18-slim

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json (if available)
# This leverages Docker's layer caching, so dependencies are only re-installed
# when these files change.
COPY package*.json ./

# Install production dependencies
RUN npm install --production

# Copy the rest of the application's source code from the current directory
# to the working directory in the image
COPY . .

# Google Cloud Run expects the container to listen for requests on the port
# defined by the PORT environment variable. The default is 8080.
EXPOSE 8080

# Define the command to run your app
CMD [ "node", "server.js" ]
