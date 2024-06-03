import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from '@apollo/server/express4';
import { stopServer, typeDefs } from "../server";
import { resolvers } from "../graphql/resolvers";
import { models } from "../models";
import express, { query } from "express";
import { decryptToken, comparePassword, getToken } from "../helpers/auth";
import { SigninValidator } from "../validation/authValidation";
import request from 'supertest';

jest.mock('../helpers/auth', () => ({
    comparePassword: jest.fn(),
    getToken: jest.fn(),
    decryptToken: jest.fn(),
}));

jest.mock('../validation/authValidation', () => ({
    SigninValidator: jest.fn(),
}));

describe('Login resolvers', () => {
    let server : ApolloServer;
    let app : express.Express;

    beforeAll(async () => {
        server = new ApolloServer({
            typeDefs,
            resolvers,
        });
        await server.start();
        app = express();
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

    it('should login a user with correct credentials', async () => {
        const userInput = {
            email: 'test@example.comn',
            password: 'testpassword',
        };

        const user = {
            id: '1',
            name: 'Test User',
            email: userInput.email,
            password: 'hashedpassword',
        };

        (SigninValidator as jest.Mock).mockResolvedValue(null);
        (comparePassword as jest.Mock).mockResolvedValue(true);
        (getToken as jest.Mock).mockReturnValue('mockToken');

        models.User.findOne = jest.fn().mockResolvedValue(user);

        const LOGIN_USER = `
            mutation LoginUser ($input: UserSignInInput!) {
                signInUser(input : $input) {
                    token
                    name
                    email
                }
            }
        `;

        const response = await request(app).post('/').send({
            query: LOGIN_USER,
            variables: {input: userInput}
        });

        const { data, errors } = response.body;
        expect(errors).toBeUndefined();
        expect(data.signInUser).toBeTruthy();
        expect(data.signInUser.token).toBe('mockToken');
        expect(data.signInUser.email).toBe(userInput.email);
    });

    it('should return an error if credentials are incorrect', async () => {
        const userInput = {
            email: 'test@example.com',
            password: 'wrongpassword',
        }

        models.User.findOne = jest.fn().mockResolvedValue(null);

        (SigninValidator as jest.Mock).mockResolvedValue(null);
        (comparePassword as jest.Mock).mockResolvedValue(false);

        const SIGNIN_USER = `
            mutation SignInUser ($input : UserSignInInput\!){
                signInUser(input : $input){
                    token
                    email
                    name
                }
            }
        `;

        const response = await request(app).post('/').send({
            query: SIGNIN_USER,
            variables: {input: userInput}
        });

        const { errors } = response.body;
        expect(errors).toBeTruthy();
        expect(errors[0].message).toBe('User with this email does not exist');
    });
});