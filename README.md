# GraphQL API with Express, Apollo Server, and MongoDB

This project is a GraphQL API built with Express, Apollo Server, and MongoDB. It supports user authentication, creating posts, commenting on posts, and adding friends.

## Features

- User registration and login with password hashing
- JWT-based authentication
- Create and fetch posts
- Create and fetch comments on posts
- Add friends
- Input validation using Joi

## Project Structure

```plaintext
.
├── config
│   └── mongoose.config.js
├── graphql
│   ├── resolvers.js
│   └── schema.graphql
├── helpers
│   └── auth.js
├── models
│   ├── User.js
│   ├── Post.js
│   └── Comment.js
├── validators
│   └── postValidator.js
├── .env
├── package.json
├── server.js
└── README.md
```
