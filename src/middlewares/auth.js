import User from "../../models/user.model.js";
import jwt from "jsonwebtoken";

// export const ensureAuthenticated = (req, res, next) => {
//   if (req.isAuthenticated()) {
//     return next();
//   }
//   res.status(401).json({ success: false, message: 'Not authenticated' });
// };

export const ensureAuthenticated = async (req, res, next) => {
  if (req.isAuthenticated()) {
    const userId = req.user.user_id; // Assuming req.user contains the authenticated user's ID
console.log(userId)
    try {
      const user = await User.findOne({ user_id: userId });
      console.log(user)

      if (!user || user.user_type === null) {
        // User doesn't exist or has been logically deleted
console.log("I'm inside in auth.js")

        req.logout(); // Invalidates the session
console.log("I'm logout in auth.js")

        return res.status(401).json({ success: false, message: 'User does not exist or is not authorized' });
      }

      return next(); // User is authenticated and valid
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
  } else {
    res.status(401).json({ success: false, message: 'Not authenticated' });
  }
};


// middleware/auth.js

// Middleware to authenticate the user using JWT
export const authenticateUser = (req, res, next) => {
  const authHeader = req.headers.authorization;
  // console.log("authenticateUser", req.headers.authorization);
  
  // Log the authorization header to check if the token is being sent
  // console.log("Authorization header:", authHeader);

  // // Check if the Authorization header is present
  // if (!authHeader || !authHeader.startsWith("Bearer ")) {
  //   return res.status(401).json({ success: false, message: "Token missing" });
  // }

  const token = authHeader; // Extract token
  // console.log("token", token);
  if (!token) {
    return res.status(401).json({ success: false, message: "Token missing" });
  }

  try {
    console.log(process.env.JWTPRIVATEKEY);
    const decoded = jwt.verify(token, process.env.JWTPRIVATEKEY);
    // console.log("decoded token", decoded);
    req.user = decoded; // Attach decoded user data to req.user
    next();
  } catch (error) {
    console.log("Error verifying token:", error);
    return res.status(401).json({ success: false, message: "Token invalid" });
  }
};