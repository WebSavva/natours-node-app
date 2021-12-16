// SETTING UP ROOT ALIAS
require('module-alias/register');

const mongoose = require('mongoose');

process.on('uncaughtException', (reason) => {
  console.error('UNHANDLED EXCEPTION');
  console.error(reason);
  process.exit(1);
});

const app = require('@/app');

// connecting the database
mongoose.connect(process.env.DB_LINK).then(() => {
  console.log('Connection with DB has been established !');
});

// start it the server
const server = app.listen(process.env.PORT, () => {
  console.log(`Server is up and running on port ${process.env.PORT}`);
});

process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION');
  console.error(err);

  server.close(() => {
    process.exit(1);
  });
});
