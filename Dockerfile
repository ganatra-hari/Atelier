# Use a standard Node image
FROM node:18-alpine

# Set the working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of your app code
COPY . .

# Expose the port (Render usually uses 10000, but adapts)
EXPOSE 10000

# Start the app
CMD ["npm", "start"]