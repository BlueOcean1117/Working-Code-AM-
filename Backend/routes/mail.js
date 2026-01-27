const router = require("express").Router();
const mailCtrl = require("../controllers/mailController");

router.post("/send", mailCtrl.sendTrackingMail);

module.exports = router;
