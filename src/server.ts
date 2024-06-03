import dotenv from "dotenv";
dotenv.config();
import cors from 'cors';
import express from "express";
import { ApolloServer } from '@apollo/server';
import {expressMiddleware} from '@apollo/server/express4';
import './config/mongoose.config';
import { resolvers } from "./graphql/resolvers";
import { readFileSync } from "fs";
import { models } from "./models";
import { decryptToken } from "./helpers/auth";
import { closeDatabase } from "./config/mongoose.config";

export const typeDefs = readFileSync('./src/graphql/schema.graphql', {encoding: 'utf-8'});

const PORT = process.env.PORT || 4001;

let serverInstance: any;

export async function startServer(){
    const app = express();
    app.use(express.json());
    app.use(cors());

    const server = new ApolloServer({typeDefs, resolvers});
    await server.start();
    app.use('/', expressMiddleware(server, {
        context: async ({req}) => {
            const token = req.headers.authorization as string;
            const user = await decryptToken(token);

            if(!user){
                return { models, user: null };
            }          
            return {
                models,
                user
            }
        }
    }));

    serverInstance = app.listen(PORT, () => {
        console.log(`server running on PORT ${PORT}`);
    });
}

export async function stopServer() {
    if (serverInstance) {
      await closeDatabase();
      serverInstance.close();
    }
  }

startServer();