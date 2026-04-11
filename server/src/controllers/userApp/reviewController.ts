import { RequestHandler } from "express";
import ReviewModel from "../../models/userApp/reviews";

/**
 * Add Review
 */
export const addReview: RequestHandler = async (req, res) => {
  try {
    const { pooja_id, user_id, rating, review_text ,pooja_booking_id} = req.body;

    if (!pooja_id || !user_id || !rating || !review_text) {
      res.status(400).json({
        success: false,
        message: "All fields are required",
      });
      return;
    }

    const review = await ReviewModel.create({
      pooja_id,
      user_id,
      rating,
      review_text,
      pooja_booking_id,
    });

    res.status(201).json({
      success: true,
      message: "Review added successfully",
      data: review,
    });
  } catch (error: any) {
    if (error.code === 11000) {
      res.status(409).json({
        success: false,
        message: "You have already reviewed this pooja",
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: "Failed to add review",
    });
  }
};

/**
 * Get Reviews By Pooja ID
 */
export const getReviewsByPoojaId: RequestHandler = async (req, res) => {
  try {
    const { pooja_id } = req.params;

    const reviews = await ReviewModel.find({ pooja_id }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      count: reviews.length,
      data: reviews,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch reviews",
    });
  }
};



/**
 * Get Reviews By Booking ID (pooja_booking_id)
 */
export const getReviewsByBookingId: RequestHandler = async (req, res) => {
  try {
    const { pooja_booking_id } = req.params;

    if (!pooja_booking_id) {
      res.status(400).json({
        success: false,
        message: "pooja_booking_id is required",
      });
      return;
    }

    const reviews = await ReviewModel.find({ pooja_booking_id }).sort({
      createdAt: -1,
    });

    const avgRating =
      reviews.length > 0
        ? reviews.reduce((sum, r) => sum + Number(r.rating || 0), 0) /
          reviews.length
        : 0;

    res.status(200).json({
      success: true,
      count: reviews.length,
      avgRating,
      data: reviews,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch reviews by booking id",
    });
  }
};
