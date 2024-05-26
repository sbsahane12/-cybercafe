// controllers/userController.js

const User = require('../models/user');
const cloudinary = require("../utils/cloudinary");
const fs = require("fs").promises;
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const { registerSchema, emailSchema, passwordResetSchema, loginSchema } = require('../validation/userValidation');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../helpers/mailer');
const UserForget = require('../models/userforget');
const randomstring = require('randomstring');
const ExpressError = require('../utils/ExpressError');
const ServiceApply = require('../models/applyservice');
const { Console } = require('console');
exports.signupForm = (req, res) => {
    res.render('user/signup');
};

exports.signup = async (req, res) => {
    try {
        let { username, email, password, role, mobile } = req.body;
        const { error } = registerSchema.validate(req.body);

        if (error) {
            throw new ExpressError(error.details[0].message, 400);
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            throw new ExpressError('Email already in use', 400);
        }

        const result = await cloudinary.uploader.upload(req.file.path);
        await fs.unlink(req.file.path);

        const registeredUser = await User.register(new User({
            username,
            email,
            role,
            mobile,
            avatar: result.secure_url
        }), password);

        const verificationToken = randomstring.generate();
        await UserForget.create({ user_id: registeredUser._id, token: verificationToken });

        await sendVerificationEmail(email, verificationToken);

        req.flash('success', 'Registered successfully. Please verify your email.');
        res.redirect('/user/login');
    } catch (err) {
        console.error(err);
        req.flash('error', err.message);
        res.redirect('/user/signup');
    }
};

exports.loginForm = (req, res) => {
    res.render('user/login');
};

exports.login = (req, res, next) => {
    passport.authenticate('local', async (err, user, info) => {
        if (err) {
            console.error(err);
            req.flash('error', 'An error occurred');
            return res.redirect('/user/login');
        }
        if (!user) {
            req.flash('error', info.message);
            return res.redirect('/user/login');
        }

        // Check if user is verified
        if (!user.is_verified) {
            const verificationToken = randomstring.generate();
            await UserForget.create({ user_id: user._id, token: verificationToken });
            await sendVerificationEmail(user.email, verificationToken);

            req.flash('error', 'Please verify your email before logging in. A verification email has been sent.');
            return res.redirect('/user/login');
        }

        // User is verified, proceed with login
        req.login(user, (err) => {
            if (err) {
                console.error(err);
                req.flash('error', 'An error occurred');
                return res.redirect('/user/login');
            }
            req.flash('success', 'Logged in successfully');
            if (user.role === 'admin') {
                return res.redirect('/admin/profile/'+user._id);
            } else {
                return res.redirect('/services');
            }
        });
    })(req, res, next);
};

exports.logout = (req, res, next) => {
    req.logout((err) => {
        if (err) {
            return next(err);
        }
        req.flash('success', 'Logged out successfully');
        res.redirect('/services');
    });
};

exports.verifyEmail = async (req, res) => {
    try {
        const { token } = req.query;
        const userForget = await UserForget.findOne({ token });

        if (!userForget) {
            throw new ExpressError('Invalid token', 400);
        }

        const user = await User.findById(userForget.user_id);
        user.is_verified = true;
        await user.save();
        await UserForget.deleteMany({ user_id: userForget.user_id });

        req.flash('success', 'Email verified successfully');
        res.redirect('/user/login');
    } catch (err) {
        console.error(err);
        req.flash('error', err.message);
        res.redirect('/user/login');
    }
};

exports.forgetPasswordForm = (req, res) => {
    res.render('user/forgetPassword');
};

exports.forgetPassword = async (req, res) => {
    try {
        const { error } = emailSchema.validate(req.body);
        if (error) {
            throw new ExpressError(error.details[0].message, 400);
        }

        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            throw new ExpressError('No account found with that email', 400);
        }

        const resetToken = randomstring.generate();
        await UserForget.create({ user_id: user._id, token: resetToken });

        sendPasswordResetEmail(email, resetToken);

        req.flash('success', 'Password reset email sent');
        res.redirect('/user/login');
    } catch (err) {
        console.error(err);
        req.flash('error', err.message);
        res.redirect('/user/forgetPassword');
    }
};

exports.resetPasswordForm = async (req, res) => {
    try {
        const { token } = req.query;
        const userForget = await UserForget.findOne({ token });

        if (!userForget) {
            throw new ExpressError('Invalid token', 400);
        }

        res.render('user/resetPassword', { token });
    } catch (err) {
        console.error(err);
        req.flash('error', err.message);
        res.redirect('/user/forgetPassword');
    }
};

