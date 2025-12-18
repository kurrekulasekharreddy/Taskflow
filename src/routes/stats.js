import express from 'express';
import Task from '../models/Task.js';
import Category from '../models/Category.js';
import Note from '../models/Note.js';

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const [
            totalTasks,
            pendingTasks,
            inProgressTasks,
            completedTasks,
            highPriority,
            mediumPriority,
            lowPriority,
            totalCategories,
            totalNotes
        ] = await Promise.all([
            Task.countDocuments({}),
            Task.countDocuments({ status: 'pending' }),
            Task.countDocuments({ status: 'in-progress' }),
            Task.countDocuments({ status: 'completed' }),
            Task.countDocuments({ priority: 'high' }),
            Task.countDocuments({ priority: 'medium' }),
            Task.countDocuments({ priority: 'low' }),
            Category.countDocuments({}),
            Note.countDocuments({})
        ]);

        res.json({
            tasks: {
                total: totalTasks,
                pending: pendingTasks,
                inProgress: inProgressTasks,
                completed: completedTasks
            },
            priority: {
                high: highPriority,
                medium: mediumPriority,
                low: lowPriority
            },
            categories: totalCategories,
            notes: totalNotes
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
