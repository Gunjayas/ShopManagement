export default {
  apps: [
    {
      name: 'shop-management',
      script: 'server/dist/server/index.js',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};