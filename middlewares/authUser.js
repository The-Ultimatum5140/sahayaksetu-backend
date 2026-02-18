import jwt from "jsonwebtoken";

const authUser = async (req, res, next) => {
  try {
    const token = req.headers.token; // simple token header

    if (!token) {
      return res.json({
        success: false,
        message: "Not authorized, login again",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.userId = decoded.id;

    next();
  } catch (err) {
  console.log("AUTH ERROR:", err.message);

  if (err.name === "TokenExpiredError") {
    return res.json({
      success:false,
      message:"Session expired, login again"
    });
  }

  res.json({
    success:false,
    message:"Authentication failed"
  });
}
};

export default authUser;
