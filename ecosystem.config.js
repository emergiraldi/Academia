module.exports = {
  apps: [{
    name: 'academia',
    script: 'npm',
    args: 'start',
    cwd: 'C:\\Projeto\\Academia',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
    },
    error_file: 'C:\\Projeto\\Academia\\logs\\pm2-error.log',
    out_file: 'C:\\Projeto\\Academia\\logs\\pm2-out.log',
    log_file: 'C:\\Projeto\\Academia\\logs\\pm2-combined.log',
    time: true
  }]
};
