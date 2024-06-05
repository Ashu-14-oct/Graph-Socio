import { ApolloServer } from "@apollo/server";
import express from "express";
import request from "supertest";
import { expressMiddleware } from "@apollo/server/express4";
import { stopServer, typeDefs } from "../server";
import { resolvers } from "../graphql/resolvers";
import { models } from "../models";
import { decryptToken } from "../helpers/auth";
import { commentValidator } from "../validation/postValidation";
import mongoose from "mongoose";
const { ObjectId } = mongoose.Types;

jest.mock('../helpers/auth', () => ({
    decryptToken: jest.fn()
}));

jest.mock('../validation/postValidation', () => ({
    commentValidator: jest.fn(),
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
});
