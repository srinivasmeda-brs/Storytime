export const notFound = (req, res, next) => {
    const error = new Error('Not Found');
    res.status(404);
    next(error);
};


export const errorHandler = (err, req, res, next) => {
    // Determine status code
    const statusCode = err.statusCode || (res.statusCode === 200 ? 500 : res.statusCode);

    // Extract error message
    const errMsg = err.message || 'Server Error';

    // Send response
    res.status(statusCode).json({
        message: errMsg,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
};
