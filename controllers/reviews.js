const Review = require("@/models/Review");
const catchAsync = require("@/utils/catchAsync");
const handlerFactory = require("@/controllers/handlerFactory");

exports.getReviews = handlerFactory.getSendAllDocumentsHandler(Review, (query) =>
  query.populate({
    path: "tour",
  })
);

exports.attachTourId = (req, res, next) => {
  if (req.params.tourId) req.query.tour = req.params.tourId;

  next();
};

exports.extendNewReview = (req, res, next) => {
  req.body = {
    ...req.body,
    user: req.user.id,
    ...(req.params.tourId && { tour: req.params.tourId }),
  };

  next();
};

exports.createReview = handlerFactory.getCreateHandler(Review);

exports.deleteReview = handlerFactory.getDeleteHandler(Review);
