const express = require("express");
const router = express.Router();
const adminController = require("../controllers/admin.controller");
const { authMiddleware, roleCheck } = require("../middleware/auth.middleware");

// All routes here require Admin role
router.use(authMiddleware);
router.use(roleCheck(["admin"]));

router.get("/users", adminController.getUsers);
router.patch("/users/role", adminController.updateUserRole);
router.delete("/users/:userId", adminController.deleteUser);
router.get("/stats", adminController.getSystemStats);

module.exports = router;
