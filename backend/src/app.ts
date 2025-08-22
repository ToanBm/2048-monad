import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import playerRoutes from './routes/player';
import privyRoutes from './routes/privy';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    'http://localhost:3000' // Local development
  ],
  credentials: true
}));

app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV 
  });
});

// Routes
app.use('/api', playerRoutes);
app.use('/api', privyRoutes);

app.listen(PORT, () => {
  console.log(`🚀 Backend server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
  console.log(`CORS origins: ${process.env.FRONTEND_URL || 'https://your-vercel-app.vercel.app'}`);
});
