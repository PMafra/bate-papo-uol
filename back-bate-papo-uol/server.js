import express from "express";
import cors from "cors";
import dayjs from "dayjs";
import fs from "fs";
import Joi from "joi";

const app = express();
app.use(cors());
app.use(express.json());

const database = fs.readFileSync("./database.json");
const participants = JSON.parse(database.toString()).participants;
const messages = JSON.parse(database.toString()).messages;

const userNameSchema = Joi.object().keys({
    name: Joi.string().alphanum().min(3).max(30).required()
});

const messageSchema = Joi.object().keys({
    to: Joi.string().alphanum().required(),
    text: Joi.string().required(),
    type: Joi.valid("message").valid("private_message")
});

const saveData = () => {
    const dataBaseContent = {
        participants,
        messages
    }
    fs.writeFileSync("./database.json", JSON.stringify(dataBaseContent));
}

app.post('/participants', (req, res) => {
    const name = req.body.name;
    const result = userNameSchema.validate(req.body);
    if (result.error) {
        res.status(400).send(`Bad Request: ${result.error.details[0].message}`);
        return;
    }
    if (participants.find(participant => participant.name === name)) {
        res.status(400).send("Bad Request: Name already exists");
        return;
    }
    participants.push({
        name,
        lastStatus: Date.now()
    });
    messages.push({
        from: name,
        to: "Todos",
        text: "entra na sala...",
        type: "status",
        time: dayjs().format("HH:mm:ss")
    });
    saveData();
    res.sendStatus(200);
});

app.get('/participants', (req, res) => {
    res.send(participants);
});

app.post('/messages', (req, res) => {
    const message = req.body;
    const user = req.header("User");
    const result = messageSchema.validate(message);
    if (result.error) {
        res.status(400).send(`Bad Request: ${result.error.details[0].message}`);
        return;
    }
    if (!participants.find(participant => participant.name === user)) {
        res.status(400).send("Bad Request: Your username was not found in participants list");
        return;
    }
    messages.push({
        from: user,
        ...message,
        time: dayjs().format("HH:mm:ss")
    })
    saveData();
    res.sendStatus(200);
});

app.get('/messages', (req, res) => {
    const user = req.header("User");
    const messagesToSend = messages.filter(message => 
        message.to === "Todos" || message.to === user || message.from === user
    );
    if (req.query.limit) {
        const messagesQty = req.query.limit;
        res.send(messagesToSend.slice(-messagesQty));
        return;
    }
    res.send(messagesToSend);
});

app.post('/status', (req, res) => {
    const user = req.header("User");
    const isUserOn = participants.find(participant => participant.name === user);
    if (!isUserOn) {
        res.status(400).send("Bad Request: User not found in participants list");
        return;
    }
    isUserOn.lastStatus = Date.now();
    saveData();
    res.sendStatus(200);
});

const isUserInactive = () => {
    if (participants.length !== 0) {
        const secondsNow = Date.now();
        for(let i = 0; i < participants.length; i++) {
            if ((secondsNow - participants[i].lastStatus)/1000 > 10) {
                let removedUser = participants.splice(i, 1);
                messages.push({
                    from: removedUser[0].name,
                    to: "Todos",
                    text: "sai da sala...",
                    type: 'status', 
                    time: dayjs().format("HH:mm:ss")
                });
            }
        }
        saveData();
    }
}
setInterval(isUserInactive, 15000);

app.listen(4000);