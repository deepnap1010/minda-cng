# Backend — JP Minda platform (Express 5 / Sequelize / Socket.io, ESM).
# Node 20 LTS on Debian slim. Build tools included so the native bcrypt module
# compiles if no prebuilt binary matches the container platform.
FROM node:20-bookworm-slim

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

# Install dependencies first for layer caching. There is no package-lock.json in
# the repo (it is gitignored), so use `npm install`, not `npm ci`.
COPY package.json ./
RUN npm install

# Copy the source. In dev, docker-compose bind-mounts the host source over this,
# keeping the container's node_modules (see the anonymous volume in compose).
COPY . .

EXPOSE 9021

# Dev server with auto-reload (nodemon). Compose can override this command.
CMD ["npm", "run", "dev"]
