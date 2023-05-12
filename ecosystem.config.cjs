module.exports = {
  apps: [
    {
      name: 'Museee DB',
      script: './node_modules/.bin/json-server',
      args: `data/db.json --port 3001 --host 0.0.0.0`,
      time: true,
      watch: false,
    },
    {
      name: 'Museee Web',
      script: 'next dev',
      time: true,
      watch: false,
    },
  ],
};
