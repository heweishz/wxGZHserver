import path from 'path';
import express from 'express';
import dotenv from 'dotenv';
dotenv.config();
import logger from 'morgan';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import connectDB from './config/db.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';
connectDB();

import gzhGeneralRouter from './routes/gzhGeneralRoutes.js';
import userRouter from './routes/userRoutes.js';
import menuRouter from './routes/menuRoutes.js';
import paymentRouter from './routes/paymentRoutes.js';
const port = process.env.PORT | 5000;
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(logger('dev'));
app.use(cors());
app.use(cookieParser());
app.use('/', gzhGeneralRouter);
app.use('/user', userRouter);

app.use('/menu', menuRouter);
app.use('/payment', paymentRouter);

if (process.env.NODE_ENV === 'production') {
  // app.use(express.static(path.join(__dirname, '/frontend/build')));
  // app.get('*', (req, res) =>
  //   res.sendFile(path.resolve(__dirname, 'frontend', 'build', 'index.html'))
  // );
} else {
  const __dirname = path.resolve();
  app.use(express.static(path.join(__dirname, '/backend/public')));
  app.get('/', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'backend', 'public', 'index.html'));
  });
}

app.use(notFound);
app.use(errorHandler);
app.listen(port, () => console.log(`server is running on ${port}`));
