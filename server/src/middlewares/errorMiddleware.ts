import { Request, Response, NextFunction, ErrorRequestHandler } from "express";
import { AppError } from "../utils/errors";

export const errorMiddleware: ErrorRequestHandler = (
  err,
  req,
  res,
  next
) => {

  let { statusCode, message } = err;

  if (!(err instanceof AppError)) {
    statusCode = err.statusCode || 500;
    message = err.message || "Internal Server Error";
  }

  // Log error for developers
  if (process.env.NODE_ENV === "development" || statusCode === 500) {
    console.error(`[ERROR] ${req.method} ${req.path} >> ${message}`);
    if (err.stack) console.error(err.stack);
  }

  res.status(statusCode).json({
    success: false,
    message,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
};
