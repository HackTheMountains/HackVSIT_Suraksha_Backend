"use client"
import {useEffect, useState} from "react";
import axios from "axios";

export default function Home() {
    const [socket, setSocket] = useState<WebSocket | null>(null);
    const [imageURL, setimageURL] = useState<string | null>(null);
    const [name,setName] = useState<string | null>(null);

    const handleUpload = async (e : any) => {
        const uploadedFile = e.target.files[0];
        try {
            const formData = new FormData();
            formData.append('photo', uploadedFile);

            const response = await axios.post('https://image-upload-nq2i.onrender.com/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            setimageURL(response.data.signedUrl);
        } catch (error) {
            console.error('Error uploading file:', error);
        }
    };

    const sendMessage = (data: any) => {
        if (socket && socket.readyState === WebSocket.OPEN) {
            try {
                const message = JSON.stringify(data);
                console.log(message)
                socket.send(message);
            } catch (error) {
                console.error("Error sending message:", error);
            }
        } else {
            console.error("WebSocket connection not established.");
        }
    };

    useEffect(() => {
        const newSocket = new WebSocket('ws://hacksvsit.onrender.com');
        newSocket.onopen = () => {
            console.log('Connection established')
            newSocket.send(JSON.stringify({"message": "Hello Server"}));
        }
        newSocket.onmessage = (message) => {
            console.log('Message received:', message.data);
        }
        setSocket(newSocket);
        return () => newSocket.close();
    }, [])

    useEffect(()=>{
        console.log("Sending Data")
        sendMessage({"user":name, "image": imageURL})
    },[imageURL])

  return (
   <div>
     <h1>Hello This is the main page</h1>
       <input type="file" onChange={handleUpload}  />
       <input type={"text"} onChange={(e)=>{setName(e.target.value)}} placeholder={"Enter Name"}/>
       <p>{name}</p>
   </div>
  );
}
