const express = require('express');
const router = express.Router();
const userAdminController = require('../controllers/userAdminController');
const asyncHandler = require('../utils/asyncHandler');
const upload = require('../utils/multer');
const { updateUserSchema, newUserSchema } = require('../validation/adminValidation');
const ExpressError = require("../utils/ExpressError");

const IsValidUser = (req, res, next) => {
    const { error } = newUserSchema.validate(req.body);
    if (error) {
        const msg = error.details.map(el => el.message).join(',');
        throw new ExpressError(msg, 400);
    } else {
        next();
    }
};

const IsUpdateUser = (req, res, next) => {
    const { error } = updateUserSchema.validate(req.body);
    if (error) {
        const msg = error.details.map(el => el.message).join(',');
        throw new ExpressError(msg, 400);
    } else {
        next();
    }
};

router.get("/users", asyncHandler(userAdminController.getAllUsers));
router.get("/users/adduser", asyncHandler(userAdminController.addUserForm));
router.post("/users/adduser", upload.single("avatar"), IsValidUser, asyncHandler(userAdminController.addUser));
router.get("/users/:id/edit", asyncHandler(userAdminController.updateUserForm));
router.put("/users/:id", upload.single("avatar"), IsUpdateUser, asyncHandler(userAdminController.updateUser));
router.delete("/users/:id", asyncHandler(userAdminController.deleteUser));


router.get("/users/:id/applications", asyncHandler(userAdminController.userappliedServicesForm));
router.delete("/users/application/:id", asyncHandler(userAdminController.deletUserappliedServices));
router.post("/users/application/:id/sendEmail", asyncHandler(userAdminController.userappliedServicesCompletedMail));


module.exports = router;
