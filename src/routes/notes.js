import express from 'express';
import Note from '../models/Note.js';

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const filter = {};
        if (req.query.taskId) filter.taskId = req.query.taskId;
        if (req.query.search) {
            filter.content = { $regex: req.query.search, $options: 'i' };
        }
        
        const notes = await Note.find(filter).sort({ pinned: -1, createdAt: -1 });
        res.json(notes);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const note = await Note.findById(req.params.id);
        if (!note) return res.status(404).json({ error: 'Note not found' });
        res.json(note);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/', async (req, res) => {
    try {
        const note = new Note(req.body);
        await note.save();
        res.status(201).json(note);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

router.put('/:id', async (req, res) => {
    try {
        const note = await Note.findByIdAndUpdate(
            req.params.id,
            { ...req.body, updatedAt: new Date() },
            { new: true }
        );
        if (!note) return res.status(404).json({ error: 'Note not found' });
        res.json(note);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const note = await Note.findByIdAndDelete(req.params.id);
        if (!note) return res.status(404).json({ error: 'Note not found' });
        res.json({ message: 'Note deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
