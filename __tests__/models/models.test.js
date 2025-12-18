import mongoose from 'mongoose';
import Task from '../../src/models/Task.js';
import Category from '../../src/models/Category.js';
import Note from '../../src/models/Note.js';
import User from '../../src/models/User.js';

beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/taskflow-test', {
        serverSelectionTimeoutMS: 5000,
    });
});

afterAll(async () => {
    await mongoose.connection.close();
});

describe('Task Model', () => {
    beforeEach(async () => {
        await Task.deleteMany({});
    });

    test('POSITIVE: Create a valid task document', async () => {
        const task = await Task.create({
            title: 'Test Task',
            description: 'A test task',
            priority: 'high'
        });

        expect(task).toHaveProperty('_id');
        expect(task.title).toBe('Test Task');
        expect(task.description).toBe('A test task');
        expect(task.priority).toBe('high');
    });

    test('POSITIVE: Task uses default values', async () => {
        const task = await Task.create({ title: 'Simple Task' });

        expect(task.description).toBe('');
        expect(task.category).toBe('general');
        expect(task.priority).toBe('medium');
        expect(task.status).toBe('pending');
    });

    test('POSITIVE: Task has timestamps', async () => {
        const task = await Task.create({ title: 'Task with timestamps' });

        expect(task).toHaveProperty('createdAt');
        expect(task).toHaveProperty('updatedAt');
        expect(task.createdAt).toBeInstanceOf(Date);
        expect(task.updatedAt).toBeInstanceOf(Date);
    });

    test('POSITIVE: Task with all status enum values', async () => {
        const statuses = ['pending', 'in-progress', 'completed'];

        for (const status of statuses) {
            const task = await Task.create({
                title: `Task with ${status} status`,
                status
            });
            expect(task.status).toBe(status);
        }
    });

    test('POSITIVE: Task with all priority enum values', async () => {
        const priorities = ['low', 'medium', 'high'];

        for (const priority of priorities) {
            const task = await Task.create({
                title: `Task with ${priority} priority`,
                priority
            });
            expect(task.priority).toBe(priority);
        }
    });

    test('POSITIVE: Task updatedAt gets set on save', async () => {
        const task = new Task({ title: 'New Task' });
        // updatedAt has default value
        expect(task.updatedAt).toBeDefined();

        const savedTask = await task.save();
        expect(savedTask.updatedAt).toBeDefined();
        expect(savedTask.updatedAt).toBeInstanceOf(Date);
    });

    test('POSITIVE: Task with future due date', async () => {
        const futureDate = new Date('2026-12-31');
        const task = await Task.create({
            title: 'Future task',
            dueDate: futureDate
        });

        expect(task.dueDate.getTime()).toBe(futureDate.getTime());
    });

    test('NEGATIVE: Task without required title fails', async () => {
        const task = new Task({ description: 'No title' });

        await expect(task.save()).rejects.toThrow();
    });

    test('NEGATIVE: Task with invalid status enum fails', async () => {
        const task = new Task({
            title: 'Invalid status',
            status: 'archived'
        });

        await expect(task.save()).rejects.toThrow();
    });

    test('NEGATIVE: Task with invalid priority enum fails', async () => {
        const task = new Task({
            title: 'Invalid priority',
            priority: 'critical'
        });

        await expect(task.save()).rejects.toThrow();
    });
});

describe('Category Model', () => {
    beforeEach(async () => {
        await Category.deleteMany({});
    });

    test('POSITIVE: Create a valid category document', async () => {
        const category = await Category.create({
            name: 'Work'
        });

        expect(category).toHaveProperty('_id');
        expect(category.name).toBe('Work');
    });

    test('POSITIVE: Category with color property', async () => {
        const category = await Category.create({
            name: 'Colored Category',
            color: '#FF5733'
        });

        expect(category.color).toBe('#FF5733');
    });

    test('POSITIVE: Multiple categories can coexist', async () => {
        await Category.create([
            { name: 'Work' },
            { name: 'Personal' },
            { name: 'Shopping' }
        ]);

        const categories = await Category.find();
        expect(categories.length).toBe(3);
    });

    test('POSITIVE: Category has required properties', async () => {
        const category = await Category.create({ name: 'Test Category' });

        expect(category).toHaveProperty('name');
        expect(category).toHaveProperty('color');
        expect(category).toHaveProperty('icon');
        expect(category.color).toBe('#3498db'); // default value
        expect(category.icon).toBe('folder'); // default value
    });

    test('NEGATIVE: Category without required name fails', async () => {
        const category = new Category({ color: '#FF0000' });

        await expect(category.save()).rejects.toThrow();
    });

    test('NEGATIVE: Category with empty name fails', async () => {
        const category = new Category({ name: '' });

        await expect(category.save()).rejects.toThrow();
    });

    test('POSITIVE: Category name with special characters', async () => {
        const category = await Category.create({
            name: 'Work & Personal (2025)'
        });

        expect(category.name).toBe('Work & Personal (2025)');
    });
});

