const express = require("express");
const router = express.Router();
const asyncHandler = require("../utils/asyncHandler");
const upload = require("../utils/multer");
const serviceController = require("../controllers/serviceAdminController");
const { IsValidService } = require("../middleware/serviceMiddleware");

// Routes
router.get("/profile", asyncHandler(serviceController.getProfile));
router.get('/services', asyncHandler(serviceController.getAllServices));
router.get("/services/new", asyncHandler(serviceController.getNewServiceForm)); // New service creation route
router.post("/services", upload.single("image"), IsValidService, asyncHandler(serviceController.createService));
router.get("/services/:id/edit", asyncHandler(serviceController.getEditServiceForm));
router.put("/services/:id", upload.single("image"), IsValidService, asyncHandler(serviceController.updateService));
router.delete("/services/:id", asyncHandler(serviceController.deleteService));

module.exports = router;
