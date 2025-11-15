
import  app from "./app.js";
import { connectDB } from "./src/db/connectiondb.js";
import http from "http"
import {initializeSocket} from './src/socket/socket.js'



const server = http.createServer(app);
initializeSocket(server);

connectDB()
  .then(() => {
    server.listen(process.env.PORT || 3000, () => {
      console.log("🚀 Server running on port 3000");
    });
  })
  .catch((err) => {
    console.log("❌ Server not started due to DB error:", err.message);
  });






