import express from "express";
import cors from "cors";
import dayjs from "dayjs";
import fs from "fs";

const app = express();
app.use(cors());
app.use(express.json());

const database = fs.readFileSync("./database.json");
const participants = JSON.parse(database.toString()).participants;
const messages = JSON.parse(database.toString()).messages;

const saveData = () => {
    const dataBaseContent = {
        participants,
        messages
    }
    fs.writeFileSync("./database.json", JSON.stringify(dataBaseContent));
}

app.post('/participants', (req, res) => {
    const name = req.body.name;
    if (!name) {
        res.status(400).send("Bad Request: O nome não pode ser uma string vazia");
        return;
    }
    if (participants.find(participant => participant.name === name)) {
        res.status(400).send("Bad Request: Nome já existente");
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
    if (!participants.find(participant => participant.name === user)) {
        res.status(400).send("Bad Request: Remetente não existente na lista de participantes");
        return;
    }
    if (!message.to || !message.text) {
        res.status(400).send("Bad Request: String vazia encontrada");
        return;
    }
    if (message.type !== "message" && message.type !== "private_message") {
        res.status(400).send("Bad Request: Tipo de mensagem errada");
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
        res.status(400).send("Bad Request: Usuário não existente na lista de participantes");
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