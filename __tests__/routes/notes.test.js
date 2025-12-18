import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import notesRouter from '../../src/routes/notes.js';
import Note from '../../src/models/Note.js';

const app = express();
app.use(express.json());
app.use('/notes', notesRouter);

beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/taskflow-test', {
        serverSelectionTimeoutMS: 5000,
    });
});

afterAll(async () => {
    await Note.deleteMany({});
    await mongoose.connection.close();
});

beforeEach(async () => {
    await Note.deleteMany({});
});

describe('Notes Route - CRUD Operations', () => {
    // ===== CREATE TESTS =====
    describe('POST /notes - Create Note', () => {
        test('POSITIVE: Create a valid note with content', async () => {
            const noteData = {
                content: 'This is a test note',
                taskId: new mongoose.Types.ObjectId(),
                pinned: false
            };

            const res = await request(app)
                .post('/notes')
                .send(noteData)
                .expect(201);

            expect(res.body).toHaveProperty('_id');
            expect(res.body.content).toBe(noteData.content);
            expect(res.body.pinned).toBe(false);
        });

        test('POSITIVE: Create note with minimal fields', async () => {
            const res = await request(app)
                .post('/notes')
                .send({ content: 'Simple note' })
                .expect(201);

            expect(res.body.content).toBe('Simple note');
            expect(res.body.pinned).toBe(false);
        });

        test('POSITIVE: Create pinned note', async () => {
            const res = await request(app)
                .post('/notes')
                .send({
                    content: 'Important note',
                    pinned: true
                })
                .expect(201);

            expect(res.body.pinned).toBe(true);
            expect(res.body.content).toBe('Important note');
        });

        test('POSITIVE: Create note with taskId reference', async () => {
            const taskId = new mongoose.Types.ObjectId();

            const res = await request(app)
                .post('/notes')
                .send({
                    content: 'Task-related note',
                    taskId: taskId
                })
                .expect(201);

            expect(res.body.taskId.toString()).toBe(taskId.toString());
        });

        test('NEGATIVE: Create note without content field', async () => {
            const res = await request(app)
                .post('/notes')
                .send({ pinned: true })
                .expect(400);

            expect(res.body).toHaveProperty('error');
        });

        test('NEGATIVE: Create note with empty content', async () => {
            const res = await request(app)
                .post('/notes')
                .send({ content: '' })
                .expect(400);

            expect(res.body).toHaveProperty('error');
        });

        test('NEGATIVE: Create note with invalid JSON', async () => {
            const res = await request(app)
                .post('/notes')
                .send('invalid json data')
                .expect(400);

            expect(res.body).toHaveProperty('error');
        });
    });

    // ===== READ/GET TESTS =====
    describe('GET /notes - Retrieve All Notes', () => {
        test('POSITIVE: Get all notes when multiple exist', async () => {
            await Note.create([
                { content: 'Note 1' },
                { content: 'Note 2' },
                { content: 'Note 3' }
            ]);

            const res = await request(app)
                .get('/notes')
                .expect(200);

            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body.length).toBe(3);
        });

        test('POSITIVE: Get empty array when no notes exist', async () => {
            const res = await request(app)
                .get('/notes')
                .expect(200);

            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body.length).toBe(0);
        });

        test('POSITIVE: Pinned notes appear first', async () => {
            await Note.create([
                { content: 'Regular note' },
                { content: 'Pinned note', pinned: true },
                { content: 'Another regular' }
            ]);

            const res = await request(app)
                .get('/notes')
                .expect(200);

            expect(res.body[0].pinned).toBe(true);
            expect(res.body[1].pinned).toBe(false);
            expect(res.body[2].pinned).toBe(false);
        });

        test('POSITIVE: Filter notes by taskId', async () => {
            const taskId = new mongoose.Types.ObjectId();
            const otherId = new mongoose.Types.ObjectId();

            await Note.create([
                { content: 'Note for task 1', taskId },
                { content: 'Note for task 2', taskId },
                { content: 'Note for other task', taskId: otherId }
            ]);

            const res = await request(app)
                .get(`/notes?taskId=${taskId}`)
                .expect(200);

            expect(res.body.length).toBe(2);
            expect(res.body.every(n => n.taskId.toString() === taskId.toString())).toBe(true);
        });

        test('POSITIVE: Search notes by content', async () => {
            await Note.create([
                { content: 'Buy groceries from store' },
                { content: 'Remember to call mom' },
                { content: 'buy coffee beans' }
            ]);

            const res = await request(app)
                .get('/notes?search=buy')
                .expect(200);

            expect(res.body.length).toBe(2);
        });

        test('NEGATIVE: Filter with non-matching taskId returns empty', async () => {
            const fakeId = new mongoose.Types.ObjectId();
            await Note.create([{ content: 'Some note' }]);

            const res = await request(app)
                .get(`/notes?taskId=${fakeId}`)
                .expect(200);

            expect(res.body.length).toBe(0);
        });

        test('POSITIVE: Multiple filters work together', async () => {
            const taskId = new mongoose.Types.ObjectId();
            await Note.create([
                { content: 'Important note', taskId, pinned: true },
                { content: 'Important log', taskId, pinned: false },
                { content: 'Other', pinned: true }
            ]);

            const res = await request(app)
                .get(`/notes?taskId=${taskId}&search=Important`)
                .expect(200);

            expect(res.body.length).toBe(2);
        });
    });

    describe('GET /notes/:id - Retrieve Single Note', () => {
        test('POSITIVE: Get note by valid ID', async () => {
            const note = await Note.create({
                content: 'Specific note content'
            });

            const res = await request(app)
                .get(`/notes/${note._id}`)
                .expect(200);

            expect(String(res.body._id)).toBe(String(note._id));
            expect(res.body.content).toBe('Specific note content');
        });

        test('POSITIVE: Get note with all properties', async () => {
            const taskId = new mongoose.Types.ObjectId();
            const note = await Note.create({
                content: 'Complete note',
                taskId,
                pinned: true
            });

            const res = await request(app)
                .get(`/notes/${note._id}`)
                .expect(200);

            expect(res.body.content).toBe('Complete note');
            expect(res.body.taskId.toString()).toBe(taskId.toString());
            expect(res.body.pinned).toBe(true);
        });

        test('NEGATIVE: Get note by non-existent ID returns 404', async () => {
            const fakeId = new mongoose.Types.ObjectId();

            const res = await request(app)
                .get(`/notes/${fakeId}`)
                .expect(404);

            expect(res.body.error).toBe('Note not found');
        });

        test('NEGATIVE: Get note with invalid ID format', async () => {
            const res = await request(app)
                .get('/notes/invalid-id-format')
                .expect(500);

            expect(res.body).toHaveProperty('error');
        });
    });

    // ===== UPDATE TESTS =====
    describe('PUT /notes/:id - Update Note', () => {
        test('POSITIVE: Update note content', async () => {
            const note = await Note.create({ content: 'Old content' });

            const res = await request(app)
                .put(`/notes/${note._id}`)
                .send({ content: 'New content' })
                .expect(200);

            expect(res.body.content).toBe('New content');
            expect(String(res.body._id)).toBe(String(note._id));
        });

        test('POSITIVE: Toggle note pinned status', async () => {
            const note = await Note.create({
                content: 'Note to pin',
                pinned: false
            });

            const res = await request(app)
                .put(`/notes/${note._id}`)
                .send({ pinned: true })
                .expect(200);

            expect(res.body.pinned).toBe(true);
        });

        test('POSITIVE: Update note content and pinned status', async () => {
            const note = await Note.create({
                content: 'Original content',
                pinned: false
            });

            const res = await request(app)
                .put(`/notes/${note._id}`)
                .send({
                    content: 'Updated content',
                    pinned: true
                })
                .expect(200);

            expect(res.body.content).toBe('Updated content');
            expect(res.body.pinned).toBe(true);
        });

        test('POSITIVE: Update updates the updatedAt timestamp', async () => {
            const note = await Note.create({ content: 'Note' });
            const originalTime = note.updatedAt;

            await new Promise(resolve => setTimeout(resolve, 10));

            const res = await request(app)
                .put(`/notes/${note._id}`)
                .send({ content: 'Updated note' })
                .expect(200);

            expect(new Date(res.body.updatedAt).getTime()).toBeGreaterThan(new Date(originalTime).getTime());
        });

        test('POSITIVE: Update preserves non-modified fields', async () => {
            const taskId = new mongoose.Types.ObjectId();
            const note = await Note.create({
                content: 'Original content',
                taskId,
                pinned: true
            });

            const res = await request(app)
                .put(`/notes/${note._id}`)
                .send({ content: 'New content only' })
                .expect(200);

            expect(res.body.content).toBe('New content only');
            expect(res.body.taskId.toString()).toBe(taskId.toString());
            expect(res.body.pinned).toBe(true);
        });

        test('NEGATIVE: Update non-existent note returns 404', async () => {
            const fakeId = new mongoose.Types.ObjectId();

            const res = await request(app)
                .put(`/notes/${fakeId}`)
                .send({ content: 'Updated' })
                .expect(404);

            expect(res.body.error).toBe('Note not found');
        });

        test('NEGATIVE: Update note with empty content', async () => {
            const note = await Note.create({ content: 'Valid content' });

            // API allows empty content (no validation)
            const res = await request(app)
                .put(`/notes/${note._id}`)
                .send({ content: '' })
                .expect(200);

            expect(res.body.content).toBe('');
        });

        test('NEGATIVE: Update with invalid ID format', async () => {
            const res = await request(app)
                .put('/notes/invalid-id')
                .send({ content: 'Updated' })
                .expect(400);

            expect(res.body).toHaveProperty('error');
        });
    });

    // ===== DELETE TESTS =====
    describe('DELETE /notes/:id - Delete Note', () => {
        test('POSITIVE: Delete existing note successfully', async () => {
            const note = await Note.create({ content: 'Note to delete' });

            const res = await request(app)
                .delete(`/notes/${note._id}`)
                .expect(200);

            expect(res.body.message).toBe('Note deleted successfully');

            // Verify it's deleted
            const found = await Note.findById(note._id);
            expect(found).toBeNull();
        });

        test('POSITIVE: Delete note and count decreases', async () => {
            await Note.create([
                { content: 'Note 1' },
                { content: 'Note 2' }
            ]);

            const beforeDelete = await Note.countDocuments();
            expect(beforeDelete).toBe(2);

            const note = await Note.findOne({ content: 'Note 1' });
            await request(app)
                .delete(`/notes/${note._id}`)
                .expect(200);

            const afterDelete = await Note.countDocuments();
            expect(afterDelete).toBe(1);
        });

        test('NEGATIVE: Delete non-existent note returns 404', async () => {
            const fakeId = new mongoose.Types.ObjectId();

            const res = await request(app)
                .delete(`/notes/${fakeId}`)
                .expect(404);

            expect(res.body.error).toBe('Note not found');
        });

        test('NEGATIVE: Delete with invalid ID format', async () => {
            const res = await request(app)
                .delete('/notes/invalid-id')
                .expect(500);

            expect(res.body).toHaveProperty('error');
        });

        test('POSITIVE: Delete multiple notes independently', async () => {
            const note1 = await Note.create({ content: 'Note 1' });
            const note2 = await Note.create({ content: 'Note 2' });
            const note3 = await Note.create({ content: 'Note 3' });

            await request(app)
                .delete(`/notes/${note1._id}`)
                .expect(200);

            await request(app)
                .delete(`/notes/${note3._id}`)
                .expect(200);

            const remaining = await Note.find();
            expect(remaining.length).toBe(1);
            expect(remaining[0].content).toBe('Note 2');
        });
    });

    // ===== EDGE CASES & INTEGRATION =====
    describe('Notes - Edge Cases & Integration', () => {
        test('POSITIVE: Notes sorted by pinned status then createdAt', async () => {
            const note1 = await Note.create({ content: 'First regular', pinned: false });
            
            await new Promise(resolve => setTimeout(resolve, 10));
            
            const note2 = await Note.create({ content: 'Pinned second', pinned: true });
            const note3 = await Note.create({ content: 'Regular third', pinned: false });

            const res = await request(app)
                .get('/notes')
                .expect(200);

            expect(res.body[0].pinned).toBe(true);
            expect(res.body[1].pinned).toBe(false);
            expect(res.body[2].pinned).toBe(false);
        });

        test('POSITIVE: Create note with long content', async () => {
            const longContent = 'Lorem ipsum dolor sit amet, '.repeat(50);

            const res = await request(app)
                .post('/notes')
                .send({ content: longContent })
                .expect(201);

            expect(res.body.content.length).toBeGreaterThan(1000);
        });

        test('POSITIVE: Create, update, and retrieve full workflow', async () => {
            const createRes = await request(app)
                .post('/notes')
                .send({ content: 'Initial content' })
                .expect(201);

            const noteId = createRes.body._id;

            const updateRes = await request(app)
                .put(`/notes/${noteId}`)
                .send({ content: 'Updated content', pinned: true })
                .expect(200);

            const getRes = await request(app)
                .get(`/notes/${noteId}`)
                .expect(200);

            expect(getRes.body.content).toBe('Updated content');
            expect(getRes.body.pinned).toBe(true);
        });

        test('POSITIVE: Search is case insensitive', async () => {
            await Note.create([
                { content: 'Buy Groceries' },
                { content: 'buy coffee' },
                { content: 'PURCHASE items' }
            ]);

            const res = await request(app)
                .get('/notes?search=BUY')
                .expect(200);

            expect(res.body.length).toBe(2);
        });

        test('POSITIVE: Note with special characters', async () => {
            const content = 'Note with special chars: !@#$%^&*()_+-=[]{}|;\':"<>,.?/';

            const res = await request(app)
                .post('/notes')
                .send({ content })
                .expect(201);

            expect(res.body.content).toBe(content);
        });
    });
});
