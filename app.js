import express from 'express';
import session from 'express-session';
import passport from 'passport';
import dotenv from 'dotenv';
import userrouter from './src/routes/user.router.js';
import dependentrouter from './src/routes/dependent.router.js';
import doctorrouter from './src/routes/doctor.router.js';
import staffrouter from "./src/routes/staff.router.js";
import authRoutes from './src/routes/auth.router.js'; // Import auth routes
import './config/passport.js'; // Import passport configuration
import cors from "cors";
dotenv.config();

const app = express();

// CORS configuration
// app.use(cors({
//   origin: process.env.FRONTEND_URL, // Replace with your frontend URL
//   credentials: true,
// })); 
app.use(cors({
  origin: [
    'https://dispensary-management-sys.vercel.app',
    'http://10.114.0.51',
    'https://dispensary-v2-nit-jamshedpur.vercel.app',
    'https://dispensary-frontend-deployed.vercel.app',
    'http://localhost:5173',
    process.env.FRONTEND_URL,
    process.env.ImprovedFrontend_URL,
    // "*", //block any other origin
  ],
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure session
app.use(session({
  secret: process.env.SESSION_SECRET,  //secret, to sign the cookies
  resave: false, // resave: false: The session will only be saved to the store if it was modified during the request.
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // Set to true if using HTTPS
    httpOnly: true,
    // sameSite: 'None', // for production
    // sameSite:'lax', // for localhost
    sameSite: process.env.NODE_ENV==='production' ? 'None' : 'Lax', // 'None' for production, 'Lax' for localhost
  },
}));


// Initialize passport
app.use(passport.initialize());
app.use(passport.session());

// Define routes
app.use('/api/v1/user', userrouter);
app.use('/api', dependentrouter);
app.use('/api/doc', doctorrouter);
app.use("/api/staff", staffrouter);
app.use('/api/auth', authRoutes); // Add auth routes
export default app;
