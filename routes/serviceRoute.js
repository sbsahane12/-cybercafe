const express = require("express");
const router = express.Router();
const asyncHandler = require("../utils/asyncHandler");
const upload = require("../utils/multer");
const serviceController = require("../controllers/serviceController");
const { isApplyValidService } = require("../middleware/applyserviceMiddleware");
router.get("/", asyncHandler(serviceController.getAllServices));
router.get("/:id", asyncHandler(serviceController.getSingleService));
router.get("/:id/apply", asyncHandler(serviceController.getApplyForm)); 

router.post("/:id", upload.array('documents'),isApplyValidService, asyncHandler(serviceController.setApplyService));
module.exports = router;

