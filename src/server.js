import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import taskRoutes from './routes/tasks.js';
import categoryRoutes from './routes/categories.js';
import userRoutes from './routes/users.js';
import noteRoutes from './routes/notes.js';
import statsRoutes from './routes/stats.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    next();
});

app.use(express.static(path.join(__dirname, '../public')));

app.use('/api/tasks', taskRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/stats', statsRoutes);

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

const mongoUri = process.env.MONGODB_URI;

mongoose.connect(mongoUri)
    .then(() => {
        console.log('Connected to MongoDB');
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`Server running on port ${PORT}`);
        });
    })
    .catch(err => {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    });
