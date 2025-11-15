
import  app from "./app.js";
import { connectDB } from "./src/db/connectiondb.js";
import http from "http"
import {initializeSocket} from './src/socket/socket.js'

connectDB();

const server = http.createServer(app);
initializeSocket(server);


server.listen(process.env.PORT || 3000, () => {
  console.log(
    `Server is working on port:3000 in local Mode`
  );
});






