import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    avatar: { type: String, default: null },
    settings: {
        theme: { type: String, default: 'light' },
        notifications: { type: Boolean, default: true }
    },
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('User', userSchema);
