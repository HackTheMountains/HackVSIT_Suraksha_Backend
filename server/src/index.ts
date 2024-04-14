import express from 'express'
import { WebSocketServer } from 'ws'
import { createClient } from "redis";

const Redis = createClient({});

startServer()
Redis.on('error', err => console.log('Redis Client Error', err));


const app = express()
const httpServer = app.listen(8080)

const wss = new WebSocketServer({ server: httpServer });

wss.on('connection', function connection(ws) {
    ws.on('error', console.error);

    ws.on('message', async function message(data) {
        // wss.clients.forEach(function each(client) {
        //     if (client.readyState === WebSocket.OPEN) {
        //         client.send(JSON.stringify( data));
        //     }
        // });
        const { user, image} = JSON.parse(data.toString())
        if(user!==undefined && image!==undefined){
        await Redis.lPush("posts", JSON.stringify({user,image}))
        console.log({"username": user})
        console.log({"imageURL":image})
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


