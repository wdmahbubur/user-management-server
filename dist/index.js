"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const apollo_server_1 = require("apollo-server");
const database_1 = __importDefault(require("./database"));
const schema_1 = __importDefault(require("./schema"));
const resolvers_1 = __importDefault(require("./resolvers"));
require('dotenv').config();
const app = (0, express_1.default)();
const port = 5000;
app.use(express_1.default.urlencoded({ extended: true }));
app.use(express_1.default.json());
const server = new apollo_server_1.ApolloServer({
    typeDefs: schema_1.default,
    resolvers: resolvers_1.default,
    context: async ({ req }) => {
        const token = req.headers.authorization || '';
        return { token };
    },
    formatError: (err) => {
        if (err.message.startsWith("Database Error: ")) {
            return new Error('Internal server error');
        }
        return err;
    },
});
server.listen(port).then(({ url }) => {
    console.log(`🚀  Server ready at ${url}`);
});
app.get('/users', async (_req, res) => {
    const users = await database_1.default.user.findMany({ include: { posts: true } });
    res.json(users);
});
app.get('/posts', async (_req, res) => {
    const posts = await database_1.default.post.findMany({ include: { user: true } });
    res.json(posts);
});
app.post('/post', async (req, res) => {
    const { text, userId } = req.body;
    const post = await database_1.default.post.create({
        data: {
            text,
            userId,
        }
    });
    res.json(post);
});
app.get('/', (_req, res) => {
    res.send('Server Running...!');
});
//# sourceMappingURL=index.js.map