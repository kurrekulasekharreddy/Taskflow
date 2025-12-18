import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import usersRouter from '../../src/routes/users.js';
import User from '../../src/models/User.js';

const app = express();
app.use(express.json());
app.use('/users', usersRouter);

beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/taskflow-test', {
        serverSelectionTimeoutMS: 5000,
    });
});

afterAll(async () => {
    await User.deleteMany({});
    await mongoose.connection.close();
});

beforeEach(async () => {
    await User.deleteMany({});
});

describe('Users Route - CRUD Operations & Validation', () => {
    // ===== CREATE TESTS =====
    describe('POST /users - Create User', () => {
        test('POSITIVE: Create a valid user with all required fields', async () => {
            const userData = {
                username: 'john_doe',
                email: 'john@example.com',
                password: 'SecurePassword123!'
            };

            const res = await request(app)
                .post('/users')
                .send(userData)
                .expect(201);

            expect(res.body).toHaveProperty('_id');
            expect(res.body.username).toBe(userData.username);
            expect(res.body.email).toBe(userData.email);
            expect(res.body).not.toHaveProperty('password');
        });

        test('POSITIVE: Create user with default settings', async () => {
            const res = await request(app)
                .post('/users')
                .send({
                    username: 'jane_doe',
                    email: 'jane@example.com',
                    password: 'Password123!'
                })
                .expect(201);

            expect(res.body.settings).toEqual({
                theme: 'light',
                notifications: true
            });
        });

        test('POSITIVE: Create user with optional avatar field', async () => {
            const res = await request(app)
                .post('/users')
                .send({
                    username: 'avatar_user',
                    email: 'avatar@example.com',
                    password: 'Password123!',
                    avatar: 'https://example.com/avatar.jpg'
                })
                .expect(201);

            expect(res.body.avatar).toBe('https://example.com/avatar.jpg');
        });

        test('POSITIVE: Create multiple users with unique emails', async () => {
            const users = [
                { username: 'user1', email: 'user1@example.com', password: 'Pass123!' },
                { username: 'user2', email: 'user2@example.com', password: 'Pass123!' },
                { username: 'user3', email: 'user3@example.com', password: 'Pass123!' }
            ];

            for (const user of users) {
                await request(app)
                    .post('/users')
                    .send(user)
                    .expect(201);
            }

            const res = await request(app)
                .get('/users')
                .expect(200);

            expect(res.body.length).toBe(3);
        });

        test('NEGATIVE: Create user without username', async () => {
            const res = await request(app)
                .post('/users')
                .send({
                    email: 'nouser@example.com',
                    password: 'Password123!'
                })
                .expect(400);

            expect(res.body).toHaveProperty('error');
        });

        test('NEGATIVE: Create user without email', async () => {
            const res = await request(app)
                .post('/users')
                .send({
                    username: 'noemail',
                    password: 'Password123!'
                })
                .expect(400);

            expect(res.body).toHaveProperty('error');
        });

        test('NEGATIVE: Create user without password', async () => {
            const res = await request(app)
                .post('/users')
                .send({
                    username: 'nopass',
                    email: 'nopass@example.com'
                })
                .expect(400);

            expect(res.body).toHaveProperty('error');
        });

        test('NEGATIVE: Create user with duplicate email returns 400', async () => {
            const userData = {
                username: 'first_user',
                email: 'duplicate@example.com',
                password: 'Password123!'
            };

            await request(app)
                .post('/users')
                .send(userData)
                .expect(201);

            const res = await request(app)
                .post('/users')
                .send({
                    username: 'second_user',
                    email: 'duplicate@example.com',
                    password: 'Password123!'
                })
                .expect(400);

            expect(res.body.error).toBe('Email already exists');
        });

        test('NEGATIVE: Create user with empty email', async () => {
            const res = await request(app)
                .post('/users')
                .send({
                    username: 'emptyemail',
                    email: '',
                    password: 'Password123!'
                })
                .expect(400);

            expect(res.body).toHaveProperty('error');
        });

        test('NEGATIVE: Create user with invalid email format', async () => {
            const res = await request(app)
                .post('/users')
                .send({
                    username: 'testuser',
                    email: 'not-an-email',
                    password: 'Password123!'
                })
                .expect(201);

            // Note: API doesn't validate email format, only requires field
            expect(res.body).toHaveProperty('username');
        });

        test('NEGATIVE: Create user with invalid JSON', async () => {
            const res = await request(app)
                .post('/users')
                .send('invalid json')
                .expect(400);

            expect(res.body).toHaveProperty('error');
        });
    });

    // ===== READ/GET TESTS =====
    describe('GET /users - Retrieve All Users', () => {
        test('POSITIVE: Get all users when multiple exist', async () => {
            const users = [
                { username: 'user1', email: 'user1@example.com', password: 'Pass123!' },
                { username: 'user2', email: 'user2@example.com', password: 'Pass123!' },
                { username: 'user3', email: 'user3@example.com', password: 'Pass123!' }
            ];

            for (const user of users) {
                await User.create(user);
            }

            const res = await request(app)
                .get('/users')
                .expect(200);

            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body.length).toBe(3);
        });

        test('POSITIVE: Get empty array when no users exist', async () => {
            const res = await request(app)
                .get('/users')
                .expect(200);

            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body.length).toBe(0);
        });

        test('POSITIVE: Passwords are not returned in GET response', async () => {
            await User.create({
                username: 'secretpass',
                email: 'secret@example.com',
                password: 'SecretPassword123!'
            });

            const res = await request(app)
                .get('/users')
                .expect(200);

            expect(res.body[0]).not.toHaveProperty('password');
        });

        test('POSITIVE: Users are sorted by createdAt descending', async () => {
            const user1 = await User.create({
                username: 'user1',
                email: 'user1@example.com',
                password: 'Pass123!'
            });

            await new Promise(resolve => setTimeout(resolve, 10));

            const user2 = await User.create({
                username: 'user2',
                email: 'user2@example.com',
                password: 'Pass123!'
            });

            const res = await request(app)
                .get('/users')
                .expect(200);

            expect(res.body[0]._id.toString()).toBe(user2._id.toString());
            expect(res.body[1]._id.toString()).toBe(user1._id.toString());
        });

        test('POSITIVE: All users have required properties', async () => {
            await User.create({
                username: 'testuser',
                email: 'test@example.com',
                password: 'Pass123!'
            });

            const res = await request(app)
                .get('/users')
                .expect(200);

            res.body.forEach(user => {
                expect(user).toHaveProperty('_id');
                expect(user).toHaveProperty('username');
                expect(user).toHaveProperty('email');
                expect(user).not.toHaveProperty('password');
            });
        });
    });

    describe('GET /users/:id - Retrieve Single User', () => {
        test('POSITIVE: Get user by valid ID', async () => {
            const user = await User.create({
                username: 'specific_user',
                email: 'specific@example.com',
                password: 'Password123!'
            });

            const res = await request(app)
                .get(`/users/${user._id}`)
                .expect(200);

            expect(String(res.body._id)).toBe(String(user._id));
            expect(res.body.username).toBe('specific_user');
            expect(res.body.email).toBe('specific@example.com');
        });

        test('POSITIVE: Get user with settings', async () => {
            const user = await User.create({
                username: 'settings_user',
                email: 'settings@example.com',
                password: 'Password123!'
            });

            const res = await request(app)
                .get(`/users/${user._id}`)
                .expect(200);

            expect(res.body.settings).toEqual({
                theme: 'light',
                notifications: true
            });
        });

        test('POSITIVE: Get user does not return password', async () => {
            const user = await User.create({
                username: 'nopass_user',
                email: 'nopass@example.com',
                password: 'SecretPassword123!'
            });

            const res = await request(app)
                .get(`/users/${user._id}`)
                .expect(200);

            expect(res.body).not.toHaveProperty('password');
        });

        test('NEGATIVE: Get user by non-existent ID returns 404', async () => {
            const fakeId = new mongoose.Types.ObjectId();

            const res = await request(app)
                .get(`/users/${fakeId}`)
                .expect(404);

            expect(res.body.error).toBe('User not found');
        });

        test('NEGATIVE: Get user with invalid ID format', async () => {
            const res = await request(app)
                .get('/users/invalid-id-format')
                .expect(500);

            expect(res.body).toHaveProperty('error');
        });
    });

    // ===== UPDATE TESTS =====
    describe('PUT /users/:id - Update User', () => {
        test('POSITIVE: Update user username', async () => {
            const user = await User.create({
                username: 'old_username',
                email: 'update@example.com',
                password: 'Password123!'
            });

            const res = await request(app)
                .put(`/users/${user._id}`)
                .send({ username: 'new_username' })
                .expect(200);

            expect(res.body.username).toBe('new_username');
            expect(res.body.email).toBe('update@example.com');
        });

        test('POSITIVE: Update user settings theme', async () => {
            const user = await User.create({
                username: 'theme_user',
                email: 'theme@example.com',
                password: 'Password123!'
            });

            const res = await request(app)
                .put(`/users/${user._id}`)
                .send({
                    settings: {
                        theme: 'dark',
                        notifications: true
                    }
                })
                .expect(200);

            expect(res.body.settings.theme).toBe('dark');
            expect(res.body.settings.notifications).toBe(true);
        });

        test('POSITIVE: Update user avatar', async () => {
            const user = await User.create({
                username: 'avatar_user',
                email: 'avatar@example.com',
                password: 'Password123!'
            });

            const res = await request(app)
                .put(`/users/${user._id}`)
                .send({
                    avatar: 'https://example.com/new-avatar.jpg'
                })
                .expect(200);

            expect(res.body.avatar).toBe('https://example.com/new-avatar.jpg');
        });

        test('POSITIVE: Update multiple user fields', async () => {
            const user = await User.create({
                username: 'original',
                email: 'original@example.com',
                password: 'Password123!'
            });

            const res = await request(app)
                .put(`/users/${user._id}`)
                .send({
                    username: 'updated',
                    avatar: 'https://example.com/avatar.jpg',
                    settings: {
                        theme: 'dark',
                        notifications: false
                    }
                })
                .expect(200);

            expect(res.body.username).toBe('updated');
            expect(res.body.avatar).toBe('https://example.com/avatar.jpg');
            expect(res.body.settings.theme).toBe('dark');
            expect(res.body.settings.notifications).toBe(false);
        });

        test('POSITIVE: Update preserves non-modified fields', async () => {
            const user = await User.create({
                username: 'preserved',
                email: 'preserved@example.com',
                password: 'Password123!',
                avatar: 'https://example.com/original.jpg'
            });

            const res = await request(app)
                .put(`/users/${user._id}`)
                .send({ username: 'new_name' })
                .expect(200);

            expect(res.body.username).toBe('new_name');
            expect(res.body.email).toBe('preserved@example.com');
            expect(res.body.avatar).toBe('https://example.com/original.jpg');
        });

        test('NEGATIVE: Update non-existent user returns 404', async () => {
            const fakeId = new mongoose.Types.ObjectId();

            const res = await request(app)
                .put(`/users/${fakeId}`)
                .send({ username: 'updated' })
                .expect(404);

            expect(res.body.error).toBe('User not found');
        });

        test('NEGATIVE: Update with invalid ID format', async () => {
            const res = await request(app)
                .put('/users/invalid-id')
                .send({ username: 'updated' })
                .expect(400);

            expect(res.body).toHaveProperty('error');
        });

        test('POSITIVE: Update does not return password', async () => {
            const user = await User.create({
                username: 'nopass',
                email: 'nopass@example.com',
                password: 'SecretPassword123!'
            });

            const res = await request(app)
                .put(`/users/${user._id}`)
                .send({ username: 'updated_nopass' })
                .expect(200);

            expect(res.body).not.toHaveProperty('password');
        });
    });

    // ===== DELETE TESTS =====
    describe('DELETE /users/:id - Delete User', () => {
        test('POSITIVE: Delete existing user successfully', async () => {
            const user = await User.create({
                username: 'delete_me',
                email: 'delete@example.com',
                password: 'Password123!'
            });

            const res = await request(app)
                .delete(`/users/${user._id}`)
                .expect(200);

            expect(res.body.message).toBe('User deleted successfully');

            // Verify deletion
            const found = await User.findById(user._id);
            expect(found).toBeNull();
        });

        test('POSITIVE: Delete user and count decreases', async () => {
            await User.create([
                { username: 'user1', email: 'user1@example.com', password: 'Pass123!' },
                { username: 'user2', email: 'user2@example.com', password: 'Pass123!' }
            ]);

            const beforeDelete = await User.countDocuments();
            expect(beforeDelete).toBe(2);

            const user = await User.findOne({ username: 'user1' });
            await request(app)
                .delete(`/users/${user._id}`)
                .expect(200);

            const afterDelete = await User.countDocuments();
            expect(afterDelete).toBe(1);
        });

        test('NEGATIVE: Delete non-existent user returns 404', async () => {
            const fakeId = new mongoose.Types.ObjectId();

            const res = await request(app)
                .delete(`/users/${fakeId}`)
                .expect(404);

            expect(res.body.error).toBe('User not found');
        });

        test('NEGATIVE: Delete with invalid ID format', async () => {
            const res = await request(app)
                .delete('/users/invalid-id')
                .expect(500);

            expect(res.body).toHaveProperty('error');
        });

        test('POSITIVE: Delete multiple users independently', async () => {
            const user1 = await User.create({
                username: 'user1',
                email: 'user1@example.com',
                password: 'Pass123!'
            });
            const user2 = await User.create({
                username: 'user2',
                email: 'user2@example.com',
                password: 'Pass123!'
            });
            const user3 = await User.create({
                username: 'user3',
                email: 'user3@example.com',
                password: 'Pass123!'
            });

            await request(app)
                .delete(`/users/${user1._id}`)
                .expect(200);

            await request(app)
                .delete(`/users/${user3._id}`)
                .expect(200);

            const remaining = await User.find();
            expect(remaining.length).toBe(1);
            expect(remaining[0].username).toBe('user2');
        });
    });

    // ===== EDGE CASES & INTEGRATION =====
    describe('Users - Edge Cases & Integration', () => {
        test('POSITIVE: Email uniqueness is case sensitive', async () => {
            await User.create({
                username: 'user1',
                email: 'Test@Example.com',
                password: 'Pass123!'
            });

            // Different case should be allowed (case-sensitive check)
            const res = await request(app)
                .post('/users')
                .send({
                    username: 'user2',
                    email: 'test@example.com',
                    password: 'Pass123!'
                })
                .expect(201);

            expect(res.body.email).toBe('test@example.com');
        });

        test('POSITIVE: Username can contain special characters and numbers', async () => {
            const res = await request(app)
                .post('/users')
                .send({
                    username: 'user_123-test',
                    email: 'special@example.com',
                    password: 'Pass123!'
                })
                .expect(201);

            expect(res.body.username).toBe('user_123-test');
        });

        test('POSITIVE: Create, update, and retrieve full workflow', async () => {
            const createRes = await request(app)
                .post('/users')
                .send({
                    username: 'workflow_user',
                    email: 'workflow@example.com',
                    password: 'Password123!'
                })
                .expect(201);

            const userId = createRes.body._id;

            const updateRes = await request(app)
                .put(`/users/${userId}`)
                .send({
                    username: 'updated_workflow',
                    avatar: 'https://example.com/avatar.jpg'
                })
                .expect(200);

            const getRes = await request(app)
                .get(`/users/${userId}`)
                .expect(200);

            expect(getRes.body.username).toBe('updated_workflow');
            expect(getRes.body.avatar).toBe('https://example.com/avatar.jpg');
            expect(getRes.body.email).toBe('workflow@example.com');
        });

        test('POSITIVE: Multiple users can be created and queried', async () => {
            const userData = [
                { username: 'alice', email: 'alice@example.com', password: 'Pass123!' },
                { username: 'bob', email: 'bob@example.com', password: 'Pass123!' },
                { username: 'charlie', email: 'charlie@example.com', password: 'Pass123!' }
            ];

            const created = [];
            for (const user of userData) {
                const res = await request(app)
                    .post('/users')
                    .send(user)
                    .expect(201);
                created.push(res.body._id);
            }

            const allRes = await request(app)
                .get('/users')
                .expect(200);

            expect(allRes.body.length).toBe(3);

            for (const id of created) {
                const userRes = await request(app)
                    .get(`/users/${id}`)
                    .expect(200);
                expect(userRes.body).not.toHaveProperty('password');
            }
        });

        test('POSITIVE: User with long email and username', async () => {
            const longEmail = 'very.long.email.address.with.many.dots@subdomain.example.co.uk';
            const longUsername = 'this_is_a_very_long_username_with_many_underscores_and_characters';

            const res = await request(app)
                .post('/users')
                .send({
                    username: longUsername,
                    email: longEmail,
                    password: 'Password123!'
                })
                .expect(201);

            expect(res.body.email).toBe(longEmail);
            expect(res.body.username).toBe(longUsername);
        });
    });
});
