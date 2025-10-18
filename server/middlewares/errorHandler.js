// utils/responses.js is used here for consistent API responses
const { fail } = require("../utils/responses");

/**
 * Centralized Error Handling Middleware
 * This will catch any errors thrown from controllers/services
 */
function errorHandler(err, req, res, next) {
  console.error("❌ Error:", err);

  // If the error was thrown with a custom status, use it
  let statusCode = err.status || 500;
  let errorCode = err.code || "INTERNAL_ERROR";
  let message = err.message || "Something went wrong";

  // Common custom error mapping
  if (err.message === "USER_NOT_FOUND") {
    statusCode = 404;
    errorCode = "USER_NOT_FOUND";
    message = "User not found";
  } else if (err.message === "INVALID_INPUT") {
    statusCode = 400;
    errorCode = "INVALID_INPUT";
    message = "Invalid request data";
  } else if (err.message === "UNAUTHORIZED") {
    statusCode = 401;
    errorCode = "UNAUTHORIZED";
    message = "Authentication required";
  } else if (err.message === "FORBIDDEN") {
    statusCode = 403;
    errorCode = "FORBIDDEN";
    message = "You do not have permission";
  }

  res.status(statusCode).json(
    fail(errorCode, message)
  );
}

module.exports = { errorHandler };
