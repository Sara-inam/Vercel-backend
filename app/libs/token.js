import jwt from "jsonwebtoken";

export const generateToken = (payload) => {
  return jwt.sign(
    {
      ...payload,
      env: process.env.ENV_NAME
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.EXPIRE_IN
    }
  );
};
