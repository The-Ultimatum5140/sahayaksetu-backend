import jwt from "jsonwebtoken";

const authDoctor = async (req, res, next) => {
  try {
    const dToken =
      req.headers.dtoken ||
      req.headers.token ||
      req.headers.authorization?.split(" ")[1];

    if (!dToken) {
      return res.status(401).json({
        success: false,
        message: "Not authorized, login again",
      });
    }

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET missing");
    }

    const decoded = jwt.verify(dToken, process.env.JWT_SECRET);

    req.docId = decoded.id;

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

export default authDoctor;