describe('Note Model', () => {
    beforeEach(async () => {
        await Note.deleteMany({});
    });

    test('POSITIVE: Create a valid note document', async () => {
        const note = await Note.create({
            content: 'This is a note'
        });

        expect(note).toHaveProperty('_id');
        expect(note.content).toBe('This is a note');
    });

    test('POSITIVE: Note with default pinned value', async () => {
        const note = await Note.create({
            content: 'Unpinned note'
        });

        expect(note.pinned).toBe(false);
    });

    test('POSITIVE: Note with pinned status', async () => {
        const note = await Note.create({
            content: 'Important note',
            pinned: true
        });

        expect(note.pinned).toBe(true);
    });

    test('POSITIVE: Note with taskId reference', async () => {
        const taskId = new mongoose.Types.ObjectId();
        const note = await Note.create({
            content: 'Task-related note',
            taskId
        });

        expect(note.taskId).toEqual(taskId);
    });

    test('POSITIVE: Note has timestamps', async () => {
        const note = await Note.create({
            content: 'Timestamped note'
        });

        expect(note).toHaveProperty('createdAt');
        expect(note).toHaveProperty('updatedAt');
        expect(note.createdAt).toBeInstanceOf(Date);
        expect(note.updatedAt).toBeInstanceOf(Date);
    });

    test('POSITIVE: Note with long content', async () => {
        const longContent = 'Lorem ipsum dolor sit amet, '.repeat(100);

        const note = await Note.create({
            content: longContent
        });

        expect(note.content.length).toBeGreaterThan(2000);
    });

    test('NEGATIVE: Note without required content fails', async () => {
        const note = new Note({ taskId: new mongoose.Types.ObjectId() });

        await expect(note.save()).rejects.toThrow();
    });

    test('NEGATIVE: Note with empty content fails', async () => {
        const note = new Note({ content: '' });

        await expect(note.save()).rejects.toThrow();
    });

    test('POSITIVE: Note with special characters', async () => {
        const content = 'Note with special chars: !@#$%^&*()_+-=[]{}|;\':"<>,.?/';

        const note = await Note.create({ content });

        expect(note.content).toBe(content);
    });
});

describe('User Model', () => {
    beforeEach(async () => {
        await User.deleteMany({});
    });

    test('POSITIVE: Create a valid user document', async () => {
        const user = await User.create({
            username: 'john_doe',
            email: 'john@example.com',
            password: 'SecurePassword123!'
        });

        expect(user).toHaveProperty('_id');
        expect(user.username).toBe('john_doe');
        expect(user.email).toBe('john@example.com');
        expect(user.password).toBe('SecurePassword123!');
    });

    test('POSITIVE: User with default settings', async () => {
        const user = await User.create({
            username: 'test_user',
            email: 'test@example.com',
            password: 'Password123!'
        });

        expect(user.settings).toEqual({
            theme: 'light',
            notifications: true
        });
    });

    test('POSITIVE: User with custom settings', async () => {
        const user = await User.create({
            username: 'custom_user',
            email: 'custom@example.com',
            password: 'Password123!',
            settings: {
                theme: 'dark',
                notifications: false
            }
        });

        expect(user.settings.theme).toBe('dark');
        expect(user.settings.notifications).toBe(false);
    });

    test('POSITIVE: User with optional avatar field', async () => {
        const user = await User.create({
            username: 'avatar_user',
            email: 'avatar@example.com',
            password: 'Password123!',
            avatar: 'https://example.com/avatar.jpg'
        });

        expect(user.avatar).toBe('https://example.com/avatar.jpg');
    });

    test('POSITIVE: User has timestamps', async () => {
        const user = await User.create({
            username: 'timestamp_user',
            email: 'timestamp@example.com',
            password: 'Password123!'
        });

        expect(user).toHaveProperty('createdAt');
        expect(user.createdAt).toBeInstanceOf(Date);
    });

    test('POSITIVE: User email is unique', async () => {
        await User.create({
            username: 'user1',
            email: 'unique@example.com',
            password: 'Password123!'
        });

        const user2 = new User({
            username: 'user2',
            email: 'unique@example.com',
            password: 'Password123!'
        });

        await expect(user2.save()).rejects.toThrow();
    });

    test('NEGATIVE: User without required username fails', async () => {
        const user = new User({
            email: 'nousername@example.com',
            password: 'Password123!'
        });

        await expect(user.save()).rejects.toThrow();
    });

    test('NEGATIVE: User without required email fails', async () => {
        const user = new User({
            username: 'noemail',
            password: 'Password123!'
        });

        await expect(user.save()).rejects.toThrow();
    });

    test('NEGATIVE: User without required password fails', async () => {
        const user = new User({
            username: 'nopassword',
            email: 'nopass@example.com'
        });

        await expect(user.save()).rejects.toThrow();
    });

    test('NEGATIVE: User with empty username fails', async () => {
        const user = new User({
            username: '',
            email: 'empty@example.com',
            password: 'Password123!'
        });

        await expect(user.save()).rejects.toThrow();
    });

    test('NEGATIVE: User with empty email fails', async () => {
        const user = new User({
            username: 'emptyemail',
            email: '',
            password: 'Password123!'
        });

        await expect(user.save()).rejects.toThrow();
    });

    test('POSITIVE: Multiple users with unique emails', async () => {
        await User.create([
            { username: 'user1', email: 'user1@example.com', password: 'Pass123!' },
            { username: 'user2', email: 'user2@example.com', password: 'Pass123!' },
            { username: 'user3', email: 'user3@example.com', password: 'Pass123!' }
        ]);

        const users = await User.find();
        expect(users.length).toBe(3);
    });

    test('POSITIVE: User with special characters in username', async () => {
        const user = await User.create({
            username: 'user_123-test',
            email: 'special@example.com',
            password: 'Password123!'
        });

        expect(user.username).toBe('user_123-test');
    });

    test('POSITIVE: User password field is stored correctly', async () => {
        const password = 'VerySecurePassword123!@#';

        const user = await User.create({
            username: 'secure_user',
            email: 'secure@example.com',
            password
        });

        const retrieved = await User.findById(user._id);
        expect(retrieved.password).toBe(password);
    });
});
