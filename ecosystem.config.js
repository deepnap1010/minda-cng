// PM2 process file for JFE TraceLine (production / staging).
// Build first:  npm run build
// Start:        pm2 start ecosystem.config.js
// The API serves on PORT (default 4000). Serve the built client (client/dist)
// behind nginx or any static host, or wire it into the JPM platform infra.
module.exports = {
  apps: [
    {
      name: 'jfe-traceline-api',
      cwd: './server',
      script: 'dist/index.js',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
      },
      // PM2 will inherit the process env; keep secrets in the root .env or the
      // host environment rather than committing them here.
      time: true,
    },
  ],
};
