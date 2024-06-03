import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from '@apollo/server/express4';
import { stopServer, typeDefs } from "../server";
import { resolvers } from "../graphql/resolvers";
import { models } from "../models";
import express, { query } from "express";
import { decryptToken, hashPassword } from "../helpers/auth";
import { SignupValidator } from "../validation/authValidation";
import request from 'supertest';

jest.mock('../helpers/auth', () => ({
    hashPassword: jest.fn(),
    decryptToken: jest.fn(),
}));

jest.mock('../validation/authValidation', () => ({
    SignupValidator: jest.fn(),
}));

describe('User Resolvers', () => {
    let server : ApolloServer;
    let app : express.Express;

    beforeAll(async () => {
        server = new ApolloServer({
            typeDefs,
            resolvers,
        });
        await server.start();
        app= express();

        app.use(express.json());
        app.use(expressMiddleware(server, {
            context: async ({req}) => {
                const token = req.headers.authorization as string;
                const user = await decryptToken(token);
                return {models, user: user || null};
            }
        }));
    });

    afterAll(async () => {
        await stopServer();
    });

    it('should create a new user', async () => {
        const userInput = {
            name: 'Test User',
            email: 'test@example.com',
            password: 'testpassword',
        };

        (SignupValidator as jest.Mock).mockResolvedValue(null);
        (hashPassword as jest.Mock).mockImplementation((password: string) =>
        Promise.resolve(password)
        );

        const mockSave = jest.fn().mockResolvedValue({
            id: '1',
            name: userInput.name,
            email: userInput.email,
            password: userInput.password,
        });

        models.User.findOne = jest.fn().mockResolvedValue(null);
        models.User.prototype.save = mockSave;

        const CREATE_USER = `
            mutation CreateUser($input: CreateUserInput!) {
                createUser(input: $input) {
                    id
                    name
                    email
                }
            }
        `;

        const response = await request(app).post('/').send({
            query: CREATE_USER,
            variables: { input: userInput },
        });

        const { data, errors } = response.body;
        expect(errors).toBeUndefined();
        expect(data.createUser).toBeTruthy();
        expect(data.createUser.name).toBe(userInput.name);
        expect(data.createUser.email).toBe(userInput.email);
    });
    it("should return an error if the email is already in use", async () => {
        const userInput = { 
            name: 'Test User',
            email: 'test@example.com',
            password: 'testpassword1',
        }

        models.User.findOne = jest.fn().mockResolvedValue({
            id: '1',
            name: userInput.name,
            email: userInput.email,
            password: userInput.password,
        });

        const CREATE_USER = `
            mutation CreateUser($input: CreateUserInput!) {
                createUser(input: $input){
                    id
                    name
                    email
                }
            }
        `;

        const response = await request(app).post('/').send({
            query: CREATE_USER,
            variables: { input: userInput}
        });

        const { errors } = response.body;

        expect(errors).toBeTruthy();
        expect(errors[0].message).toBe('User already exist with this email, try different email');
    });
});