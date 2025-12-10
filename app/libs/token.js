import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

// Function to generate JWT token
export const generateToken = (payload, expiresIn = "7d") => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
};

// Function to verify JWT token
// export const verifyToken = (token) => {
//   return jwt.verify(token, JWT_SECRET);
// };
