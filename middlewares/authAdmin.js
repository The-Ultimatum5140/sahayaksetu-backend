import jwt from "jsonwebtoken";

const authAdmin = async (req, res, next) => {
  try {
    const atoken = req.headers.atoken;
    console.log("HEADERS RECEIVED:", req.headers);

    if (!atoken) {
      return res.json({
        success: false,
        message: "Not authorized, login again",
      });
    }

    const decoded = jwt.verify(atoken, process.env.JWT_SECRET);

    if (decoded.email !== process.env.ADMIN_EMAIL) {
      return res.json({
        success: false,
        message: "Unauthorized access",
      });
    }

    next();
  } catch (err) {
    console.log(err);
    res.json({ success: false, message: "Invalid token" });
  }
};

export default authAdmin;
