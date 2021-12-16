const express = require("express");
const reviewsRouter = require("@/routes/reviews");
const {
  getTour,
  getTours,
  addTour,
  updateTour,
  deleteTour,
  selectTop,
  getStats,
  getPlan,
  getToursWithin,
  getTourDistances,
} = require("@/controllers/tours");

const { authenticateUser, roleGuard } = require("@/controllers/authentication");

const toursRouter = express.Router();

// // middleware to check whether a requested tour does exist or not
// toursRouter.param('id', checkTour);

// NESTED ROUTE IN ORDER TO AVOID BOILERPLATE CODE
toursRouter.use("/:tourId/reviews", reviewsRouter);

toursRouter.route("/").get(getTours);

toursRouter.route('tours-within/distance/:distance/location/:location/unit/:unit').get(getToursWithin);

toursRouter.route('/distances/:location/unit/:unit').get(getTourDistances);

toursRouter.route("/top").get(selectTop, getTours);

toursRouter.route("/stats").get(getStats);

toursRouter.route("/:id").get(getTour);

// Protected routes
toursRouter.use(authenticateUser);
toursRouter.route("/plan/:year").get(getPlan);

toursRouter.use(roleGuard('admin', 'guide', 'lead-guide'));
toursRouter.route("/").post(addTour);
toursRouter.route("/:id").patch(updateTour).delete(deleteTour);

module.exports = toursRouter;
