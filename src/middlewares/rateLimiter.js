import rateLimit from 'express-rate-limit';

// Rate limiter middleware for OTP requests
const otpRateLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours window
  max: 20, // limit each user to 20 requests per windowMs
  message: {
    success: false,
    message: "Too many OTP requests from this user, please try again after 24 hours"
  },
  keyGenerator: (req, res) => req.body.userId, // use userId as the key to track requests
});

export { otpRateLimiter };

