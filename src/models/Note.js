import mongoose from 'mongoose';

const noteSchema = new mongoose.Schema({
    taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', default: null },
    title: { type: String, default: '' },
    content: { type: String, required: true },
    color: { type: String, default: '#ffffa5' },
    pinned: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

noteSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

export default mongoose.model('Note', noteSchema);
