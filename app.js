const dotenv = require('dotenv');
const expandDotenv = require('dotenv-expand');
const path = require('path');
const express = require('express');
const hpp = require('hpp');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xssClean = require('xss-clean');

const AppError = require('@/utils/AppError');
const errorController = require('@/controllers/errorMiddleware');
const toursRouter = require('@/routes/tours');
const usersRouter = require('@/routes/users');
const reviewsRouter = require('@/routes/reviews');

expandDotenv(dotenv.config());

const app = express();
process.env.IS_DEV = process.env.NODE_ENV === 'development';


// middlewares
if (process.env.IS_DEV) {
    const morgan = require('morgan');
    app.use(morgan('dev'));
}

// HTTP SECURITY HEADERS
app.use(helmet());

// RATE LIMIT FOR IP-ADRESSES
app.use('api', rateLimit({
    max: 100,
    windowMs: 60 * 60 * 1e3,
    message: 'Too many requests. Please, retry later on.'
}));

// NO SQL INJECTION PREVENTION
app.use(mongoSanitize());

// XSS-ATTACK PREVENTION
app.use(xssClean());

// QUERY PARAMS POLLUTION PREVENTION
app.use(hpp());

// BASIC SERVER SETUP CONFIGURATION
app.use(express.json({ limit: '10kb' }));
app.use(express.static('public'));

// API ROUTES
app.use('/api/v1/tours', toursRouter);
app.use('/api/v1/users', usersRouter);
app.use('/api/v1/reviews', reviewsRouter);

app.all('*', (req, res, next) => {
    next(new AppError(`The path with ${req.originalUrl} is not found`, 400));
});

app.use(errorController);

module.exports = app;