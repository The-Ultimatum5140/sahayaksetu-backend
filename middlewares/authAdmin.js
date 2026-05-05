import jwt from "jsonwebtoken";

const authAdmin = (req, res, next) => {
  try {
    const token = req.headers.token;

    if (!token) {
      return res.json({
        success: false,
        message: "Not authorized, login again",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // role check
    if (decoded.role !== "admin") {
      return res.json({
        success: false,
        message: "Admin access required",
      });
    }

    next();
  } catch (err) {
    console.log(err);
    res.json({
      success: false,
      message: "Invalid token",
    });
  }
};

export default authAdmin;