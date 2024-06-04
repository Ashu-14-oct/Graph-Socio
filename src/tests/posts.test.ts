import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from '@apollo/server/express4';
import { stopServer, typeDefs } from "../server";
import { resolvers } from "../graphql/resolvers";
import { models } from "../models";
import express from "express";
import { decryptToken, getToken } from "../helpers/auth";
import { postValidator, updatePostValidator } from "../validation/postValidation";
import request from 'supertest';
import mongoose from 'mongoose';

const { ObjectId } = mongoose.Types;

jest.mock('../helpers/auth', () => ({
    decryptToken: jest.fn(),
    getToken: jest.fn(),
}));

jest.mock('../validation/postValidation', () => ({
    postValidator: jest.fn(),
    updatePostValidator: jest.fn(),
}));

describe('Post Resolvers', () => {
    let server: ApolloServer;
    let app: express.Express;

    beforeAll(async () => {
        server = new ApolloServer({
            typeDefs,
            resolvers,
        });
        await server.start();
        app = express();
        app.use(express.json());
        app.use(expressMiddleware(server, {
            context: async ({ req }) => {
                const token = req.headers.authorization as string;
                const user = await decryptToken(token);
                return { models, user: user || null };
            }
        }));
    });

    afterAll(async () => {
        await stopServer();
    });

    describe('createPost', () => {
        it('should create a post when user is authenticated', async () => {
            const postInput = {
                tweet: 'This is a test post',
            };

            const user = {
                id: new ObjectId(),
                name: 'Test User',
                email: 'test@example.com',
            };

            (decryptToken as jest.Mock).mockResolvedValue(user.id);
            (postValidator as jest.Mock).mockResolvedValue(null);

            const mockSave = jest.fn().mockResolvedValue({
                id: new ObjectId(),
                tweet: postInput.tweet,
                createdBy: user.id,
            });

            jest.spyOn(models.Post.prototype, 'save').mockImplementation(mockSave);

            jest.spyOn(models.User, 'findByIdAndUpdate').mockResolvedValue({});

            const CREATE_POST = `
                mutation CreatePost($input: CreatePostInput!) {
                    createPost(input: $input) {
                        id
                        tweet
                    }
                }
            `;

            const response = await request(app).post('/').send({
                query: CREATE_POST,
                variables: { input: postInput }
            });

            const { data, errors } = response.body;
            expect(errors).toBeUndefined();
            expect(data.createPost).toBeTruthy();
            expect(data.createPost.tweet).toBe(postInput.tweet);
        });

        it('should fail to create a post when user is not authenticated', async () => {
            const postInput = {
                tweet: 'This is a test post',
            };

            (decryptToken as jest.Mock).mockResolvedValue(null);

            const CREATE_POST = `
                mutation CreatePost($input: CreatePostInput!) {
                    createPost(input: $input) {
                        id
                        tweet
                        createdBy {
                            id
                            name
                        }
                    }
                }
            `;

            const response = await request(app).post('/').send({
                query: CREATE_POST,
                variables: { input: postInput }
            });

            const { errors } = response.body;
            expect(errors).toBeTruthy();
            expect(errors[0].message).toBe("User not authenticated");
        });
    });

    describe('updatePost', () => {
        it('should update a post when user is authenticated and is the owner', async () => {
            const postInput = {
                postId: '1',
                tweet: 'This is an updated post',
            };

            const user = {
                id: new ObjectId(),
                name: 'Test User',
                email: 'test@example.com',
            };

            const post = {
                id: postInput.postId,
                tweet: 'This is a test post',
                createdBy: user.id,
            };

            (decryptToken as jest.Mock).mockResolvedValue(user);
            (updatePostValidator as jest.Mock).mockResolvedValue(null);

            models.Post.findById = jest.fn().mockResolvedValue(post);
            models.Post.findByIdAndUpdate = jest.fn().mockResolvedValue({
                ...post,
                tweet: postInput.tweet,
            });

            const UPDATE_POST = `
                mutation UpdatePost($input: UpdatePostInput!) {
                    updatePost(input: $input) {
                        id
                        tweet
                    }
                }
            `;

            const response = await request(app).post('/').send({
                query: UPDATE_POST,
                variables: { input: postInput }
            });

            const { data, errors } = response.body;
            expect(errors).toBeUndefined();
            expect(data.updatePost).toBeTruthy();
            expect(data.updatePost.tweet).toBe(postInput.tweet);
        });

        it('should fail to update a post when user is not authenticated', async () => {
            const postInput = {
                postId: new ObjectId().toString(),
                tweet: 'This is an updated post',
            };

            (decryptToken as jest.Mock).mockResolvedValue(null);

            const UPDATE_POST = `
                mutation UpdatePost($input: UpdatePostInput!) {
                    updatePost(input: $input) {
                        id
                        tweet
                        createdBy {
                            id
                            name
                        }
                    }
                }
            `;

            const response = await request(app).post('/').send({
                query: UPDATE_POST,
                variables: { input: postInput }
            });

            const { errors } = response.body;
            expect(errors).toBeTruthy();
            expect(errors[0].message).toBe("User not authenticated");
        });

        it('should fail to update a post when user is not the owner', async () => {
            const postInput = {
                postId: '1',
                tweet: 'This is an updated post',
            };

            const user = {
                id: new ObjectId(),
                name: 'Test User',
                email: 'test@example.com',
            };

            const anotherUser = {
                id: new ObjectId(),
                name: 'Another User',
                email: 'another@example.com',
            };

            const post = {
                id: postInput.postId,
                tweet: 'This is a test post',
                createdBy: anotherUser.id,
            };

            (decryptToken as jest.Mock).mockResolvedValue(user);
            (updatePostValidator as jest.Mock).mockResolvedValue(null);

            models.Post.findById = jest.fn().mockResolvedValue(post);

            const UPDATE_POST = `
                mutation UpdatePost($input: UpdatePostInput!) {
                    updatePost(input: $input) {
                        id
                        tweet
                    }
                }
            `;

            const response = await request(app).post('/').send({
                query: UPDATE_POST,
                variables: { input: postInput }
            });

            const { errors } = response.body;
            expect(errors).toBeTruthy();
            expect(errors[0].message).toBe("Not authorized to update this post");
        });
    });

    describe('deletePost', () => {
        it('should delete a post when user is authenticated and is the owner', async () => {
            const postId = '1';

            const user = {
                id: new ObjectId(),
                name: 'Test User',
                email: 'test@example.com',
            };

            const post = {
                id: postId,
                tweet: 'This is a test post',
                createdBy: user.id,
                remove: jest.fn().mockResolvedValue(true),
            };

            (decryptToken as jest.Mock).mockResolvedValue(user);

            models.Post.findOne = jest.fn().mockResolvedValue(post);
            models.Post.findByIdAndDelete = jest.fn().mockResolvedValue(post);
            models.User.findByIdAndUpdate = jest.fn().mockResolvedValue({});

            const DELETE_POST = `
                mutation DeletePost($postId: String!) {
                    deletePost(postId: $postId) {
                        success
                        message
                    }
                }
            `;

            const response = await request(app).post('/').send({
                query: DELETE_POST,
                variables: { postId }
            });

            const { data, errors } = response.body;
            expect(errors).toBeUndefined();
            expect(data.deletePost).toBeTruthy();
            expect(data.deletePost.success).toBe(true);
            expect(data.deletePost.message).toBe("Post deleted successfully");
        });

        it('should fail to delete a post when user is not authenticated', async () => {
            const postId = new ObjectId().toString();

            (decryptToken as jest.Mock).mockResolvedValue(null);

            const DELETE_POST = `
                mutation DeletePost($postId: String!) {
                    deletePost(postId: $postId) {
                        success
                        message
                    }
                }
            `;

            const response = await request(app).post('/').send({
                query: DELETE_POST,
                variables: { postId }
            });

            const { errors } = response.body;
            expect(errors).toBeTruthy();
            expect(errors[0].message).toBe("User not authenticated");
        });

        it('should fail to delete a post when user is not the owner', async () => {
            const postId = '1';

            const user = {
                id: new ObjectId(),
                name: 'Test User',
                email: 'test@example.com',
            };

            const anotherUser = {
                id: new ObjectId(),
                name: 'Another User',
                email: 'another@example.com',
            };

            const post = {
                id: postId,
                tweet: 'This is a test post',
                createdBy: anotherUser.id,
            };

            (decryptToken as jest.Mock).mockResolvedValue(user);

            models.Post.findOne = jest.fn().mockResolvedValue(post);

            const DELETE_POST = `
                mutation DeletePost($postId: String!) {
                    deletePost(postId: $postId) {
                        success
                        message
                    }
                }
            `;

            const response = await request(app).post('/').send({
                query: DELETE_POST,
                variables: { postId }
            });

            const { errors } = response.body;
            expect(errors).toBeTruthy();
            expect(errors[0].message).toBe("Not authorized to delete this post");
        });
    });
});
