import jwt from "jsonwebtoken";

const generateToken = async (id, res) => {
  const accessToken = jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "1m",
  });

  const refreshToken = jwt.sign({ id }, process.env.REFRESH_TOKEN, {
    expiresIn: "7d",
  });
};
