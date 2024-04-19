import express from 'express'
import { WebSocketServer } from 'ws'
import { createClient } from "redis";

const Redis = createClient({
    password: '93yDM29DC2XjVXPigsSerWvXaY6yFbYk',
    socket: {
        host: 'redis-15621.c305.ap-south-1-1.ec2.cloud.redislabs.com',
        port: 15621
    }
});

startServer()
Redis.on('error', err => console.log('Redis Client Error', err));


const app = express()
const httpServer = app.listen(4000)

const wss = new WebSocketServer({ server: httpServer });

wss.on('connection', function connection(ws) {
    ws.on('error', console.error);

    ws.on('message', async function message(data) {
        // wss.clients.forEach(function each(client) {
        //     if (client.readyState === WebSocket.OPEN) {
        //         client.send(JSON.stringify( data));
        //     }
        // });
        const { email, image, latitude, longitude} = JSON.parse(data.toString())
        if(email!==undefined && image!==undefined){
        await Redis.lPush("posts", JSON.stringify({email,image,latitude,longitude}))
        console.log({"emailId": email})
        console.log({"imageURL":image})
        console.log({"latitude_server": latitude})
        console.log({"longitude_server": longitude})
        } else {
            console.log("Either the image received or user received is NULL")
        }
    });

    ws.send('Hello! Message From Server!!');
});

async function startServer(){
    try {
        await Redis.connect();
        console.log("Connected to redis")
    } catch (e){
        console.log("Error Occured", e)
    }
}


