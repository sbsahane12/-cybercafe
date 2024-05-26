const User = require('../models/user');
const cloudinary = require("../utils/cloudinary");
const fs = require("fs").promises;
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const { newUserSchema, updateUserSchema, emailSchema, passwordResetSchema } = require('../validation/adminValidation');
const {applicationRejectEmail ,applicationCompletedEmail} = require('../helpers/mailer');
const UserForget = require('../models/userforget');
const randomstring = require('randomstring');
const ExpressError = require('../utils/ExpressError');
const ServiceApply = require('../models/applyservice');
const { Console } = require('console');


exports.getAllUsers = async (req, res) => {
    try {
        let users = await User.find({});
        res.render("useradmin/users", { users });
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
};

exports.updateUserForm = async (req, res) => {
    const { id } = req.params;
    const user = await User.findById(id);
    res.render("useradmin/updateuser", { user });
};

exports.updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { username, email, mobile, role, is_verified } = req.body;
        let updateData = { username, email, mobile, role, is_verified };

        const user = await User.findById(id);

        if (req.file) {
            if (user.avatar) {
                await cloudinary.uploader.destroy(user.avatar);
            }
            const result = await cloudinary.uploader.upload(req.file.path);
            updateData.avatar = result.secure_url;
            await fs.unlink(req.file.path);
        }

        await User.findByIdAndUpdate(id, updateData);
        res.redirect("/admin/users");
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        await User.findByIdAndDelete(id);
        res.redirect("/admin/users");
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
};

exports.addUserForm = async (req, res) => {
    res.render("useradmin/adduser");
};

exports.addUser = async (req, res) => {
    try {
        const { username, email, mobile, role, is_verified, password } = req.body;
        let avatar;

        if (req.file) {
            const result = await cloudinary.uploader.upload(req.file.path);
            avatar = result.secure_url;
            await fs.unlink(req.file.path);
        }

        if (mobile.length !== 10) {
            req.flash('error', 'Invalid Mobile Number');
            return res.redirect('/admin/users/adduser');
        }

        if (!username || !email || !mobile || !role) {
            req.flash('error', 'All fields are required');
            return res.redirect('/admin/users/adduser');
        }

        const emailExists = await User.findOne({ email });
        if (emailExists) {
            req.flash('error', 'Email already in use');
            return res.redirect('/admin/users/adduser');
        }

        const mobileExists = await User.findOne({ mobile });
        if (mobileExists) {
            req.flash('error', 'Mobile Number already in use');
            return res.redirect('/admin/users/adduser');
        }

        const user = new User({
            username,
            email,
            role: role === "admin" ? "admin" : "normal",
            mobile,
            avatar,
            is_verified: is_verified === "yes"
        });

        await User.register(user, password);

        res.redirect("/admin/users");
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
};




exports.userappliedServicesForm = async (req, res) => {
    const id= req.params.id;
     console.log(id)
    if(!id) {
        req.flash('error', 'You must be logged in to view your profile');
        res.redirect('/user/login');
        return;
    }
    const user = await User.findById(id);
    console.log("User",user)
    if (!user) {
        req.flash('error', 'User not found');
        res.redirect('/user/login');
        return;
    }
    const applications = await ServiceApply.find({ userId: user._id }).populate('serviceId');
    
     console.log("Applications",applications);
    res.render('useradmin/single_user_appliedservices', { user,applications });
}


exports.deletUserappliedServices = async (req, res) => {
    const { id } = req.params;
    // await ServiceApply.findByIdAndDelete(id);
    // await  applicationRejectEmail(req.user.email)
    const userdata= await ServiceApply.findById(id).populate("userId");
    console.log(userdata.userId)
    await ServiceApply.findByIdAndDelete(id);
    await  applicationRejectEmail(userdata.userId.email);
    req.flash("success", "Application deleted successfully");
    res.redirect("/admin/users");
};

exports.userappliedServicesCompletedMail= async (req, res) => {
    const id= req.params.id;
    console.log(id)
    if(!id) {
        req.flash('error', 'You must be logged in to view your profile');
        res.redirect('/user/login');
        return;
    }
    const user = await User.findById(id);
    console.log("User",user)
    if (!user) {
        req.flash('error', 'User not found');
        return;
    }
   
    await applicationCompletedEmail(user.email);
    req.flash("success", "Application completed successfully");
    res.redirect("/admin/users");
}


