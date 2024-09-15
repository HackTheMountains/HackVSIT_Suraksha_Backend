import express from 'express'
import { createClient } from "redis";
import { PrismaClient } from '@prisma/client'
import bodyParser from 'body-parser';
import  cors from 'cors';

let prisma = new PrismaClient()

const Redis = createClient({
    password: 'L07dyz33z8RUKuUBLGcgIxqfY46IAxZs',
    socket: {
        host: 'redis-15911.c305.ap-south-1-1.ec2.redns.redis-cloud.com',
        port: 15911
    }
});

Redis.on('error', err => console.log('Redis Client Error', err));


const app = express()
app.use(bodyParser.json());
app.use(cors())
const httpServer = app.listen(3000)

async function startWorker() {
    try {
        await Redis.connect();
        console.log("Worker connected to Redis");
        while (true) {
            try {
                const submission = await Redis.brPop("posts", 0);
                console.log("Processing a new post from Redis queue");
                const { email, image, latitude, longitude } = JSON.parse(submission!.element);
                const data = { url: image };
                const responseData = await fetch('http://ec2-3-106-200-134.ap-southeast-2.compute.amazonaws.com:8000/upload', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                const responseBody = await responseData.json();
                const description = responseBody.response;
                const severity = responseBody.severity;
                console.log(`Model response: Description: ${description}, Sentiment: ${severity}`);
                const user = await prisma.user.findUnique({
                    where: { email }
                });

                if (!user) {
                    console.error("User not found for email:", email);
                    continue;
                }
                const newPost = await prisma.post.create({
                    data: {
                        content: description,
                        longitude,
                        latitude,
                        image: image,
                        sentiment: severity,
                        userId: user.id
                    }
                });
                console.log("New post created successfully:", newPost);
            } catch (error) {
                console.error("Error processing submission:", error);
            }
        }
    } catch (error) {
        console.error("Failed to connect to Redis:", error);
    }
}


startWorker();

app.post('/signUp', async (req, res) => {
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
            console.log()
            res.json({ created: true, user });
        } else {
            res.json({ created: false, user });
        }
    } catch (error) {
        console.error('Error querying/creating user:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/signIn', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await prisma.user.findUnique({
            where: {
                email: email,
                password: password
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
    const { email, longitude, latitude, image } = req.body;
    try {
        const user = await prisma.user.findUnique({
            where: {
                email: email
            }
        });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        const data = {
            email,
            longitude,
            latitude,
            image
        };
        console.log('Sending image to model:', data);
        const responseData = await fetch('http://ec2-3-106-200-134.ap-southeast-2.compute.amazonaws.com:8000/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({"url": image})
        });
        const responseBody = await responseData.json();
        const content = responseBody.response;
        const sentiment = responseBody.severity;
        const post = await prisma.post.create({
            data: {
                content,
                longitude,
                latitude,
                image,
                sentiment,
                userId: user.id
            }
        });

        return res.json({ post });
    } catch (error) {
        console.error('Error creating post:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});


app.post('/userPosts', async (req, res) => {
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
                userId: user.id,
                censor: false
            },
            include: {
                statuses: true
            }
        });
        return res.json({ userPosts });
    } catch (error) {
        console.error('Error getting user posts:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/deletePost', async (req, res) => {
    const { postId } = req.body;
    if (!postId) {
        return res.status(400).json({ error: 'Post ID is required in the request body' });
    }
    try {
        const post = await prisma.post.findUnique({
            where: { id: parseInt(postId) }
        });
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }
        await prisma.post.delete({
            where: { id: parseInt(postId) }
        });
        return res.json({ message: 'Post and its statuses deleted successfully' });
    } catch (error) {
        console.error('Error deleting post:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/getpostId', async (req, res) => {
    const { postId } = req.body;
    try {
        const post = await prisma.post.findUnique({
            where: {
                id: parseInt(postId)
            },
            include: {
                User: true
            }
        });
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }
        return res.json({ post });
    } catch (error) {
        console.error('Error getting post:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/postcensor', async (req, res) => {
    const { postId } = req.body;
    try {
        const post = await prisma.post.findUnique({
            where: {
                id: parseInt(postId)
            }
        });
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }
        const updatedCensor = !post.censor;
        const updatedPost = await prisma.post.update({
            where: {
                id: parseInt(postId)
            },
            data: {
                censor: updatedCensor
            }
        });
        return res.json({ message: 'Censor value updated successfully', post: updatedPost });
    } catch (error) {
        console.error('Error updating censor value:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/posts', async (req, res) => {
    try {
        const posts = await prisma.post.findMany({
            include: {
                statuses: true,
            }
        });
        return res.json({ posts });
    } catch (error) {
        console.error('Error fetching posts:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});


app.post('/admin', async (req, res) => {
    const { username, password } = req.body;
    try {
        const admin = await prisma.admin.findFirst({
            where: { username: username, password: password }
        });
        if(admin){
        return res.status(200).json({ message: "Yes" });
        } else {
            return res.status(200).json({message: "No"})
        }
    } catch (error) {
        console.error('Error during admin login:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
});

app.get('/totalPosts', async (req, res) => {
    try {
        const totalPosts = await prisma.post.count();
        return res.json({ totalPosts });
    } catch (error) {
        console.error('Error getting total number of posts:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/userTotalPosts', async (req, res) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ error: 'Email is required' });
    }
    try {
        const user = await prisma.user.findUnique({
            where: { email: email.toString() }
        });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        const totalPosts = await prisma.post.count({
            where: { userId: user.id }
        });
        return res.json({ totalPosts });
    } catch (error) {
        console.error('Error getting total number of user posts:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/toggleCompleted', async (req, res) => {
    const { postId } = req.body;
    if (!postId) {
        return res.status(400).json({ error: 'Post ID is required' });
    }
    try {
        const post = await prisma.post.findUnique({
            where: { id: parseInt(postId) }
        });
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }
        const updatedPost = await prisma.post.update({
            where: { id: parseInt(postId) },
            data: {
                completed: !post.completed
            }
        });
        return res.json({
            message: 'Completed status toggled successfully',
            post: updatedPost
        });
    } catch (error) {
        console.error('Error toggling completed status:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/totalCompletedPosts', async (req, res) => {
    try {
        const totalCompletedPosts = await prisma.post.count({
            where: { completed: true }
        });
        return res.json({ totalCompletedPosts });
    } catch (error) {
        console.error('Error getting total number of completed posts:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/userCompletedPosts', async (req, res) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ error: 'Email is required' });
    }
    try {
        const user = await prisma.user.findUnique({
            where: { email: email.toString() }
        });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        const userCompletedPosts = await prisma.post.count({
            where: {
                userId: user.id,
                completed: true
            }
        });
        return res.json({ userCompletedPosts });
    } catch (error) {
        console.error('Error getting total number of completed user posts:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/getStatuses', async (req, res) => {
    const { postId } = req.body;
    if (!postId) {
        return res.status(400).json({ error: 'Post ID is required' });
    }
    try {
        const post = await prisma.post.findUnique({
            where: {
                id: parseInt(postId)
            },
            include: {
                statuses: true
            }
        });
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }
        return res.json({ statuses: post.statuses });
    } catch (error) {
        console.error('Error fetching statuses:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/createStatus', async (req, res) => {
    const { postId, content } = req.body;
    if (!postId || !content) {
        return res.status(400).json({ error: 'Post ID and content are required' });
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
        const status = await prisma.status.create({
            data: {
                name: content,
                postId: parseInt(postId)
            }
        });
        return res.json({ status });
    } catch (error) {
        console.error('Error creating status:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/uncensoredPosts', async (req, res) => {
    try {
        const posts = await prisma.post.findMany({
            where: {
                censor: false
            },
            include: {
                statuses: true,
            }
        });
        return res.json({ posts });
    } catch (error) {
        console.error('Error fetching uncensored posts:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});