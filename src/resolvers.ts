import prisma from "./database";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// Authorization middleware
const authorize = async (context: any) => {
    const { token } = context;
    if (!token) {
        throw new Error('No authorization token found');
    }

    const secret: String | undefined = process.env.JWT_SECRET || '';

    try {
        const { userId } = jwt.verify(token, Buffer.from(secret, 'base64')) as { userId: string };
        const user = await prisma.user.findUnique({ where: { id: userId } });
        return { user };
    } catch (e) {
        throw new Error('Invalid token');
    }
};

const resolvers = {
    Query: {
        users: (_parent: any, _args: any, _context: any) => {
            //console.log(context);
            return prisma.user.findMany({ include: { posts: true } })
        },
        posts: async (_: any, __: any, context: any) => {
            await authorize(context);
            return prisma.post.findMany({ include: { user: true } })
        },
    },
    Mutation: {
        createUser: async (_parent: any, args: any, _context: any, _info: any) => {
            const { name, email, password } = args;
            const hashedPassword = await bcrypt.hash(password, 10);
            const user = await prisma.user.create({
                data: {
                    name,
                    email,
                    password: hashedPassword
                }
            });
            return user;
        },
        login: async (_parent: any, args: any, _context: any, _info: any) => {
            const { email, password } = args;
            const user = await prisma.user.findUnique({
                where: {
                    email
                }
            });

            if (!user) {
                throw new Error('User not found');
            }

            const passwordMatch = await bcrypt.compare(password, user.password);

            if (!passwordMatch) {
                throw new Error('Wrong password');
            }

            // generate jwt token and return user
            const secret: String | undefined = process.env.JWT_SECRET;
            if (!secret) {
                throw new Error('JWT secret not found');
            }
            const token = jwt.sign({userId: user.id}, Buffer.from(secret, 'base64'), {expiresIn: '1d'});
            
            return {
                ...user,
                token
            };
        },
        createPost: async (_parent: any, args: any, context: any, _info: any) => {
            const { text, userId } = args;
            await authorize(context);
            // validation userId
            const user = await prisma.user.findUnique({
                where: {
                    id: userId
                }
            });

            if (!user) {
                throw new Error('User not found');
            }

            const post = await prisma.post.create({
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
        updatePost: async (_parent: any, args: any, context: any, _info: any) => {
            const { text, id } = args;
            await authorize(context);

            const post = await prisma.post.update({
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

export default resolvers;