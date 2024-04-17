import express from 'express'
import { createClient } from "redis";
import { PrismaClient } from '@prisma/client'
import bodyParser from 'body-parser';

let prisma = new PrismaClient()

const Redis = createClient({
    password: '93yDM29DC2XjVXPigsSerWvXaY6yFbYk',
    socket: {
        host: 'redis-15621.c305.ap-south-1-1.ec2.cloud.redislabs.com',
        port: 15621
    }
});
Redis.on('error', err => console.log('Redis Client Error', err));


const app = express()
app.use(bodyParser.json());
const httpServer = app.listen(3000)

async function startWorkwer() {
    try{
        await Redis.connect();
        console.log("Worker connected to Redis")
    while(true){
        try{
            const submission = await Redis.brPop("posts", 0);
            console.log("This is the worker")
            const { user, image, latitude, longitude} = JSON.parse(submission!.element)
            //consider user as email
            console.log(user)
            console.log(image)
            console.log(latitude)
            console.log(longitude)
        } catch (error) {
            console.error("Error processing submission: ",error);
        }
    }
    } catch (error) {
        console.error("Failed to connect to Redis", error)
    }
}

startWorkwer();

app.post('/signIn', async (req, res) => {
    const { email, firstname, lastname, MobileNo, password } = req.body;
    if (!password) {
        return res.status(400).json({ error: 'Password is required' });
    }
    try {
        let user = await prisma.user.findUnique({
            where: {
                email: email.toString()
            }
        });
        if (!user) {
            user = await prisma.user.create({
                data: {
                    email,
                    firstname,
                    lastname,
                    MobileNo,
                    password
                }
            });
            res.json({ created: true, user });
        } else {
            res.json({ created: false, user });
        }
    } catch (error) {
        console.error('Error querying/creating user:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/signUp', async (req, res) => {
    const { email } = req.body;
    try {
        const user = await prisma.user.findUnique({
            where: {
                email: email
            }
        });
        if (user) {
            return res.json({ user });
        } else {
            return res.json({ message: 'User does not exist' });
        }
    } catch (error) {
        console.error('Error checking user:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});


app.post('/createPost', async (req, res) => {
    const { email, content, longitude, latitude, image } = req.body;
    try {
        const user = await prisma.user.findUnique({
            where: {
                email: email
            }
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        const post = await prisma.post.create({
            data: {
                content,
                longitude,
                latitude,
                image,
                userId: user.id
            }
        });
        return res.json({ post });
    } catch (error) {
        console.error('Error creating post:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/userPosts', async (req, res) => {
    const { email } = req.body;
    try {
        const user = await prisma.user.findUnique({
            where: {
                email: email.toString()
            }
        });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        const userPosts = await prisma.post.findMany({
            where: {
                userId: user.id
            }
        });
        return res.json({ userPosts });
    } catch (error) {
        console.error('Error getting user posts:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

app.delete('/deletePost', async (req, res) => {
    const { postId } = req.body;
    if (!postId) {
        return res.status(400).json({ error: 'Post ID is required in the request body' });
    }
    try {
        const post = await prisma.post.findUnique({
            where: {
                id: parseInt(postId)
            }
        });
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }
        await prisma.post.delete({
            where: {
                id: parseInt(postId)
            }
        });
        return res.json({ message: 'Post deleted successfully' });
    } catch (error) {
        console.error('Error deleting post:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/posts', async (req, res) => {
    try {
        const posts = await prisma.post.findMany();

        return res.json({ posts });
    } catch (error) {
        console.error('Error fetching posts:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});




