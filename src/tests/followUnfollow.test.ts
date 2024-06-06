import { ApolloServer } from "@apollo/server";
import express, { query } from 'express';
import request from "supertest";
import { expressMiddleware } from "@apollo/server/express4";
import { stopServer, typeDefs } from "../server";
import { resolvers } from "../graphql/resolvers";
import { models } from "../models";
import { decryptToken } from "../helpers/auth";


jest.mock('../helpers/auth', () => ({
    decryptToken: jest.fn(),
}));

describe('Follow/Unfollow resolver', () => {
    let server : ApolloServer;
    let app : express.Express;

    beforeAll(async () => {
        server = new ApolloServer({
            typeDefs,
            resolvers
        });
        await server.start();
        app = express();
        app.use(express.json());
        app.use(expressMiddleware(server, {
            context: async ({req}) => {
                const token = req.headers.authorization as string;
                const user = await decryptToken(token);
                return {
                    models,
                    user: user
                }
            }
        }));
    });
    afterAll(async () => {
        await stopServer();
    });

    describe('follow user', () => {
        it('should follow another user when user is authenticated', async () => {
            const FollowInput = {
                userId : '5'
            };

            const user = {
                id : '1',
                name: 'ashu',
                email: 'ashu@gmail.com',
                followers: [],
            };

            const anotherUser = {
                id: '5',
                name: 'Test User',
                email: 'Test@gmail.com'
            };

            (decryptToken as jest.Mock).mockResolvedValue(user);

            models.User.findOne = jest.fn().mockResolvedValue(anotherUser);

            jest.spyOn(models.User, 'findByIdAndUpdate').mockResolvedValue({});
            jest.spyOn(models.User, 'findByIdAndUpdate').mockResolvedValue({});

            models.User.findOne = jest.fn().mockResolvedValue(user);

            const FOLLOW_USER = `
                mutation FollowUser($input: FollowUserInput!){
                    followUser(input: $input){
                        id
                        name
                    }
                }
            `

            const response = await request(app).post('/').send({
                query: FOLLOW_USER,
                variables: { input: FollowInput}
            });

            const { data, errors } = response.body;
            expect(errors).toBeUndefined();
            expect(data.followUser).toBeTruthy();
        });

        it('should failed to follow another user when user it not authenticated', async () => {
            const FollowInput = {
                userId : '5'
            };

            (decryptToken as jest.Mock).mockResolvedValue(null);

            const FOLLOW_USER = `
                mutation FollowUser($input: FollowUserInput!){
                    followUser(input: $input){
                        id
                        name
                    }
                }
            `

            const response = await request(app).post('/').send({
                query: FOLLOW_USER,
                variables: { input: FollowInput}
            });

            const { errors } = response.body;
            expect(errors).toBeTruthy();
            expect(errors[0].message).toBe("User not authenticated");
        });
    });

    describe('unfollow user', () => {
        it('should unfollow another user when user is authenticated', async () => {
            const unfollowInput = {
              userId: '5'
            };
      
            const user = {
              id: '1',
              name: 'ashu',
              email: 'ashu@gmail.com',
              followings: ['5'],
            };
      
            const anotherUser = {
              id: '5',
              name: 'Test User',
              email: 'Test@gmail.com',
              followers: ['1'],
            };
      
            (decryptToken as jest.Mock).mockResolvedValue(user);
            
            models.User.findOne = jest.fn()
              .mockResolvedValueOnce(anotherUser)
              .mockResolvedValueOnce(user);
      
            jest.spyOn(models.User, 'findByIdAndUpdate').mockResolvedValue({});
      
            const UNFOLLOW_USER = `
              mutation UnfollowUser($input: UnfollowUserInput!) {
                unfollowUser(input: $input) {
                  id
                  name
                }
              }
            `;
      
            const response = await request(app).post('/').send({
              query: UNFOLLOW_USER,
              variables: { input: unfollowInput }
            });
      
            const { data, errors } = response.body;
            expect(errors).toBeUndefined();
            expect(data.unfollowUser).toBeTruthy();
            expect(data.unfollowUser.id).toBe(user.id);
            expect(data.unfollowUser.name).toBe(user.name);
          });

          it('should fail to unfollow a user when not authenticated', async () => {
            const unfollowInput = {
              userId: '5'
            };
      
            (decryptToken as jest.Mock).mockResolvedValue(null);
      
            const UNFOLLOW_USER = `
              mutation UnfollowUser($input: UnfollowUserInput!) {
                unfollowUser(input: $input) {
                  id
                  name
                }
              }
            `;
      
            const response = await request(app).post('/').send({
              query: UNFOLLOW_USER,
              variables: { input: unfollowInput }
            });
      
            const { errors } = response.body;
            expect(errors).toBeTruthy();
            expect(errors[0].message).toBe("User not authenticated");
          });

          it('should fail to unfollow a user that does not exist', async () => {
            const unfollowInput = {
              userId: '5'
            };
      
            const user = {
              id: '1',
              name: 'ashu',
              email: 'ashu@gmail.com',
              followings: ['5'],
            };
      
            (decryptToken as jest.Mock).mockResolvedValue(user);
            models.User.findOne = jest.fn()
              .mockResolvedValueOnce(null);
      
            const UNFOLLOW_USER = `
              mutation UnfollowUser($input: UnfollowUserInput!) {
                unfollowUser(input: $input) {
                  id
                  name
                }
              }
            `;
      
            const response = await request(app).post('/').send({
              query: UNFOLLOW_USER,
              variables: { input: unfollowInput }
            });
      
            const { errors } = response.body;
            expect(errors).toBeTruthy();
            expect(errors[0].message).toBe("Cannot Unfollow, User does not exist");
          });
    });
});