exports.resetPassword = async (req, res) => {
    try {
        const { token } = req.body;
        const { error } = passwordResetSchema.validate(req.body);
        if (error) {
            throw new ExpressError(error.details[0].message, 400);
        }

        const { password } = req.body;
        const userForget = await UserForget.findOne({ token });

        if (!userForget) {
            throw new ExpressError('Invalid token', 400);
        }

        const user = await User.findById(userForget.user_id);
        user.setPassword(password, async () => {
            await user.save();
            await UserForget.deleteMany({ user_id: userForget.user_id });

            req.flash('success', 'Password reset successfully');
            res.redirect('/user/login');
        });
    } catch (err) {
        console.error(err);
        req.flash('error', err.message);
        res.redirect(`/user/resetPassword?token=${token}`);
    }
};

exports.profile = async (req, res) => {

    const id= req.user._id;
    if(!id) {
        req.flash('error', 'You must be logged in to view your profile');
        res.redirect('/user/login');
        return;
    }
    const user = await User.findById(req.user._id);
    console.log("User",user)
    if (!user) {
        req.flash('error', 'User not found');
        res.redirect('/user/login');
        return;
    }
    const applications = await ServiceApply.find({ userId: user._id }).populate('serviceId');

     console.log("Applications",applications);
    res.render('user/profile', { user, applications });
};


exports.updateProfileForm = async (req, res) => {
    try {
      const { username, mobile } = req.body;
      const userId = req.params.id;
  
      console.log(req.body);
      console.log(req.params.id);
  
      const user = await User.findById(userId);
      if (!user) {
        req.flash('error', 'User not found');
        return res.redirect(`/user/profile/${userId}`);
      }
  
      if (!username || username.length < 7) {
        req.flash('error', 'Username must be at least 7 characters long');
        return res.redirect(`/user/profile/${userId}`);
      }
  
      if (!mobile || mobile.length !== 10) {
        req.flash('error', 'Invalid mobile number');
        return res.redirect(`/user/profile/${userId}`);
      }
  
      console.log('inside update profile', req.file);
  
      // Upload new avatar if provided
      if (req.file) {
        const result = await cloudinary.uploader.upload(req.file.path);
        user.avatar = result.secure_url;
  
        // Remove the uploaded file from the server
        await fs.unlink(req.file.path);
      }
  
     
      user.username = username;
      user.mobile = mobile;
  
      await user.save();
  
      req.flash('success', 'Profile updated successfully');
      res.redirect(`/user/profile/${userId}`);
    } catch (error) {
      console.error(error);
      req.flash('error', 'An error occurred while updating the profile');
      res.redirect(`/user/profile/${req.params.id}`);
    }
  };
  

  exports.applicationForm = async (req, res) => {
    try {
      const application = await ServiceApply.findById(req.params.id);
      res.render('user/applicationForm', {application });
    } catch (error) {
      console.error(error);
      req.flash('error', 'An error occurred while fetching services');
      res.redirect('/user/login');
    }
  };

exports.updateApplicationForm = async (req, res) => {
  try {
    const application = await ServiceApply.findById(req.params.id);
    const oldDocumentIds = application.documents.map(doc => {
      const urlParts = doc.split('/');
      const publicId = urlParts[urlParts.length - 1].split('.')[0];
      return publicId;
    });

    const documents = req.files.map(file => file.path);
    const uploadedDocuments = await Promise.all(
      documents.map(async filePath => {
        try {
          const result = await cloudinary.uploader.upload(filePath);
          // After successful upload, remove the file from the server
          await fs.unlink(filePath);
          return result.secure_url; // Return the Cloudinary URL of the uploaded file
        } catch (error) {
          console.error("Error uploading file to Cloudinary:", error);
          throw new Error("Failed to upload file to Cloudinary");
        }
      })
    );

    // Delete old documents from Cloudinary
    await Promise.all(
      oldDocumentIds.map(async publicId => {
        try {
          await cloudinary.uploader.destroy(publicId);
        } catch (error) {
          console.error("Error deleting file from Cloudinary:", error);
        }
      })
    );

    // Update application with new document URLs
    application.documents = uploadedDocuments;
    await application.save();

    res.status(200).json({ message: 'Application updated successfully', application });
  } catch (error) {
    console.error("Error updating application:", error);
    res.status(500).json({ error: 'Failed to update application' });
  }
};


