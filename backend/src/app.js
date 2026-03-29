import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes.js';
import patientRoutes from './routes/patient.routes.js';
import voiceRoutes from './routes/voice.routes.js';
import qrRoutes from './routes/qr.routes.js';
import communicationRoutes from './routes/communication.routes.js';
import aiRoutes from './routes/ai.routes.js';
import alertRoutes from './routes/alert.routes.js';
import syncRoutes from './routes/sync.routes.js';
import errorMiddleware from './middlewares/error.middleware.js';
import complianceRoutes from './routes/compliance.routes.js';
import adminRoutes from './routes/admin.routes.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Routes
app.use('/auth', authRoutes);
app.use('/patients', patientRoutes);
app.use('/ai', aiRoutes);
app.use('/alerts', alertRoutes);
app.use('/sync', syncRoutes);
app.use('/qr', qrRoutes);
app.use('/comm', communicationRoutes);
app.use('/voice', voiceRoutes);
app.use('/compliance', complianceRoutes);
app.use('/admin', adminRoutes);

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
