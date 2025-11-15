import { Server } from 'socket.io'
import jwt from "jsonwebtoken";

let io;

const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin:"*",
      methods: ["GET", "POST"],
    },
  });


  io.on("connection", (socket) => {
    // console.log("A user connected:", socket.id);

    const token = socket.handshake.auth.token;

    try {
      const decoded = jwt.verify(token, process.env.JWTPRIVATEKEY);
      console.log("Token is valid:", decoded);
  
      socket.user = decoded;
    } catch (err) {
      console.error("Invalid token:", err.message);
      socket.disconnect(); 
    }

    socket.on("lock-prescription", (prescriptionId) => {
      console.log("Prescription locked with ID:", prescriptionId);
      socket.broadcast.emit("lock-prescription", prescriptionId);
    });
    
    socket.on("disconnect", () => {
      // console.log("A user disconnected:", socket.id);
    });
  });

  return io;
};

const getSocketInstance =()=>{
  if (!io) {
    throw new Error("Socket.io not initialized. Call initializeSocket first.");
  }
  return io;
};


export {initializeSocket, getSocketInstance };
