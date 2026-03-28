import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes.js';
import patientRoutes from './routes/patient.routes.js';
import aiRoutes from './routes/ai.routes.js';
import alertRoutes from './routes/alert.routes.js';
import syncRoutes from './routes/sync.routes.js';
import errorMiddleware from './middlewares/error.middleware.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/auth', authRoutes);
app.use('/patients', patientRoutes);
app.use('/ai', aiRoutes);
app.use('/alerts', alertRoutes);
app.use('/sync', syncRoutes);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Swasthya Sathi Backend is running' });
});

// Root route
app.get('/', (req, res) => {
  res.send('Welcome to Swasthya Sathi API');
});

// Custom error middleware
app.use(errorMiddleware);

export default app;
