import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import authRoutes from './routes/auth';
import directorRoutes from './routes/director';
import adminRoutes from './routes/admin';
import doctorRoutes from './routes/doctor';
import publicRoutes from './routes/public';

const app = express();

app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());
app.use(morgan('dev'));

app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: 'KDC API is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/director', directorRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/doctor', doctorRoutes);
app.use('/api/public', publicRoutes);

app.use(errorHandler);

export default app;
