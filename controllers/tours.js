const catchAsync = require("@/utils/catchAsync");
const Tour = require("@/models/Tour");
const AppError = require("@/utils/AppError");
const handlerFactory = require("@/controllers/handlerFactory");
const DBHandler = require("../utils/dbHandler");

exports.selectTop = (req, res, next) => {
  req.query = {
    sort: "-" + (req.query.criterion || "price"),
    limit: 3,
    ...(req.query.fields && { fields: req.query.fields }),
  };

  next();
};

exports.getTours = handlerFactory.getSendAllDocumentsHandler(Tour);

exports.addTour = handlerFactory.getCreateHandler(Tour);

exports.getTour = handlerFactory.getSendDocumentHandler(Tour, (query) =>
  query.populate({
    path: "reviews",
    select: {
      user: 1,
      text: 1,
      createdAt: 1,
    },
  })
);

exports.updateTour = handlerFactory.getUpdateHandler(Tour);

exports.deleteTour = handlerFactory.getDeleteHandler(Tour)

exports.getStats = catchAsync(async (req, res) => {
  const pipeline = Tour.aggregate([
    {
      $match: {
        rating: { $gte: 3.5 },
      },
    },
    {
      $group: {
        _id: { $toUpper: "$difficulty" }, // aggregation field
        count: { $sum: 1 },
        avgPrice: { $avg: "$price" },
        avgRating: { $avg: "$rating" },
        maxPrice: { $max: "$price" },
        minPrice: { $min: "$price" },
      },
    },
    {
      $sort: {
        avgPrice: 1,
      },
    },
  ]);

  const stats = await pipeline;

  res.status(200).json({
    status: "success",
    data: stats,
  });
});

exports.getPlan = catchAsync(async (req, res) => {
  const year = +req.params.year || new Date().getFullYear();

  const pipeline = Tour.aggregate([
    {
      $unwind: "$startDates",
    },
    {
      $match: {
        startDates: {
          $gte: new Date(year),
          $lte: new Date(year, 11, 31),
        },
      },
    },
    {
      $group: {
        _id: { $month: "$startDates" },
        count: { $sum: 1 },
        tours: { $push: "$name" },
      },
    },
    {
      $addFields: {
        month: "$_id",
      },
    },
    {
      $project: {
        _id: 0,
      },
    },
    {
      $sort: {
        month: 1,
      },
    },
  ]);

  const plan = await pipeline;

  res.status(200).json({
    status: "success",
    data: plan,
  });
});


exports.getToursWithin = catchAsync( async (req, res, next) => {
  const {
    distance,
    location,
    unit
  } = req.params;

  const [lat, lng] = location.split(',');

  if (!lat || !lng) return next(new AppError('Location must be provided', 400));

  const radius = distance / (unit === 'mi' ? 3963.2 : 6378.1);

  const toursWithin = await Tour.find({
    startLocation: {
      $geoWithin: { $centerSphere: [[lng, lat], radius] },
    },
  });

  res.status(200).json({
    status: 'success',
    data: toursWithin,
  });
});

exports.getTourDistances = catchAsync( async (req, res, next) => {
  const {
    location,
    unit,
  } = req.params;

  const [lng, lat] = location.split(',');

  if (!lng || !lat) return next(new AppError('Please, provide correct location', 400));
  
  const multiplier = unit === 'mi' ? .00006721 : .001;

  const tourDistances = await Tour.aggregate({
    $geoNear: {
      near: {
        type: 'Point',
        location: [+lat, +lng],
        distanceField: 'distance',
        distanceMultiplier: multiplier,
      },
      
      $project: {
        distance: 1,
        name: 1,
      },
    },
  });

  res.status(200).json({
    status: 'success',
    data: tourDistances,
  });
});