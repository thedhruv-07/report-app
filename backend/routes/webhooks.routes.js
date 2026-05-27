const express = require("express");
const { handleBookingWebhook } = require("../controllers/webhook.controller");

const router = express.Router();

router.post("/bookings", handleBookingWebhook);

module.exports = router;