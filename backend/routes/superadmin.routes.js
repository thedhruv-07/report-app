const express = require("express");
const router = express.Router();
const { authMiddleware, roleCheck } = require("../middleware/auth.middleware");
const { listUsers, createUser, updateRole, deleteUser } = require("../controllers/superadmin.controller");

router.use(authMiddleware, roleCheck(["superadmin"]));

router.get("/users", listUsers);
router.post("/users", createUser);
router.patch("/users/:id/role", updateRole);
router.delete("/users/:id", deleteUser);

module.exports = router;
