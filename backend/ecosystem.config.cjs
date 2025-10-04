module.exports = {
  apps : [{
    name: 'backend-joalheria',
    script: 'main.py',
    interpreter: '/home/user/webapp/backend/venv/bin/python3', 
    watch: false,
    env: {
      FLASK_DEBUG: '0',
      PORT: 5000
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_file: './logs/pm2-combined.log',
    time: true,
    max_restarts: 5,
    min_uptime: '10s',
    restart_delay: 4000,
    autorestart: true
  }]
};