import { Request, Response, NextFunction } from "express";
import AddressModel, { IPanditAddress } from "../../models/panditApp/panditAddressModel";

/* ------------------------------------------------------------ */
/*  Utility: async wrapper                                      */
/* ------------------------------------------------------------ */
const asyncHandler =
  <T>(fn: (req: Request, res: Response, next: NextFunction) => Promise<T>) =>
  (req: Request, res: Response, next: NextFunction) =>
    fn(req, res, next).catch(next);

/* Helper to count addresses for a pandit */
const countByPandit = (panditId: string) =>
  AddressModel.countDocuments({ pandit: panditId });

/* ------------------------------------------------------------ */
/*  CREATE                                                      */
/* ------------------------------------------------------------ */
export const addPanditAddress = asyncHandler(async (req, res) => {
  const { panditId } = req.params;               // path param
  const {
    addressLine1,
    addressLine2,
    city,
    state,
    country,
    latitude,
    longitude,
    addressName,
    pincode,
  } = req.body as Partial<IPanditAddress>;

  /* basic validation */
  if (
    !addressLine1 ||
    !city ||
    !state ||
    latitude === undefined ||
    longitude === undefined ||
    !pincode
  ) {
    return res.status(400).json({ message: "Missing required fields." });
  }

  const total = await countByPandit(panditId);
  if (total >= 2) {
    return res
      .status(400)
      .json({ message: "Maximum of two addresses reached." });
  }

  const isPrimary = total === 0; // first address => primary

  const address = await AddressModel.create({
    pandit: panditId,
    addressLine1,
    addressLine2,
    city,
    state,
    country,
    latitude,
    longitude,
    addressName,
    pincode,
    isPrimary,
  });

  res.status(201).json(address);
});

/* ------------------------------------------------------------ */
/*  READ                                                        */
/* ------------------------------------------------------------ */
export const getPanditAddresses = asyncHandler(async (req, res) => {
  const { panditId } = req.params;
  const addressPandit = await AddressModel.find({ pandit: panditId }).sort({
    isPrimary: -1,
    updatedAt: -1,
  });
  res.status(200).json(addressPandit);
});

/* ------------------------------------------------------------ */
/*  UPDATE (secondary only)                                     */
/* ------------------------------------------------------------ */
export const updatePanditSecondary = asyncHandler(async (req, res) => {
  const { panditId, addressId } = req.params;
  const payload = req.body as Partial<IPanditAddress>;

  const address = await AddressModel.findOne({
    _id: addressId,
    pandit: panditId,
  });

  if (!address) {
    return res.status(404).json({ message: "Address not found." });
  }

  if (address.isPrimary) {
    return res
      .status(403)
      .json({ message: "Primary address cannot be modified." });
  }

  Object.assign(address, payload);
  await address.save();

  res.status(200).json(address);
});

/* ------------------------------------------------------------ */
/*  DELETE (secondary only)                                     */
/* ------------------------------------------------------------ */
export const deletePanditSecondary = asyncHandler(async (req, res) => {
  const { panditId, addressId } = req.params;

  const address = await AddressModel.findOneAndDelete({
    _id: addressId,
    pandit: panditId,
    isPrimary: false,             // ensure secondary
  });

  if (!address) {
    return res
      .status(404)
      .json({ message: "Secondary address not found or already removed." });
  }

  res.status(200).json({ message: "Secondary address deleted." });
});

export { asyncHandler }; // re-export for routes
