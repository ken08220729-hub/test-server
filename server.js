const express = require("express");
const app = express();

app.use(express.json());

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "*");
    next();
});

let count = 0;

app.get("/", (req, res) => {
    res.send("伺服器正常");
});

app.get("/count", (req, res) => {
    res.json({ count });
});

app.post("/add", (req, res) => {
    count++;
    res.json({ count });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT);
