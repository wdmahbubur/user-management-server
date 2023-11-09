"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = __importDefault(require("./database"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const authorize = async (context) => {
    const { token } = context;
    if (!token) {
        throw new Error('No authorization token found');
    }
    const secret = process.env.JWT_SECRET || '';
    try {
        const { userId } = jsonwebtoken_1.default.verify(token, Buffer.from(secret, 'base64'));
        const user = await database_1.default.user.findUnique({ where: { id: userId } });
        return { user };
    }
    catch (e) {
        throw new Error('Invalid token');
    }
};
const resolvers = {
    Query: {
        users: (_parent, _args, _context) => {
            return database_1.default.user.findMany({ include: { posts: true } });
        },
        posts: async (_, __, context) => {
            await authorize(context);
            return database_1.default.post.findMany({ include: { user: true } });
        },
    },
    Mutation: {
        createUser: async (_parent, args, _context, _info) => {
            const { name, email, password } = args;
            const hashedPassword = await bcrypt_1.default.hash(password, 10);
            const user = await database_1.default.user.create({
                data: {
                    name,
                    email,
                    password: hashedPassword
                }
            });
            return user;
        },
        login: async (_parent, args, _context, _info) => {
            const { email, password } = args;
            const user = await database_1.default.user.findUnique({
                where: {
                    email
                }
            });
            if (!user) {
                throw new Error('User not found');
            }
            const passwordMatch = await bcrypt_1.default.compare(password, user.password);
            if (!passwordMatch) {
                throw new Error('Wrong password');
            }
            const secret = process.env.JWT_SECRET;
            if (!secret) {
                throw new Error('JWT secret not found');
            }
            const token = jsonwebtoken_1.default.sign({ userId: user.id }, Buffer.from(secret, 'base64'), { expiresIn: '1d' });
            return Object.assign(Object.assign({}, user), { token });
        },
        createPost: async (_parent, args, context, _info) => {
            const { text, userId } = args;
            await authorize(context);
            const user = await database_1.default.user.findUnique({
                where: {
                    id: userId
                }
            });
            if (!user) {
                throw new Error('User not found');
            }
            const post = await database_1.default.post.create({
                data: {
                    text,
                    userId
                },
                include: {
                    user: true
                }
            });
            return post;
        },
        updatePost: async (_parent, args, context, _info) => {
            const { text, id } = args;
            await authorize(context);
            const post = await database_1.default.post.update({
                where: {
                    id
                },
                data: {
                    text
                },
                include: {
                    user: true
                }
            });
            return post;
        },
    }
};
exports.default = resolvers;
//# sourceMappingURL=resolvers.js.map