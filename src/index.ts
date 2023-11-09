import express from 'express';
import { ApolloServer } from 'apollo-server';
import prisma from './database';
import typeDefs from './schema';
import resolvers from './resolvers';
require('dotenv').config();

const app = express();
const port = 5000;
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: async ({ req }) => {
    const token = req.headers.authorization || '';
    return { token };
  },
  formatError: (err) => {
    // Don't give the specific errors to the client.
    if (err.message.startsWith("Database Error: ")) {
      return new Error('Internal server error');
    }

    // Otherwise return the original error.  The error can also
    // be manipulated in other ways, so long as it's returned.
    return err;
  },
 });

server.listen(port).then(({ url }) => {
  console.log(`🚀  Server ready at ${url}`);
});

app.get('/users', async (_req, res) => {
  const users = await prisma.user.findMany({ include: { posts: true }});
  res.json(users);
});

app.get('/posts', async (_req, res) => {
  const posts = await prisma.post.findMany({ include: { user: true }});
  res.json(posts);
});


app.post('/post', async (req, res) => {
  const { text, userId } = req.body;
  const post = await prisma.post.create({
    data: {
      text,
      userId,
    }
  })
  res.json(post);
});


app.get('/', (_req, res) => {
  res.send('Server Running...!');
});



// app.listen(port, () => {
//   console.log(`Server listening at http://localhost:${port}`);
// });


