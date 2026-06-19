const express = require("express");
const app = express();

app.get("/", (req, res) => {
    res.send("伺服器正常");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT);
