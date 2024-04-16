import express from 'express'
import { createClient } from "redis";

const Redis = createClient({
    password: '93yDM29DC2XjVXPigsSerWvXaY6yFbYk',
    socket: {
        host: 'redis-15621.c305.ap-south-1-1.ec2.cloud.redislabs.com',
        port: 15621
    }
});
Redis.on('error', err => console.log('Redis Client Error', err));


const app = express()
const httpServer = app.listen(4000)

async function startWorkwer() {
    try{
        await Redis.connect();
        console.log("Worker connected to Redis")
    while(true){
        try{
            const submission = await Redis.brPop("posts", 0);
            console.log("This is the worker")
            const { user, image} = JSON.parse(submission!.element)
            console.log(user)
            console.log(image)
        } catch (error) {
            console.error("Error processing submission: ",error);
        }
    }
    } catch (error) {
        console.error("Failed to connect to Redis", error)
    }
}

startWorkwer();
