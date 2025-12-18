import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, default: '' },
    category: { type: String, default: 'general' },
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    status: { type: String, enum: ['pending', 'in-progress', 'completed'], default: 'pending' },
    dueDate: { type: Date, default: null },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

taskSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

export default mongoose.model('Task', taskSchema);
