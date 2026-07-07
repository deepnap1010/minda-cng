# Frontend — JP Minda platform (React 19 + Vite 7). Dev server on port 5180.
FROM node:20-bookworm-slim

WORKDIR /app

COPY package.json ./
RUN npm install

COPY . .

EXPOSE 5180

# --host 0.0.0.0 makes the Vite dev server reachable from the host browser.
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
