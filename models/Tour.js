const mongoose = require('mongoose');
const slugify = require('slugify');

const TourSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'The tour must have a unique name'],
      unique: true,
      trim: true,
      minlength: [
        10,
        'The name "{VALUE}" has length shorter than 10 characters',
      ],
      maxlength: [
        50,
        'The name "{VALUE}" has length longer than 50 characters',
      ],
      validate: {
        validator: function (val) {
          return !/\d/i.test(val);
        },

        message: 'The name cannot contain any digits',
      },
    },

    price: {
      type: Number,
      required: [true, 'The tour must have a price of numeric type'],
    },

    priceDiscount: {
      type: Number,
      default: false,
      validate: {
        // custom validators run only before creation of the given document. Update does not trigger them. An Important note!
        validator: function (val) {
          return val < this.price;
        },
        message:
          'The price discount {VALUE} cannot be higher than the price itself',
      },
    },
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false,
    },

    rating: {
      type: Number,
      default: 4.5,
      min: [1, 'The rating must be at least 1 point'],
      max: [5, 'The rating must not exceed the value of 5 points'],
    },

    ratingsAverage: {
      type: Number,
      default: 4.5,
    },

    ratingsQuantity: {
      type: Number,
      default: 6,
    },

    duration: {
      type: Number,
      required: true,
    },

    maxGroupSize: Number,
    images: [String],

    description: {
      type: String,
      trim: true,
    },

    imageCover: {
      type: String,
      trim: true,
      required: true,
    },

    startDates: [Date],

    summary: {
      type: String,
      required: true,
      trim: true,
    },

    difficulty: {
      type: String,
      required: true,
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message:
          'The dificculy must be either of the following options: easy, medium, difficult',
      },
    },

    isSecret: {
      type: Boolean,
      default: false,
    },

    slug: {
      type: String,
    },

    //GEO JSON
    startLocation: {
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'], // may include other figure types, e.g. polygons and paths
      },
      coordinates: [Number],
      address: String,
      description: String,
    },

    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'], // may include other figure types, e.g. polygons and paths
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],

    // CHILD REFERENCING
    guides: [
      {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    toJSON: {
      virtuals: true,
    },
  }
);

//virtual properties
TourSchema.virtual('durationWeeks').get(function () {
  return +(this.duration / 7).toFixed(2);
});


// VIRTUAL POPULATE
TourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id',
});

// Index to enable geospatial search
TourSchema.index({
  startLocation: '2dsphere'
});

// MongoDB middleware

// DOCUMENT MIDDLEWARE
// runs only for create() and save(). There are multiple limitations regarding the methods the call of which triggers a middleware.
TourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, {
    lower: true,
  });

  next();
});

TourSchema.post('save', function (doc, next) {
  console.log(
    `The tour with the name ${this.name} has been saved successfully!`
  );
  next();
});

// QUERY MIDDLEWARE
TourSchema.pre(/^find/i, function (next) {
  this.find({
    isSecret: { $ne: true },
  }).populate({
    path: 'guides',
    select: {
      __id: 1,
      email: 1,
      name: 1,
    },
  });

  next();
});

// AGGREGATE MIDDLEWARE
TourSchema.pre('aggregate', function (next) {
  // selecting only non-secret tours
  this.pipeline().unshift({
    $match: {
      isSecret: { $ne: true },
    },
  });
});

module.exports = mongoose.model('Tour', TourSchema);
