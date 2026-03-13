import { Request, Response } from "express";
import panditModel from "../../model/panditApp/panditModel";

/**
 * Create a new Pandit
 */
export const createPandit = async (req: Request, res: Response) => {
  try {
    const {
      prefix,
      firstName,
      lastName,
      age,
      gender,
      dob,
      mobile,
      email,
      languages,
      experienceInYears,
      serviceModes,
      mobileType,
      location, // comes as string from frontend: JSON.stringify(...)
    } = req.body;

    // Basic validation
    if (
      !prefix ||
      !firstName ||
      !lastName ||
      !age ||
      !gender ||
      !dob ||
      !mobile ||
      !email ||
      !languages ||
      !experienceInYears ||
      !serviceModes
    ) {
      return res
        .status(400)
        .json({ message: "All required fields must be provided." });
    }

    // Parse arrays or objects
    let parsedLanguages: string[] = [];
    let parsedServiceModes: string[] = [];
    let parsedLocation: any = {};

    try {
      parsedLanguages = JSON.parse(languages);
    } catch (err) {
      console.warn("languages parse error, using raw:", languages);
      if (Array.isArray(languages)) {
        parsedLanguages = languages;
      }
    }

    try {
      parsedServiceModes = JSON.parse(serviceModes);
    } catch (err) {
      console.warn("serviceModes parse error, using raw:", serviceModes);
      if (Array.isArray(serviceModes)) {
        parsedServiceModes = serviceModes;
      }
    }

    if (location) {
      try {
        parsedLocation = JSON.parse(location);
      } catch (err) {
        console.warn("location parse error, using raw:", location);
        parsedLocation = location;
      }
    }

    // Grab file paths if present from the upload middleware
    let finalProfileImage = "";
    let finalDegreeFile = "";
    let finalAadharFile = "";

    const files = (req as any).files || {};

    if (files.profile_image && files.profile_image[0]) {
      finalProfileImage =
        process.env.cdnEndpoint + files.profile_image[0].key;
    }
    if (files.degree_file && files.degree_file[0]) {
      finalDegreeFile =
        process.env.cdnEndpoint + files.degree_file[0].key;
    }
    if (files.aadhar_file && files.aadhar_file[0]) {
      finalAadharFile =
        process.env.cdnEndpoint + files.aadhar_file[0].key;
    }

    // Create new Pandit document
    const newPandit = new panditModel({
      prefix,
      firstName,
      lastName,
      age,
      gender,
      dob,
      mobile,
      email,
      languages: parsedLanguages,
      experienceInYears,
      serviceModes: parsedServiceModes,
      mobileType,
      location: parsedLocation,
      profileImage: finalProfileImage,
      degreeFile: finalDegreeFile,
      aadharFile: finalAadharFile,
    });

    await newPandit.save();
    return res.status(201).json({
      message: "Pandit registered successfully",
      newPandit,
    });
  } catch (error) {
    console.error("Error in createPandit:", error);
    return res.status(500).json({ message: "Server error", error });
  }
};

/**
 * Handle location suggestions (using a mock example)
 */
export const getLocationSuggestions = async (req: Request, res: Response) => {
  try {
    const { query } = req.query;
    // Replace this with a call to a real geocoding API if desired.
    const results = [
      {
        address: "Connaught Place, New Delhi, India",
        city: "New Delhi",
        state: "Delhi",
        country: "India",
        pincode: "110001",
        latitude: 28.6315,
        longitude: 77.2167,
      },
      {
        address: "Chandni Chowk, New Delhi, India",
        city: "New Delhi",
        state: "Delhi",
        country: "India",
        pincode: "110006",
        latitude: 28.6562,
        longitude: 77.2301,
      },
    ];

    return res.status(200).json({ suggestions: results });
  } catch (error) {
    console.error("Error in getLocationSuggestions:", error);
    return res.status(500).json({ message: "Server error", error });
  }
};

export const fetchAllPandit = async (req: Request, res: Response) => {
  try {
    const pandit = await panditModel.find({ isVerified: true });
    return res.status(200).json({ pandit });
  } catch (error) {
    console.error("Error fetching poojas:", error);
    return res.status(500).json({ message: "Server error", error });
  }
};
export const fetchPanditById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const pandit = await panditModel.findOne({ _id: id, isVerified: true });

    if (!pandit) {
      return res.status(404).json({ message: "Pooja not found or inactive" });
    }

    return res.status(200).json({ pandit });
  } catch (error) {
    console.error("Error fetching pooja by id:", error);
    return res.status(500).json({ message: "Server error", error });
  }
};
export const getPanditLocation = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const pandit = await panditModel.findById(id).select("location");

    if (!pandit) {
      return res.status(404).json({ message: "Pandit not found" });
    }

    return res.status(200).json({
      latitude: pandit.location?.latitude,
      longitude: pandit.location?.longitude,
      address: pandit.location?.address,
    });
  } catch (error) {
    console.error("Error fetching pandit location:", error);
    return res.status(500).json({ message: "Server error", error });
  }
};
