// Custom Error class for operational errors (request errors, db rejections)
class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.status = (this.statusCode >= 400 && this.statusCode < 500) ? 'fail' : 'error';
        this.isOperational = true;
        Error.captureStackTrace(this, AppError);
    }
}

module.exports = AppError;