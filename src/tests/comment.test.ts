import { ApolloServer } from "@apollo/server";
import express from "express";
import request from "supertest";
import { expressMiddleware } from "@apollo/server/express4";
import { stopServer, typeDefs } from "../server";
import { resolvers } from "../graphql/resolvers";
import { models } from "../models";
import { decryptToken } from "../helpers/auth";
import { commentValidator, updateCommentValidator } from "../validation/postValidation";
import mongoose from "mongoose";
const { ObjectId } = mongoose.Types;

jest.mock('../helpers/auth', () => ({
    decryptToken: jest.fn()
}));

jest.mock('../validation/postValidation', () => ({
    commentValidator: jest.fn(),
    updateCommentValidator: jest.fn(),
}));

describe('Comment resolvers', () => {
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
                return { token, user: user || null, models };
            }
        }));
    });

    afterAll(async () => {
        await stopServer();
    });

    describe('create comment', () => {
        it('should create a comment when user is authenticated', async () => {
            const commentInput = {
                postId: '1',
                comment: 'this is a test comment'
            };

            const user = {
                id: '2',
                name: 'Test user',
                email: 'test@mail.com'
            };

            (decryptToken as jest.Mock).mockResolvedValue(user);
            (commentValidator as jest.Mock).mockResolvedValue(null);

            const mockSave = jest.fn().mockResolvedValue({
                id: new ObjectId().toString(),
                comment: commentInput.comment,
                createdBy: user.id,
            });

            jest.spyOn(models.Comment.prototype, 'save').mockImplementation(mockSave);
            jest.spyOn(models.Post, 'findByIdAndUpdate').mockResolvedValue({});
            jest.spyOn(models.User, 'findByIdAndUpdate').mockResolvedValue({});

            const CREATE_COMMENT = `
                mutation CreateComment($input: CreateCommentInput!) {
                    createComment(input: $input) {
                        id
                        comment
                    }
                }
            `;

            const response = await request(app).post('/').send({
                query: CREATE_COMMENT,
                variables: { input: commentInput }
            });

            const { data, errors } = response.body;
            expect(errors).toBeUndefined();
            expect(data.createComment).toBeTruthy();
            expect(data.createComment.comment).toBe(commentInput.comment);
        });

        it('should fail to create a comment when user is not authenticated', async () => {
            const commentInput = {
                postId: '1',
                comment: 'this is a test comment'
            };

            (decryptToken as jest.Mock).mockResolvedValue(null);

            const CREATE_COMMENT = `
                mutation CreateComment($input: CreateCommentInput!) {
                    createComment(input: $input) {
                        id
                        comment
                    }
                }
            `;

            const response = await request(app).post('/').send({
                query: CREATE_COMMENT,
                variables: { input: commentInput }
            });

            const { errors } = response.body;
            expect(errors).toBeTruthy();
            expect(errors[0].message).toBe("User not authenticated");
        });
    });

    describe('update comment', () => {
        it('should update a comment when user is authenticated and is the owner', async () => {
            const commentInput = {
                commentId: '2',
                comment: 'This is an updated comment',
            };

            const user = {
                id: new ObjectId(),
                name: 'Test User',
                email: 'test@example.com',
            };

            const comment = {
                id: commentInput.commentId,
                comment: 'This is a test post',
                createdBy: user.id,
            };

            (decryptToken as jest.Mock).mockResolvedValue(user);
            (updateCommentValidator as jest.Mock).mockResolvedValue(null);

            models.Comment.findById = jest.fn().mockResolvedValue(comment);
            models.Comment.findByIdAndUpdate = jest.fn().mockResolvedValue({
                ...comment,
                comment: commentInput.comment,
            });

            const UPDATE_COMMENT = `
                mutation UpdateComment($input: UpdateCommentInput!) {
                    updateComment(input: $input) {
                        id
                        comment
                    }
                }
            `;

            const response = await request(app).post('/').send({
                query: UPDATE_COMMENT,
                variables: { input: commentInput }
            });

            const { data, errors } = response.body;
            expect(errors).toBeUndefined();
            expect(data.updateComment).toBeTruthy();
            expect(data.updateComment.comment).toBe(commentInput.comment);
        });

        it('should fail to update a comment when user is not authenticated', async () => {
            const commentInput = {
                commentId: '2',
                comment: 'This is an updated post',
            };

            (decryptToken as jest.Mock).mockResolvedValue(null);

            const UPDATE_COMMENT = `
                mutation UpdateComment($input: UpdateCommentInput!) {
                    updateComment(input: $input) {
                        id
                        comment
                    }
                }
            `;

            const response = await request(app).post('/').send({
                query: UPDATE_COMMENT,
                variables: { input: commentInput }
            });

            const { errors } = response.body;
            expect(errors).toBeTruthy();
            expect(errors[0].message).toBe("User not authenticated");
        });

        it('should fail to update a post when user is not the owner', async () => {
            const commentInput = {
                commentId: '2',
                comment: 'This is an updated post',
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

            const comment = {
                id: commentInput.commentId,
                comment: 'This is a test post',
                createdBy: anotherUser.id,
            };

            (decryptToken as jest.Mock).mockResolvedValue(user);
            (updateCommentValidator as jest.Mock).mockResolvedValue(null);

            models.Post.findById = jest.fn().mockResolvedValue(comment);
            models.Comment.findByIdAndUpdate = jest.fn().mockResolvedValue({
                ...comment,
                comment: commentInput.comment,
            });

            const UPDATE_COMMENT = `
                mutation UpdateComment($input: UpdateCommentInput!) {
                    updateComment(input: $input) {
                        id
                        comment
                    }
                }
            `;

            const response = await request(app).post('/').send({
                query: UPDATE_COMMENT,
                variables: { input: commentInput }
            });

            const { errors } = response.body;
            expect(errors).toBeTruthy();
            expect(errors[0].message).toBe("Not authorized to update this comment");
        });
    });
});
