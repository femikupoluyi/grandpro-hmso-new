module.exports = {
  apps: [
    {
      name: 'grandpro-backend',
      script: './backend/src/server.js',
      cwd: '/root/grandpro-hmso-new',
      env: {
        NODE_ENV: 'production',
        PORT: 5001,
        DATABASE_URL: "postgresql://neondb_owner:npg_InhJz3HWVO6E@ep-solitary-recipe-adrz8omw-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require",
        DIRECT_URL: "postgresql://neondb_owner:npg_InhJz3HWVO6E@ep-solitary-recipe-adrz8omw.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require",
        JWT_SECRET: "grandpro-hmso-secret-key-2024"
      },
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      time: true
    },
    {
      name: 'grandpro-frontend',
      script: 'npx',
      args: 'serve -s dist -l 3000',
      cwd: '/root/grandpro-hmso-new/frontend',
      env: {
        NODE_ENV: 'production'
      },
      error_file: '../logs/frontend-error.log',
      out_file: '../logs/frontend-out.log',
      time: true
    }
  ]
};
