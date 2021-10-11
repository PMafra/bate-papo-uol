import express from "express";
import cors from "cors";
import dayjs from "dayjs";

const app = express();
app.use(cors());
app.use(express.json());

const participants = [];
const messages = [];

app.post('/participants', (req, res) => {
    const name = req.body.name;
    if (!name) {
        res.status(400).send("Bad Request: O nome não pode ser uma string vazia");
    }
    if (participants.find(participant => participant.name === name)) {
        res.status(400).send("Bad Request: Nome já existente");
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
    res.sendStatus(200);
});

app.get('/participants', (req, res) => {
    res.send(participants);
});

app.post('/messages', (req, res) => {
    const message = req.body;
    const user = req.header("User");
    if (!message.to || !message.text) {
        res.status(400).send("Bad Request: String vazia encontrada");
    }
    if (message.type !== "message" && message.type !== "private_message") {
        res.status(400).send("Bad Request: Tipo de mensagem errada");
    }
    if (!participants.find(participant => participant.name === user)) {
        res.status(400).send("Bad Request: Remetente não existente na lista de participantes")
    }
    messages.push({
        from: user,
        ...message,
        time: dayjs().format("HH:mm:ss")
    })
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
    }
    res.send(messagesToSend);
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

// const isUserInactive = () => {
//     const secondsNow = Date.now();
//     for(let i = 0; i < participants.length; i++) {
//         if (participants.length !== 0) {
//             if ((secondsNow - participants[i].lastStatus)/1000 > 10) { 
//                 participants.splice(i, 1);
//                 messages.push({
//                     from: participants[i].name,
//                     to: "Todos",
//                     text: "sai da sala...",
//                     type: 'status', 
//                     time: 'HH:MM:SS'
//                 });
//             }
//         }
//     }
// }
// setInterval(isUserInactive, 15000);

app.listen(4000);