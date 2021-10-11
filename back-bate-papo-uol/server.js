import express from "express";
import cors from "cors";
import fs from 'fs';

const app = express();
app.use(cors());
app.use(express.json());

const participants = [];

const messages = [];

app.post('/participants', (req, res) => {
    const name = req.body;
    participants.push({
        ...name,
        lastStatus: Date.now()
    });
    messages.push({
        from: name,
        to: "Todos",
        text: "entra na sala...",
        type: "status",
        time: 'HH:MM:SS'
    })
    res.send(name);
});

app.get('/participants', (req, res) => {
    res.send(participants);
});

app.post('/messages', (req, res) => {
    const message = req.body;
    const user = req.header("User");
    messages.push({
        from: user,
        ...message,
        time: 'HH:MM:SS'
    })
    res.send(message);
});

app.get('/messages', (req, res) => {
    const user = req.header("User");
    const messagesToSend = messages.filter(message => {
        message.to === "todos" || message.to === user || message.from === user
    });

    if (req.query.limit) {
        const messagesQty = req.query.limit;
        res.send(messagesToSend.slice(-messagesQty));
    } else {
        res.send(messagesToSend);
    }
});

app.post('/status', (req, res) => {
    const user = req.header("User");
    const isUserOn = participants.find(participant => participant.name === user);
    if (isUserOn) {
        isUserOn.lastStatus = Date.now();
    } else {

    }

    res.send(user);
});

setInterval(isUserInactive, 15000);

const isUserInactive = () => {
    const secondsNow = Date.now();
    for(let i = 0; i < participants.length; i++) { 
        if ((secondsNow - participants[i].lastStatus)/1000 > 10) { 
            participants.splice(i, 1);
            messages.push({
                from: participants[i].name,
                to: "Todos",
                text: "sai da sala...",
                type: 'status', 
                time: 'HH:MM:SS'
            });
        }
    }
}

app.listen(4000);