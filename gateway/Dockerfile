FROM node:16
WORKDIR /usr/src/app

# Copy package.json from the gateway directory
COPY gateway/package*.json ./

# Install dependencies
RUN npm install

# Copy the gateway source code
COPY gateway/ .

# Copy the proto definitions
COPY proto/ /usr/src/app/proto/

EXPOSE 3000
CMD ["node", "gateway.js"]
