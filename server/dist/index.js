"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const ws_1 = require("ws");
const redis_1 = require("redis");
const Redis = (0, redis_1.createClient)();
const app = (0, express_1.default)();
const httpServer = app.listen(8080);
const wss = new ws_1.WebSocketServer({ server: httpServer });
wss.on('connection', function connection(ws) {
    ws.on('error', console.error);
    ws.on('message', function message(data) {
        // wss.clients.forEach(function each(client) {
        //     if (client.readyState === WebSocket.OPEN) {
        //         client.send(JSON.stringify( data));
        //     }
        // });
        const parsedData = JSON.parse(data.toString());
        console.log(parsedData);
        const image = parsedData.image;
        const text = parsedData.text;
    });
    ws.send('Hello! Message From Server!!');
});
// async function processMessages(targetCoordinates) {
//     // Use GEORADIUS command to query Redis for posts within the desired radius
//     const postsWithinRadius = await redis.georadius('posts', targetCoordinates.longitude, targetCoordinates.latitude, 5, 'km', 'WITHCOORD', 'ASC');
//
//     // Process the posts within the radius
//     for (const post of postsWithinRadius) {
//         const postId = post[0]; // Assuming postId is stored as the member of the sorted set
//         const coordinates = { longitude: post[1][0], latitude: post[1][1] };
//
//         // Process the post (send it to the appropriate backend route)
//         await sendToBackendRoute(postId, coordinates);
//         break; // Exit the loop after processing one suitable post
//     }
// }
//
// async function sendToBackendRoute(postId, coordinates) {
//     // Process the post and send it to the appropriate backend route
//     console.log('Processing post:', postId, 'Coordinates:', coordinates);
// }
//
// // Example target coordinates
// const targetCoordinates = { latitude: 40.7128, longitude: -74.0060 };
//
// // Start processing messages with target coordinates
// processMessages(targetCoordinates).catch(error => {
//     console.error('Error processing messages:', error);
// });
