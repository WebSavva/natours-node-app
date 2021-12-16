const express = require('express');
const { authenticateUser, roleGuard } = require('@/controllers/authentication');
const {
  getReviews,
  createReview,
  deleteReview,
  extendNewReview,
  attachTourId,
} = require('@/controllers/reviews');

const reviewsRouter = express.Router({
  mergeParams: true,
});

reviewsRouter.route('/').get(attachTourId, getReviews).post(authenticateUser, extendNewReview, createReview);

reviewsRouter.route('/:id', authenticateUser, roleGuard('admin'), deleteReview);

module.exports = reviewsRouter;
