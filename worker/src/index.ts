import express from 'express'
import { createClient } from "redis";
import { PrismaClient } from '@prisma/client'
import bodyParser from 'body-parser';
import  cors from 'cors';

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
app.use(cors())
const httpServer = app.listen(3000)

async function startWorkwer() {
    try{
        await Redis.connect();
        console.log("Worker connected to Redis")
    while(true){
        try{
            const submission = await Redis.brPop("posts", 0);
            console.log("This is the worker")
            const { email, image, latitude, longitude} = JSON.parse(submission!.element)
            const imageData = JSON.parse(image);
            const finalURL = imageData.signedUrl;
            console.log(finalURL)
            const data = {
                url: finalURL
            };
            console.log(email)
            console.log(image)
            console.log(latitude)
            console.log(longitude)
            console.log("The model will start working now")
            const response = await fetch('http://ec2-13-232-224-92.ap-south-1.compute.amazonaws.com:3000/upload/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            const responseBody = await response.json();
            console.log(responseBody.description)
            console.log(responseBody.sentiment)
            const user = await prisma.user.findUnique({
                where: {
                    email: email
                }
            });
            const newPost = await prisma.post.create({
                    data: {
                        content: responseBody.description,
                        longitude: longitude,
                        latitude: latitude,
                        image: finalURL,
                        sentiment: responseBody.sentiment,
                        censor: "true",
                        userId: user!.id
                    }
                });
                console.log("New post created:", newPost);
        } catch (error) {
            console.error("Error processing submission: ",error);
        }
    }
    } catch (error) {
        console.error("Failed to connect to Redis", error)
    }
}

startWorkwer();

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
    const { email, content, longitude, latitude, image, sentiment, censor } = req.body;
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
                sentiment,
                censor,
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
    const { email, censor } = req.body;
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
                censor: "true"
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

app.get('/getpostId', async (req, res) => {
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

app.put('/postcensor', async (req, res) => {
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
        let updatedCensor;
        if (post.censor === "true") {
            updatedCensor = "false";
        } else if (post.censor === "false") {
            updatedCensor = "true";
        } else {
            return res.status(400).json({ error: 'Invalid censor value' });
        }
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
        const posts = await prisma.post.findMany();

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



