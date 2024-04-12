import express from 'express'
import ws from 'ws'
import { createClient } from "redis";

const app = express()
app.use(express.json());

const client = createClient();

