import { RequestHandler } from "express";
import mongoose from "mongoose";
import PoojaBooking from "../../models/poojaBooking/poojaBooking.model";

/**
 * GET /api/pandits/:panditId/stats
 *
 * Returns:
 * {
 *   totalPujas: number,
 *   totalIncome: number,
 *   monthlyIncome: number,
 *   currency: "INR"
 * }
 *
 * Rules:
 * - Counts only bookings that are completed (isCompleted: true)
 * - Income sums `amount` if present, otherwise falls back to `poojaPrice`
 * - monthlyIncome is for the current calendar month (local time)
 */
export const getPanditStats: RequestHandler = async (req, res, next) => {
  try {
    const { panditId } = req.params;
    if (!panditId || !mongoose.Types.ObjectId.isValid(panditId)) {
      res.status(400).json({ message: "Invalid panditId." });
      return;
    }

    // Current month window (local)
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const pid = new mongoose.Types.ObjectId(panditId);

    // Sum field: prefer `amount`, fallback `poojaPrice`
    const SUM_EXPR = { $ifNull: ["$amount", "$poojaPrice"] };

    const [agg] = await PoojaBooking.aggregate([
      {
        $match: {
          isCompleted: true,
          // Assigned pandit array contains panditId
          assignedPandit: pid,
        },
      },
      {
        $facet: {
          allTime: [
            {
              $group: {
                _id: null,
                totalPujas: { $sum: 1 },
                totalIncome: { $sum: SUM_EXPR },
              },
            },
          ],
          monthly: [
            {
              $match: {
                bookingDate: { $gte: monthStart, $lte: monthEnd },
              },
            },
            {
              $group: {
                _id: null,
                monthlyIncome: { $sum: SUM_EXPR },
              },
            },
          ],
        },
      },
      {
        $project: {
          totalPujas: { $ifNull: [{ $arrayElemAt: ["$allTime.totalPujas", 0] }, 0] },
          totalIncome: { $ifNull: [{ $arrayElemAt: ["$allTime.totalIncome", 0] }, 0] },
          monthlyIncome: { $ifNull: [{ $arrayElemAt: ["$monthly.monthlyIncome", 0] }, 0] },
        },
      },
    ]);

    res.status(200).json({
      totalPujas: agg?.totalPujas ?? 0,
      totalIncome: agg?.totalIncome ?? 0,
      monthlyIncome: agg?.monthlyIncome ?? 0,
      currency: "INR",
    });
  } catch (err) {
    next(err);
  }
};
