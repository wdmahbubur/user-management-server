"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const apollo_server_1 = require("apollo-server");
const typeDefs = (0, apollo_server_1.gql) `
    type user {
        id: String!
        name: String!
        email: String!
        token: String
        posts: [post!]!
    }
    type post {
        id: String!
        text: String!
        user: user
        userId: String!
    }
    type Query {
        users: [user!]
        posts: [post!]
    }

    type Mutation {
        createUser(name: String!, email: String!, password: String!): user!
        login(email: String!, password: String!): user!
        createPost(text: String!, userId: String!): post!
        updatePost(text: String!, id: String!): post!
    }
`;
exports.default = typeDefs;
//# sourceMappingURL=schema.js.map