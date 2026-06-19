const express = require("express");
const app = express();

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "*");
    next();
});

app.get("/", (req, res) => {
    res.send("伺服器正常");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT);
