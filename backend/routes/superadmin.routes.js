const express = require("express");
const router = express.Router();
const { authMiddleware, roleCheck } = require("../middleware/auth.middleware");
const { listUsers, createUser, updateRole, updateStatus, deleteUser, forcePasswordReset, getStats } = require("../controllers/superadmin.controller");

router.use(authMiddleware, roleCheck(["superadmin"]));

router.get("/users", listUsers);
router.post("/users", createUser);
router.patch("/users/:id/role", updateRole);
router.patch("/users/:id/status", updateStatus);
router.delete("/users/:id", deleteUser);
router.post("/users/:id/reset-password", forcePasswordReset);
router.get("/stats", getStats);

module.exports = router;
