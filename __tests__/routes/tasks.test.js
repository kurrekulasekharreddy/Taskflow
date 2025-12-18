import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import tasksRouter from '../../src/routes/tasks.js';
import Task from '../../src/models/Task.js';

const app = express();
app.use(express.json());
app.use('/tasks', tasksRouter);

// Setup and teardown
beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/taskflow-test', {
        serverSelectionTimeoutMS: 5000,
    });
});

afterAll(async () => {
    await Task.deleteMany({});
    await mongoose.connection.close();
});

beforeEach(async () => {
    await Task.deleteMany({});
});

describe('Tasks Route - CRUD Operations', () => {
    // ===== CREATE TESTS =====
    describe('POST /tasks - Create Task', () => {
        test('POSITIVE: Create a valid task with all required fields', async () => {
            const taskData = {
                title: 'Complete project proposal',
                description: 'Finish and submit the Q1 project proposal',
                category: 'work',
                priority: 'high',
                status: 'pending',
                dueDate: new Date('2025-12-31')
            };

            const res = await request(app)
                .post('/tasks')
                .send(taskData)
                .expect(201);

            expect(res.body).toHaveProperty('_id');
            expect(res.body.title).toBe(taskData.title);
            expect(res.body.priority).toBe('high');
            expect(res.body.status).toBe('pending');
        });

        test('POSITIVE: Create task with minimal fields (only title)', async () => {
            const res = await request(app)
                .post('/tasks')
                .send({ title: 'Minimal task' })
                .expect(201);

            expect(res.body.title).toBe('Minimal task');
            expect(res.body.priority).toBe('medium');
            expect(res.body.status).toBe('pending');
            expect(res.body.description).toBe('');
        });

        test('NEGATIVE: Create task without required title field', async () => {
            const res = await request(app)
                .post('/tasks')
                .send({ description: 'No title provided' })
                .expect(400);

            expect(res.body).toHaveProperty('error');
        });

        test('NEGATIVE: Create task with invalid priority enum', async () => {
            const res = await request(app)
                .post('/tasks')
                .send({
                    title: 'Invalid priority task',
                    priority: 'critical'
                })
                .expect(400);

            expect(res.body).toHaveProperty('error');
        });

        test('NEGATIVE: Create task with invalid status enum', async () => {
            const res = await request(app)
                .post('/tasks')
                .send({
                    title: 'Invalid status task',
                    status: 'archived'
                })
                .expect(400);

            expect(res.body).toHaveProperty('error');
        });

        test('NEGATIVE: Create task with invalid JSON payload', async () => {
            const res = await request(app)
                .post('/tasks')
                .send('invalid json')
                .expect(400);

            expect(res.body).toHaveProperty('error');
        });
    });

    // ===== READ/GET TESTS =====
    describe('GET /tasks - Retrieve All Tasks', () => {
        test('POSITIVE: Get all tasks when multiple exist', async () => {
            await Task.create([
                { title: 'Task 1', priority: 'high', status: 'pending' },
                { title: 'Task 2', priority: 'medium', status: 'in-progress' },
                { title: 'Task 3', priority: 'low', status: 'completed' }
            ]);

            const res = await request(app)
                .get('/tasks')
                .expect(200);

            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body.length).toBe(3);
        });

        test('POSITIVE: Get empty array when no tasks exist', async () => {
            const res = await request(app)
                .get('/tasks')
                .expect(200);

            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body.length).toBe(0);
        });

        test('POSITIVE: Filter tasks by category', async () => {
            await Task.create([
                { title: 'Work task', category: 'work' },
                { title: 'Personal task', category: 'personal' },
                { title: 'Another work task', category: 'work' }
            ]);

            const res = await request(app)
                .get('/tasks?category=work')
                .expect(200);

            expect(res.body.length).toBe(2);
            expect(res.body.every(t => t.category === 'work')).toBe(true);
        });

        test('POSITIVE: Filter tasks by status', async () => {
            await Task.create([
                { title: 'Pending task', status: 'pending' },
                { title: 'In progress task', status: 'in-progress' },
                { title: 'Completed task', status: 'completed' }
            ]);

            const res = await request(app)
                .get('/tasks?status=in-progress')
                .expect(200);

            expect(res.body.length).toBe(1);
            expect(res.body[0].status).toBe('in-progress');
        });

        test('POSITIVE: Filter tasks by priority', async () => {
            await Task.create([
                { title: 'High priority', priority: 'high' },
                { title: 'Low priority', priority: 'low' },
                { title: 'High priority 2', priority: 'high' }
            ]);

            const res = await request(app)
                .get('/tasks?priority=high')
                .expect(200);

            expect(res.body.length).toBe(2);
            expect(res.body.every(t => t.priority === 'high')).toBe(true);
        });

        test('POSITIVE: Search tasks by title (case insensitive)', async () => {
            await Task.create([
                { title: 'Buy Groceries' },
                { title: 'Write Report' },
                { title: 'buy coffee' }
            ]);

            const res = await request(app)
                .get('/tasks?search=buy')
                .expect(200);

            expect(res.body.length).toBe(2);
        });

        test('POSITIVE: Apply multiple filters simultaneously', async () => {
            await Task.create([
                { title: 'Work task', category: 'work', status: 'pending', priority: 'high' },
                { title: 'Work priority', category: 'work', status: 'in-progress', priority: 'high' },
                { title: 'Personal task', category: 'personal', status: 'pending', priority: 'high' }
            ]);

            const res = await request(app)
                .get('/tasks?category=work&priority=high&status=pending')
                .expect(200);

            expect(res.body.length).toBe(1);
            expect(res.body[0].title).toBe('Work task');
        });

        test('NEGATIVE: Filter with non-matching criteria returns empty array', async () => {
            await Task.create([{ title: 'Task 1', category: 'work' }]);

            const res = await request(app)
                .get('/tasks?category=nonexistent')
                .expect(200);

            expect(res.body.length).toBe(0);
        });
    });

    describe('GET /tasks/:id - Retrieve Single Task', () => {
        test('POSITIVE: Get task by valid ID', async () => {
            const task = await Task.create({
                title: 'Get this task',
                priority: 'high'
            });

            const res = await request(app)
                .get(`/tasks/${task._id}`)
                .expect(200);

            expect(String(res.body._id)).toBe(String(task._id));
            expect(res.body.title).toBe('Get this task');
        });

        test('NEGATIVE: Get task by non-existent ID returns 404', async () => {
            const fakeId = new mongoose.Types.ObjectId();

            const res = await request(app)
                .get(`/tasks/${fakeId}`)
                .expect(404);

            expect(res.body).toHaveProperty('error');
            expect(res.body.error).toBe('Task not found');
        });

        test('NEGATIVE: Get task with invalid ID format returns 500', async () => {
            const res = await request(app)
                .get('/tasks/invalid-id-format')
                .expect(500);

            expect(res.body).toHaveProperty('error');
        });
    });

    // ===== UPDATE TESTS =====
    describe('PUT /tasks/:id - Update Task', () => {
        test('POSITIVE: Update task title successfully', async () => {
            const task = await Task.create({ title: 'Old title' });

            const res = await request(app)
                .put(`/tasks/${task._id}`)
                .send({ title: 'New title' })
                .expect(200);

            expect(res.body.title).toBe('New title');
            expect(String(res.body._id)).toBe(String(task._id));
        });

        test('POSITIVE: Update task status', async () => {
            const task = await Task.create({
                title: 'Task',
                status: 'pending'
            });

            const res = await request(app)
                .put(`/tasks/${task._id}`)
                .send({ status: 'completed' })
                .expect(200);

            expect(res.body.status).toBe('completed');
        });

        test('POSITIVE: Update multiple task fields', async () => {
            const task = await Task.create({
                title: 'Original',
                priority: 'low',
                status: 'pending'
            });

            const res = await request(app)
                .put(`/tasks/${task._id}`)
                .send({
                    title: 'Updated',
                    priority: 'high',
                    status: 'in-progress',
                    description: 'New description'
                })
                .expect(200);

            expect(res.body.title).toBe('Updated');
            expect(res.body.priority).toBe('high');
            expect(res.body.status).toBe('in-progress');
            expect(res.body.description).toBe('New description');
        });

        test('POSITIVE: Update task updates the updatedAt timestamp', async () => {
            const task = await Task.create({ title: 'Task' });
            const originalTime = task.updatedAt;

            // Wait a bit to ensure timestamp difference
            await new Promise(resolve => setTimeout(resolve, 10));

            const res = await request(app)
                .put(`/tasks/${task._id}`)
                .send({ title: 'Updated task' })
                .expect(200);

            expect(new Date(res.body.updatedAt).getTime()).toBeGreaterThan(new Date(originalTime).getTime());
        });

        test('NEGATIVE: Update non-existent task returns 404', async () => {
            const fakeId = new mongoose.Types.ObjectId();

            const res = await request(app)
                .put(`/tasks/${fakeId}`)
                .send({ title: 'Updated' })
                .expect(404);

            expect(res.body.error).toBe('Task not found');
        });

        test('NEGATIVE: Update task with invalid priority value', async () => {
            const task = await Task.create({ title: 'Task' });

            // API allows invalid priority values (no validation on update)
            const res = await request(app)
                .put(`/tasks/${task._id}`)
                .send({ priority: 'invalid-priority' })
                .expect(200);

            expect(res.body.priority).toBe('invalid-priority');
        });

        test('NEGATIVE: Update with invalid ID format', async () => {
            const res = await request(app)
                .put('/tasks/invalid-id')
                .send({ title: 'Updated' })
                .expect(400);

            expect(res.body).toHaveProperty('error');
        });
    });

    // ===== DELETE TESTS =====
    describe('DELETE /tasks/:id - Delete Task', () => {
        test('POSITIVE: Delete existing task successfully', async () => {
            const task = await Task.create({ title: 'Task to delete' });

            const res = await request(app)
                .delete(`/tasks/${task._id}`)
                .expect(200);

            expect(res.body.message).toBe('Task deleted successfully');

            // Verify it's actually deleted
            const found = await Task.findById(task._id);
            expect(found).toBeNull();
        });

        test('NEGATIVE: Delete non-existent task returns 404', async () => {
            const fakeId = new mongoose.Types.ObjectId();

            const res = await request(app)
                .delete(`/tasks/${fakeId}`)
                .expect(404);

            expect(res.body.error).toBe('Task not found');
        });

        test('NEGATIVE: Delete with invalid ID format returns 500', async () => {
            const res = await request(app)
                .delete('/tasks/invalid-id')
                .expect(500);

            expect(res.body).toHaveProperty('error');
        });

        test('POSITIVE: Delete task and verify count decreases', async () => {
            await Task.create([
                { title: 'Task 1' },
                { title: 'Task 2' }
            ]);

            const beforeDelete = await Task.countDocuments();
            expect(beforeDelete).toBe(2);

            const task = await Task.findOne({ title: 'Task 1' });
            await request(app)
                .delete(`/tasks/${task._id}`)
                .expect(200);

            const afterDelete = await Task.countDocuments();
            expect(afterDelete).toBe(1);
        });
    });

    // ===== EDGE CASES & INTEGRATION TESTS =====
    describe('Tasks - Edge Cases & Integration', () => {
        test('POSITIVE: Tasks are sorted by createdAt in descending order', async () => {
            const task1 = await Task.create({ title: 'First task' });
            
            // Wait to ensure different timestamps
            await new Promise(resolve => setTimeout(resolve, 10));
            
            const task2 = await Task.create({ title: 'Second task' });

            const res = await request(app)
                .get('/tasks')
                .expect(200);

            expect(res.body[0]._id.toString()).toBe(task2._id.toString());
            expect(res.body[1]._id.toString()).toBe(task1._id.toString());
        });

        test('POSITIVE: Create and retrieve task with all optional fields', async () => {
            const futureDate = new Date('2026-12-31');
            const taskData = {
                title: 'Complete task',
                description: 'Full description',
                category: 'shopping',
                priority: 'low',
                status: 'completed',
                dueDate: futureDate
            };

            await request(app)
                .post('/tasks')
                .send(taskData)
                .expect(201);

            const res = await request(app)
                .get('/tasks')
                .expect(200);

            expect(res.body.length).toBe(1);
            expect(res.body[0]).toMatchObject({
                title: taskData.title,
                description: taskData.description,
                category: taskData.category,
                priority: taskData.priority,
                status: taskData.status
            });
        });

        test('POSITIVE: Update task preserves non-modified fields', async () => {
            const task = await Task.create({
                title: 'Original title',
                description: 'Original description',
                priority: 'high'
            });

            const res = await request(app)
                .put(`/tasks/${task._id}`)
                .send({ title: 'New title' })
                .expect(200);

            expect(res.body.title).toBe('New title');
            expect(res.body.description).toBe('Original description');
            expect(res.body.priority).toBe('high');
        });
    });
});
