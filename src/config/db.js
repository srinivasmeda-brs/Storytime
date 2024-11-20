import mongoose from 'mongoose';
import dotenv from 'dotenv'; 

dotenv.config(); // Load environment variables from.env file

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error connecting to MongoDB: ${error.message}`);
        throw error; // Rethrow error to stop the server
    }
};

export default connectDB; 
