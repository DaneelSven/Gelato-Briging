# The base node image
FROM node:16-alpine as builder

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json (or yarn.lock)
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install

# Copy the rest of the code
COPY . .

# Build the app
RUN npm run build

# Start a new stage for a smaller final image
FROM node:16-alpine

# Set the working directory
WORKDIR /app

# Copy over the built app and node_modules from the builder stage
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/public ./public

# Set the command to start the node server
CMD ["npm", "start"]

# Expose the port Next.js runs on
EXPOSE 3000
