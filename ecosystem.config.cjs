// eslint-disable-next-line no-undef
module.exports = {
  apps: [
    {
      name: 'bodo-server',
      script: './server',
      interpreter: 'none',
      exec_mode: 'fork',
      max_memory_restart: '512M',
      autorestart: true,
      restart_delay: 5000,
      max_restarts: 10,
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
}
