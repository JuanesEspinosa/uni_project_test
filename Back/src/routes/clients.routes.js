const { Router } = require("express");
const auth = require("../middleware/auth.middleware");
const { getAll, create } = require("../controllers/clients.controller");

const router = Router();

router.get("/", auth, getAll);
router.post("/", auth, create);

module.exports = router;
