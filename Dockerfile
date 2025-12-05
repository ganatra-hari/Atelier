# Use a lightweight Node image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package.json first (better for caching)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of your app
COPY . .

# Expose the port your app runs on (standard is 3000 or 10000)
EXPOSE 3000

# Start the app
CMD ["npm", "start"]