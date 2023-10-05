# Use an official Node runtime as the parent image
FROM node:14

# Set the working directory in the container to /app
WORKDIR /app

# Copy the package.json and package-lock.json to the container at /app
COPY package*.json /app/

# Install any needed packages specified in package.json
RUN npm install

# Bundle app source into the docker image
COPY . /app/

# Make port 8080 available to the world outside this container
EXPOSE 9000

# Run app.js when the container launches
CMD ["node", "main.js"]
