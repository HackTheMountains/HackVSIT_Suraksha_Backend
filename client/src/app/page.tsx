"use client"
import {useEffect, useState} from "react";

export default function Home() {
    const [socket, setSocket] = useState<WebSocket | null>(null);
    const [imageURL, setimageURL] = useState<string | null>(null);
    const [name,setName] = useState<string | null>(null);
    const [file,setfile] = useState<File | null>(null)
    const sendMessage = (data: any) => {
        if (socket && socket.readyState === WebSocket.OPEN) {
            try {
                const message = JSON.stringify(data);
                socket.send(message);
            } catch (error) {
                console.error("Error sending message:", error);
            }
        } else {
            console.error("WebSocket connection not established.");
        }
    };

    useEffect(() => {
        const newSocket = new WebSocket('ws://localhost:8080');
        newSocket.onopen = () => {
            console.log('Connection established');
            newSocket.send('Hello Server!');
        }
        newSocket.onmessage = (message) => {
            console.log('Message received:', message.data);
        }
        setSocket(newSocket);
        return () => newSocket.close();
    }, [])

    useEffect(()=>{
        sendMessage({"user":name, "image": imageURL})
    },[imageURL])

  return (
   <div>
     <h1>Hello This is the main page</h1>
       <input type={"text"} onChange={(e)=>{setName(e.target.value)}} placeholder={"Enter Name"}/>
       <p>{name}</p>
   </div>
  );
}
