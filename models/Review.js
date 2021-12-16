const mongoose = require("mongoose");
const Tour = require('@/models/Tour');

const ReviewSchema = mongoose.Schema(
  {
    rating: {
      type: Number,
      min: [1, "Your ratint cannot be less than 1"],
      max: [5, "Your ratint cannot be bigger than 5"],
      default: 3.5,
    },

    text: {
      type: String,
      required: true,
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },

    user: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "User",
      required: [true, "A review must belong to a user"],
    },

    tour: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "Tour",
      required: [true, "A review must be attached to a tour"],
    },
  },
  {
    toJSON: {
      virtuals: true,
    },

    toObject: {
      virtuals: true,
    },
  }
);

ReviewSchema.index({ user: 1, tour: 1 }, { unique: true });
ReviewSchema.pre(/^find/, function (next) {
  // to get rhid of population duplication
  // this.populate([
  //     {
  //         path: 'user',
  //         select: {
  //             email: 1,
  //             name: 1,
  //             photo: 1
  //         }
  //     },
  //     {
  //         path: 'tour',
  //     },
  // ]);

  this.populate({
    path: "user",
    select: {
      email: 1,
      name: 1,
      photo: 1,
    },
  });

  next();
});

ReviewSchema.statics.calculateAverageRating = async function(tourId) {
  const stats = await this.aggregate([
    {
      $match: {
        tour: tourId,
      }
    },
    {
      $group: {
        _id: "$tour",
        ratingsQuantity: { $sum: 1 },
        ratingsAverage: { $avg: "$rating" },
      }
    }
  ]);

  const [{
    ratingsQuantity,
    ratingsAverage,
  }] = stats;

  await Tour.findByIdAndUpdate(tourId, {
    ratingsQuantity,
    ratingsAverage,
  });
}

ReviewSchema.post('save', async function() {
  await this.constructor.calculateAverageRating(this.tour);
});

ReviewSchema.pre(/^findOneAnd/, async function(next) {
  this.updatedReview = await this.findOne();
  next();
});

ReviewSchema.post(/^findOneAnd/, async function() {
  await this.updatedReview.constructor.calculateAverageRating(this.updatedReview.tour);
})

module.exports = mongoose.model("Review", ReviewSchema);
