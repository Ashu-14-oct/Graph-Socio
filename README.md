# GraphQL API with Express, Apollo Server, and MongoDB

This project is a GraphQL API built with Express, Apollo Server, and MongoDB. It supports user authentication, creating posts, commenting on posts, and adding friends.

## Project Demo

[![Watch the video](https://img.youtube.com/vi/FhxPhUFaU3U/0.jpg)](https://www.youtube.com/watch?v=FhxPhUFaU3U)

## Features

- User registration and login with password hashing
- JWT-based authentication
- Follow and unfollow other users
- Create and fetch posts
- Create and fetch comments on posts
- Input validation using Joi

## Project Structure

```plaintext
.
├── config
│   └── mongoose.config.ts
├── graphql
│   ├── resolvers.ts
│   └── schema.graphql
├── helpers
│   └── auth.ts
├── models
│   ├── User.ts
│   ├── Post.ts
│   └── Comment.ts
├── validation
│   └── authValidation.ts
│   └── postValidator.ts
├── .env
├── package.json
├── server.ts
└── README.md
```

## Prerequisites

Before you begin, ensure you have met the following requirements:

- Node.js
- npm
- MongoDB

## Installation

1. Clone the repository:

    ```sh
    git clone https://github.com/Ashu-14-oct/Graph-Socio.git
    cd Graph-Socio
    ```

2. Install dependencies:

    ```sh
    npm install
    ```
3. Build the project:
   ```sh
    npm build
    ```
4. start the Application
   ```sh
   npm start 
   ```
5. For development, you can use:
   ```sh
   npm intsall ts-node-dev --save-dev
   npm run dev 
   ```