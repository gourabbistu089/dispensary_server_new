
import mongoose from "mongoose";

export const connectDB = () => {
  if(process.env.ENV==="DEV"){
    mongoose
    .connect("mongodb://localhost:27017",{dbName: "Dispensary"})
    // .connect("mongodb+srv://vinaytheprogrammer:DispensaryNIT@cluster0.iixwz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0",{dbName: "Dispensary"})
    .then((c) => console.log(`Local Database Connected with ${c.connection.host}`))
    .catch((e) => console.log(e));
  }
  else{
  mongoose
    .connect(process.env.MONGO_URI)
    .then((c) => console.log(`Global Database Connected with ${c.connection.host}`))
    .catch((e) => console.log(e));
  }
};