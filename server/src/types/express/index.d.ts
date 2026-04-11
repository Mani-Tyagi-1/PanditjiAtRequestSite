import { IUser } from "../../models/userApp/userModel"; // Adjust the path to your user model file

// This declaration merging allows us to add a 'user' property to the Express Request object.
declare namespace Express {
  export interface Request {
    user?: IUser;
  }
}
