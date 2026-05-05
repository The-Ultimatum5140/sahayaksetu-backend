import jwt from "jsonwebtoken";

const authUser = (req, res, next) => {
  try {
    const token =
      req.headers.token ||
      req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authorized, login again",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // role check (VERY IMPORTANT)
    if (decoded.role !== "user") {
      return res.status(403).json({
        success: false,
        message: "User access required",
      });
    }

    req.userId = decoded.id;

    next();

  } catch (err) {
    console.log("AUTH ERROR:", err.message);

    if (err.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Session expired, login again",
      });
    }

    return res.status(401).json({
      success: false,
      message: "Authentication failed",
    });
  }
};

export default authUser;