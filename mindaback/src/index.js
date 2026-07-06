import express from "express";

// ------------------- local imports ----------------
import { Start } from "./server.js";


const intiServer = () => {
    const app = express();
    Start(app);
};

intiServer();

// SendMail("resetPassword",{name:"nitin",resetLink:"http://localhost:4000",appName :"test"},{email:"nitinthakur12390@gmail.com",subject:"hello nitin"})