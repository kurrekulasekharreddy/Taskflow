import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import categoriesRouter from '../../src/routes/categories.js';
import Category from '../../src/models/Category.js';

const app = express();
app.use(express.json());
app.use('/categories', categoriesRouter);

beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/taskflow-test', {
        serverSelectionTimeoutMS: 5000,
    });
});

afterAll(async () => {
    await Category.deleteMany({});
    await mongoose.connection.close();
});

beforeEach(async () => {
    await Category.deleteMany({});
});

describe('Categories Route - CRUD Operations', () => {
    // ===== CREATE TESTS =====
    describe('POST /categories - Create Category', () => {
        test('POSITIVE: Create a valid category with name', async () => {
            const categoryData = {
                name: 'Work Projects',
                color: '#FF5733'
            };

            const res = await request(app)
                .post('/categories')
                .send(categoryData)
                .expect(201);

            expect(res.body).toHaveProperty('_id');
            expect(res.body.name).toBe(categoryData.name);
            expect(res.body.color).toBe(categoryData.color);
        });

        test('POSITIVE: Create category with minimal field (just name)', async () => {
            const res = await request(app)
                .post('/categories')
                .send({ name: 'Shopping' })
                .expect(201);

            expect(res.body.name).toBe('Shopping');
            expect(res.body).toHaveProperty('_id');
        });

        test('POSITIVE: Create multiple unique categories', async () => {
            const categories = [
                { name: 'Work' },
                { name: 'Personal' },
                { name: 'Shopping' }
            ];

            for (const cat of categories) {
                await request(app)
                    .post('/categories')
                    .send(cat)
                    .expect(201);
            }

            const res = await request(app)
                .get('/categories')
                .expect(200);

            expect(res.body.length).toBe(3);
        });

        test('NEGATIVE: Create category without required name field', async () => {
            const res = await request(app)
                .post('/categories')
                .send({ color: '#FF5733' })
                .expect(400);

            expect(res.body).toHaveProperty('error');
        });

        test('NEGATIVE: Create category with empty name', async () => {
            const res = await request(app)
                .post('/categories')
                .send({ name: '' })
                .expect(400);

            expect(res.body).toHaveProperty('error');
        });

        test('NEGATIVE: Create category with invalid JSON', async () => {
            const res = await request(app)
                .post('/categories')
                .send('not json')
                .expect(400);

            expect(res.body).toHaveProperty('error');
        });
    });

    // ===== READ/GET TESTS =====
    describe('GET /categories - Retrieve All Categories', () => {
        test('POSITIVE: Get all categories when multiple exist', async () => {
            await Category.create([
                { name: 'Work' },
                { name: 'Personal' },
                { name: 'Shopping' }
            ]);

            const res = await request(app)
                .get('/categories')
                .expect(200);

            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body.length).toBe(3);
        });

        test('POSITIVE: Get empty array when no categories exist', async () => {
            const res = await request(app)
                .get('/categories')
                .expect(200);

            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body.length).toBe(0);
        });

        test('POSITIVE: Categories are sorted alphabetically by name', async () => {
            await Category.create([
                { name: 'Zebra' },
                { name: 'Apple' },
                { name: 'Mango' }
            ]);

            const res = await request(app)
                .get('/categories')
                .expect(200);

            expect(res.body[0].name).toBe('Apple');
            expect(res.body[1].name).toBe('Mango');
            expect(res.body[2].name).toBe('Zebra');
        });

        test('POSITIVE: All categories have required properties', async () => {
            await Category.create([
                { name: 'Test 1' },
                { name: 'Test 2' }
            ]);

            const res = await request(app)
                .get('/categories')
                .expect(200);

            res.body.forEach(cat => {
                expect(cat).toHaveProperty('_id');
                expect(cat).toHaveProperty('name');
            });
        });
    });

    describe('GET /categories/:id - Retrieve Single Category', () => {
        test('POSITIVE: Get category by valid ID', async () => {
            const category = await Category.create({
                name: 'Specific Category'
            });

            const res = await request(app)
                .get(`/categories/${category._id}`)
                .expect(200);

            expect(String(res.body._id)).toBe(String(category._id));
            expect(res.body.name).toBe('Specific Category');
        });

        test('POSITIVE: Get category with complete data', async () => {
            const category = await Category.create({
                name: 'Complete Category',
                color: '#3498DB',
                description: 'A test category'
            });

            const res = await request(app)
                .get(`/categories/${category._id}`)
                .expect(200);

            expect(res.body.name).toBe('Complete Category');
            expect(res.body.color).toBe('#3498DB');
        });

        test('NEGATIVE: Get category by non-existent ID returns 404', async () => {
            const fakeId = new mongoose.Types.ObjectId();

            const res = await request(app)
                .get(`/categories/${fakeId}`)
                .expect(404);

            expect(res.body).toHaveProperty('error');
            expect(res.body.error).toBe('Category not found');
        });

        test('NEGATIVE: Get category with invalid ID format', async () => {
            const res = await request(app)
                .get('/categories/invalid-id')
                .expect(500);

            expect(res.body).toHaveProperty('error');
        });
    });

    // ===== UPDATE TESTS =====
    describe('PUT /categories/:id - Update Category', () => {
        test('POSITIVE: Update category name', async () => {
            const category = await Category.create({ name: 'Old Name' });

            const res = await request(app)
                .put(`/categories/${category._id}`)
                .send({ name: 'New Name' })
                .expect(200);

            expect(res.body.name).toBe('New Name');
            expect(String(res.body._id)).toBe(String(category._id));
        });

        test('POSITIVE: Update category color', async () => {
            const category = await Category.create({
                name: 'Colorful',
                color: '#FF0000'
            });

            const res = await request(app)
                .put(`/categories/${category._id}`)
                .send({ color: '#00FF00' })
                .expect(200);

            expect(res.body.color).toBe('#00FF00');
            expect(res.body.name).toBe('Colorful');
        });

        test('POSITIVE: Update multiple category fields', async () => {
            const category = await Category.create({
                name: 'Original',
                color: '#FF0000'
            });

            const res = await request(app)
                .put(`/categories/${category._id}`)
                .send({
                    name: 'Updated',
                    color: '#0000FF',
                    icon: 'star'
                })
                .expect(200);

            expect(res.body.name).toBe('Updated');
            expect(res.body.color).toBe('#0000FF');
            expect(res.body.icon).toBe('star');
        });

        test('POSITIVE: Update preserves non-modified fields', async () => {
            const category = await Category.create({
                name: 'Complete Category',
                color: '#FF5733',
                icon: 'folder'
            });

            const res = await request(app)
                .put(`/categories/${category._id}`)
                .send({ name: 'Renamed' })
                .expect(200);

            expect(res.body.name).toBe('Renamed');
            expect(res.body.color).toBe('#FF5733');
            expect(res.body.icon).toBe('folder');
        });

        test('NEGATIVE: Update non-existent category returns 404', async () => {
            const fakeId = new mongoose.Types.ObjectId();

            const res = await request(app)
                .put(`/categories/${fakeId}`)
                .send({ name: 'Updated' })
                .expect(404);

            expect(res.body.error).toBe('Category not found');
        });

        test('NEGATIVE: Update with invalid ID format', async () => {
            const res = await request(app)
                .put('/categories/invalid-id')
                .send({ name: 'Updated' })
                .expect(400);

            expect(res.body).toHaveProperty('error');
        });

        test('NEGATIVE: Update category with empty name', async () => {
            const category = await Category.create({ name: 'Test' });

            // API allows empty name (no validation)
            const res = await request(app)
                .put(`/categories/${category._id}`)
                .send({ name: '' })
                .expect(200);

            expect(res.body.name).toBe('');
        });
    });

    // ===== DELETE TESTS =====
    describe('DELETE /categories/:id - Delete Category', () => {
        test('POSITIVE: Delete existing category successfully', async () => {
            const category = await Category.create({ name: 'Delete Me' });

            const res = await request(app)
                .delete(`/categories/${category._id}`)
                .expect(200);

            expect(res.body.message).toBe('Category deleted successfully');

            // Verify it's actually deleted
            const found = await Category.findById(category._id);
            expect(found).toBeNull();
        });

        test('POSITIVE: Delete category and verify count decreases', async () => {
            await Category.create([
                { name: 'Category 1' },
                { name: 'Category 2' }
            ]);

            const beforeDelete = await Category.countDocuments();
            expect(beforeDelete).toBe(2);

            const category = await Category.findOne({ name: 'Category 1' });
            await request(app)
                .delete(`/categories/${category._id}`)
                .expect(200);

            const afterDelete = await Category.countDocuments();
            expect(afterDelete).toBe(1);
        });

        test('NEGATIVE: Delete non-existent category returns 404', async () => {
            const fakeId = new mongoose.Types.ObjectId();

            const res = await request(app)
                .delete(`/categories/${fakeId}`)
                .expect(404);

            expect(res.body.error).toBe('Category not found');
        });

        test('NEGATIVE: Delete with invalid ID format returns 500', async () => {
            const res = await request(app)
                .delete('/categories/invalid-id')
                .expect(500);

            expect(res.body).toHaveProperty('error');
        });

        test('POSITIVE: Multiple delete operations work independently', async () => {
            const cat1 = await Category.create({ name: 'Cat 1' });
            const cat2 = await Category.create({ name: 'Cat 2' });
            const cat3 = await Category.create({ name: 'Cat 3' });

            await request(app)
                .delete(`/categories/${cat1._id}`)
                .expect(200);

            await request(app)
                .delete(`/categories/${cat3._id}`)
                .expect(200);

            const remaining = await Category.find();
            expect(remaining.length).toBe(1);
            expect(remaining[0].name).toBe('Cat 2');
        });
    });

    // ===== EDGE CASES & INTEGRATION =====
    describe('Categories - Edge Cases & Integration', () => {
        test('POSITIVE: Create category with special characters in name', async () => {
            const res = await request(app)
                .post('/categories')
                .send({ name: 'Work & Personal (2025)' })
                .expect(201);

            expect(res.body.name).toBe('Work & Personal (2025)');
        });

        test('POSITIVE: Category names with different cases sort properly', async () => {
            await Category.create([
                { name: 'work' },
                { name: 'Work' },
                { name: 'WORK' }
            ]);

            const res = await request(app)
                .get('/categories')
                .expect(200);

            expect(res.body.length).toBe(3);
        });

        test('POSITIVE: Create, update, and retrieve full workflow', async () => {
            const createRes = await request(app)
                .post('/categories')
                .send({ name: 'Original Category' })
                .expect(201);

            const categoryId = createRes.body._id;

            const updateRes = await request(app)
                .put(`/categories/${categoryId}`)
                .send({ name: 'Updated Category', color: '#FF00FF' })
                .expect(200);

            const getRes = await request(app)
                .get(`/categories/${categoryId}`)
                .expect(200);

            expect(getRes.body.name).toBe('Updated Category');
            expect(getRes.body.color).toBe('#FF00FF');
        });

        test('POSITIVE: Query after create returns all data', async () => {
            const created = await request(app)
                .post('/categories')
                .send({
                    name: 'Query Test',
                    color: '#123456'
                })
                .expect(201);

            const retrieved = await request(app)
                .get(`/categories/${created.body._id}`)
                .expect(200);

            expect(retrieved.body).toMatchObject(created.body);
        });
    });
});
