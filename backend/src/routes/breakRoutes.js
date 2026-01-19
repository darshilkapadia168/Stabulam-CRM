const express = require("express");
const router = express.Router();

const { startBreak, endBreak } = require("../controllers/breakController");
const { auth } = require("../middleware/auth");

router.post("/start", auth, startBreak);
router.post("/end", auth, endBreak);

module.exports = router;
