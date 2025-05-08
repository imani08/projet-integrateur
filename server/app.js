const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/sensors", require("./routes/sensorRoutes"));
app.use("/api/actuators", require("./routes/actuatorRoutes"));
app.use("/api/users", require("./routes/users"));
app.use("/api/alerts", require("./routes/alerts"));
app.use("/api/settings", require("./routes/settings"));
app.use("/api/logs", require("./routes/logs"));



module.exports = app;
