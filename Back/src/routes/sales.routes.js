const { Router } = require("express");
const auth = require("../middleware/auth.middleware");
const { getAll, getOne, create } = require("../controllers/sales.controller");

const router = Router();

router.get("/", auth, getAll);
router.get("/:id", auth, getOne);
router.post("/", auth, create);

module.exports = router;
