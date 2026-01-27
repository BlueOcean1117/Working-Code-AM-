const express = require("express");
const app = express();
require('dotenv').config();

const shipmentRoutes = require("./routes/shipment.route");
const notificationRoutes = require("./routes/notification.route");

// const cookieParser = require("cookie-parser");
// const fileUpload = require("express-fileupload");
const cors = require("cors");

const database = require("./config/database");

const PORT = process.env.PORT || 4000;

// Connecting to database
database.connect();

// middlewares
app.use(express.json());
// app.use(cookieParser());
app.use(
    cors({
        origin: "*",
        credentials: true,
    })
);
// app.use(
//     fileUpload({
// 		useTempFiles: true,
// 		tempFileDir: "/tmp",
// 	})
// );

app.use("/api/v1/shipment", shipmentRoutes);
app.use("/api/v1/notification", notificationRoutes);

// Testing the server
app.get("/", (req, res) => {
	return res.json({
		success: true,
		message: "Your server is up and running ...",
	});
});

app.get("/api/v1/health", (req, res) => {
  res.json({
    status: "ONLINE",
    database: "MongoDB"
  });
});

app.get("/api/v1/test", (_, res) => {
  res.json({
    status: "OK",
    database: "MongoDB Atlas",
    timestamp: new Date().toISOString()
  });
});

// Listening to the server
app.listen(PORT, () => {
	console.log(`App is listening at ${PORT}`);
});