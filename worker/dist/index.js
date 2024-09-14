"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const redis_1 = require("redis");
const client_1 = require("@prisma/client");
const body_parser_1 = __importDefault(require("body-parser"));
const cors_1 = __importDefault(require("cors"));
let prisma = new client_1.PrismaClient();
const Redis = (0, redis_1.createClient)({
    password: 'L07dyz33z8RUKuUBLGcgIxqfY46IAxZs',
    socket: {
        host: 'redis-15911.c305.ap-south-1-1.ec2.redns.redis-cloud.com',
        port: 15911
    }
});
Redis.on('error', err => console.log('Redis Client Error', err));
const app = (0, express_1.default)();
app.use(body_parser_1.default.json());
app.use((0, cors_1.default)());
const httpServer = app.listen(3000);
function startWorker() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Connect to Redis
            yield Redis.connect();
            console.log("Worker connected to Redis");
            // Start infinite loop to process Redis queue
            while (true) {
                try {
                    // Wait for a new post in the Redis 'posts' queue
                    const submission = yield Redis.brPop("posts", 0);
                    console.log("Processing a new post from Redis queue");
                    // Parse the data from the submission
                    const { email, image, latitude, longitude } = JSON.parse(submission.element);
                    const imageData = JSON.parse(image);
                    const finalURL = imageData.signedUrl;
                    console.log(`Processing submission from user: ${email}`);
                    console.log(`Image URL: ${finalURL}, Latitude: ${latitude}, Longitude: ${longitude}`);
                    // Send data to external model for processing (this is the commented out part in your code)
                    const data = { url: finalURL };
                    // Uncomment when ready to fetch response from external service
                    // const response = await fetch('http://ec2-13-232-224-92.ap-south-1.compute.amazonaws.com:3000/upload/', {
                    //     method: 'POST',
                    //     headers: { 'Content-Type': 'application/json' },
                    //     body: JSON.stringify(data)
                    // });
                    const response = { description: "This is a test description", sentiment: "positive" };
                    // const responseBody = await response.json();
                    const responseBody = response; // Mocked response for now
                    console.log(`Model response: Description: ${responseBody.description}, Sentiment: ${responseBody.sentiment}`);
                    const user = yield prisma.user.findUnique({
                        where: { email }
                    });
                    if (!user) {
                        console.error("User not found for email:", email);
                        continue;
                    }
                    const newPost = yield prisma.post.create({
                        data: {
                            content: "This is the description",
                            longitude,
                            latitude,
                            image: finalURL,
                            sentiment: "This is sentiment",
                            userId: user.id
                        }
                    });
                    console.log("New post created successfully:", newPost);
                }
                catch (error) {
                    console.error("Error processing submission:", error);
                }
            }
        }
        catch (error) {
            console.error("Failed to connect to Redis:", error);
        }
    });
}
startWorker();
app.post('/signUp', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, firstname, lastname, MobileNo, password } = req.body;
    if (!password) {
        return res.status(400).json({ error: 'Password is required' });
    }
    try {
        let user = yield prisma.user.findUnique({
            where: {
                email: email.toString()
            }
        });
        if (!user) {
            user = yield prisma.user.create({
                data: {
                    email,
                    firstname,
                    lastname,
                    MobileNo,
                    password
                }
            });
            console.log();
            res.json({ created: true, user });
        }
        else {
            res.json({ created: false, user });
        }
    }
    catch (error) {
        console.error('Error querying/creating user:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}));
app.post('/signIn', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password } = req.body;
    try {
        const user = yield prisma.user.findUnique({
            where: {
                email: email,
                password: password
            }
        });
        if (user) {
            return res.json({ user });
        }
        else {
            return res.json({ message: 'User does not exist' });
        }
    }
    catch (error) {
        console.error('Error checking user:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}));
app.post('/createPost', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, content, longitude, latitude, image, sentiment, censor } = req.body;
    try {
        const user = yield prisma.user.findUnique({
            where: {
                email: email
            }
        });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        const post = yield prisma.post.create({
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
    }
    catch (error) {
        console.error('Error creating post:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}));
app.get('/userPosts', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email } = req.body;
    try {
        const user = yield prisma.user.findUnique({
            where: {
                email: email.toString()
            }
        });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        const userPosts = yield prisma.post.findMany({
            where: {
                userId: user.id,
                censor: false
            },
            include: {
                statuses: true
            }
        });
        return res.json({ userPosts });
    }
    catch (error) {
        console.error('Error getting user posts:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}));
app.delete('/deletePost', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { postId } = req.body;
    if (!postId) {
        return res.status(400).json({ error: 'Post ID is required in the request body' });
    }
    try {
        const post = yield prisma.post.findUnique({
            where: { id: parseInt(postId) }
        });
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }
        yield prisma.post.delete({
            where: { id: parseInt(postId) }
        });
        return res.json({ message: 'Post and its statuses deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting post:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}));
app.get('/getpostId', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { postId } = req.body;
    try {
        const post = yield prisma.post.findUnique({
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
    }
    catch (error) {
        console.error('Error getting post:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}));
app.put('/postcensor', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { postId } = req.body;
    try {
        const post = yield prisma.post.findUnique({
            where: {
                id: parseInt(postId)
            }
        });
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }
        const updatedCensor = !post.censor;
        const updatedPost = yield prisma.post.update({
            where: {
                id: parseInt(postId)
            },
            data: {
                censor: updatedCensor
            }
        });
        return res.json({ message: 'Censor value updated successfully', post: updatedPost });
    }
    catch (error) {
        console.error('Error updating censor value:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}));
app.get('/posts', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const posts = yield prisma.post.findMany({
            include: {
                statuses: true,
            }
        });
        return res.json({ posts });
    }
    catch (error) {
        console.error('Error fetching posts:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}));
app.post('/admin', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { username, password } = req.body;
    try {
        const admin = yield prisma.admin.findFirst({
            where: { username: username, password: password }
        });
        if (admin) {
            return res.status(200).json({ message: "Yes" });
        }
        else {
            return res.status(200).json({ message: "No" });
        }
    }
    catch (error) {
        console.error('Error during admin login:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}));
app.get('/totalPosts', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const totalPosts = yield prisma.post.count();
        return res.json({ totalPosts });
    }
    catch (error) {
        console.error('Error getting total number of posts:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}));
app.post('/userTotalPosts', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ error: 'Email is required' });
    }
    try {
        const user = yield prisma.user.findUnique({
            where: { email: email.toString() }
        });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        const totalPosts = yield prisma.post.count({
            where: { userId: user.id }
        });
        return res.json({ totalPosts });
    }
    catch (error) {
        console.error('Error getting total number of user posts:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}));
app.put('/toggleCompleted', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { postId } = req.body;
    if (!postId) {
        return res.status(400).json({ error: 'Post ID is required' });
    }
    try {
        const post = yield prisma.post.findUnique({
            where: { id: parseInt(postId) }
        });
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }
        const updatedPost = yield prisma.post.update({
            where: { id: parseInt(postId) },
            data: {
                completed: !post.completed
            }
        });
        return res.json({
            message: 'Completed status toggled successfully',
            post: updatedPost
        });
    }
    catch (error) {
        console.error('Error toggling completed status:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}));
