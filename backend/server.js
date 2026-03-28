import express from 'express';
import dotenv from 'dotenv';

import connectDB from './config/connectDB.js';
const app = express();
dotenv.config();

const PORT = process.env.PORT || 5000;
app.use(express.json());


const startServer = async() => {
    try {
        app.listen(PORT, async () => {
            await connectDB();
            console.log(`Server is running on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error("Failed to start server: ", error);
    }
}

startServer();