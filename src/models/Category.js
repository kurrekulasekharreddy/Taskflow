import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
    name: { type: String, required: true },
    color: { type: String, default: '#3498db' },
    icon: { type: String, default: 'folder' }
});

export default mongoose.model('Category', categorySchema);
