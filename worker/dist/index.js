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
const Redis = (0, redis_1.createClient)({});
Redis.on('error', err => console.log('Redis Client Error', err));
const app = (0, express_1.default)();
const httpServer = app.listen(4000);
function startWorkwer() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield Redis.connect();
            console.log("Worker connected to Redis");
            while (true) {
                try {
                    const submission = yield Redis.brPop("posts", 0);
                    console.log("This is the worker");
                    const { user, image } = JSON.parse(submission.element);
                    console.log(user);
                    console.log(image);
                }
                catch (error) {
                    console.error("Error processing submission: ", error);
                }
            }
        }
        catch (error) {
            console.error("Failed to connect to Redis", error);
        }
    });
}
startWorkwer();
