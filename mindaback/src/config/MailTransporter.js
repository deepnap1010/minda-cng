import nodeMailer from "nodemailer";


// ----------------------------- local imports ----------------------------
import { config } from "../config.js";

export const transport = nodeMailer.createTransport({
    service:"gmail",
    secure: true,
    auth:{
        user:config.EMAIL_AUTH,
        pass:config.EMAIL_PASSWORD
    }
});