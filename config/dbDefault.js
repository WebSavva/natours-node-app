const flatry = require('../utils/flatry');
const mongoose = require('mongoose');
const Tour = require('../models/Tour');
const User = require('../models/User');
const Review = require('../models/Review');
const dotenv = require('dotenv');
const expandDotenv = require('dotenv-expand');
const defaultUsers = require('../dev-data/data/users.json');
const defaultTours = require('../dev-data/data/tours.json');
const defaultReviews = require('../dev-data/data/reviews.json');
expandDotenv(dotenv.config());

const dataConfig = {
  '--users': {
    model: User,
    defaultData: defaultUsers,
  },

  '--tours': {
    model: Tour,
    defaultData: defaultTours,
  },

  '--reviews': {
    model: Review,
    defaultData: defaultReviews,
  },
};

const insertData = async (modelName) => {

  const [dbErr, result] = await flatry(
    dataConfig[modelName].model.create(dataConfig[modelName].defaultData, {
      validationBeforeSave: false,
    })
  );

  if (dbErr) {
    console.error(dbErr.message);
  } else {
    console.info('Successful DB population');
  }

  process.exit();
};

const deleteData = async (modelName) => {
  try {
    await dataConfig[modelName].model.deleteMany({});
    console.log('Deleted succesfully');
  } catch (error) {
    console.error(error.message);
  } finally {
    process.exit();
  }
};

// connecting the database
mongoose.connect(process.env.DB_LINK).then(async () => {
  const modelName = process.argv[3] ?? '--tours';

  if (process.argv[2] === '--import') {
    await insertData(modelName);
  } else if (process.argv[2] === '--delete') {
    await deleteData(modelName);
  }
});
