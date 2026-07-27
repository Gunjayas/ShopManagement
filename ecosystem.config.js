export default {
  apps: [
    {
      name: 'shop-management',
      script: 'server/dist/server/index.js',
      cwd: '/data/data/com.termux/files/home/ShopManagement',
      env: {
        NODE_ENV: 'production',
        PORT: '3000',
        DATABASE_URL: 'file:/data/data/com.termux/files/home/ShopManagement/server/prisma/shop.db',
      },
    },
  ],
};