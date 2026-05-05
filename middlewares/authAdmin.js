import jwt from "jsonwebtoken";

const authAdmin = (req, res, next) => {
  try {
    let token;

    // ✅ Bearer token support
    if (req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    // ✅ Normal token support (optional)
    else if (req.headers.token) {
      token = req.headers.token;
    }

    // ❌ No token
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not Authorized, No Token",
      });
    }

    // ✅ Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ✅ Check admin role
    if (decoded.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Not Authorized, Not Admin",
      });
    }

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid Token",
    });
  }
};

export default authAdmin;