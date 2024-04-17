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
    const { email, firstname, lastname, MobileNo, password } = req.body; // Extract password from request body
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


