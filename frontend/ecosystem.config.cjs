module.exports = {
  apps: [
    {
      name: 'frontend-joalheria',
      script: 'npm',
      args: 'run dev',
      cwd: '/home/user/webapp/frontend',
      env: {
        NODE_ENV: 'development',
        PORT: 5173
      },
      watch: false,
      instances: 1,
      exec_mode: 'fork'
    }
  ]
}