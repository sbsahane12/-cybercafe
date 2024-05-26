const Service = require("../models/service");
const ExpressError = require("../utils/ExpressError");
const cloudinary = require("../utils/cloudinary");
const ServiceApply = require("../models/applyservice");
const User = require("../models/user");
const fs = require("fs").promises;



exports.getProfile = async (req, res) => {
console.log(req.params.id);
  const user = await User.findById(req.params.id);
console.log("User",user)
if (!user) {
    req.flash('error', 'User not found');
    res.redirect('/user/login');
    return;
}
const applications = await ServiceApply.find({ userId: user._id }).populate('serviceId');

 console.log("Applications",applications);
res.render('admin/profile', { user, applications });

};


exports.getAllServices = async (req, res) => {
  try {
    let services = await Service.find({});
    res.render('admin/services.ejs', {services});
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
};

exports.getNewServiceForm = (req, res) => {
  res.render("cyberCafe/newService");
};

exports.createService = async (req, res, next) => {
  try {
    if (!req.file) {
      throw new ExpressError("No file uploaded", 400);
    }

    console.log(req.body);
    const result = await cloudinary.uploader.upload(req.file.path);
    console.log(result);
    await fs.unlink(req.file.path);

    const imageUrl = result.secure_url;

    const service = await new Service({
      title: req.body.title,
      description: req.body.description,
      image: imageUrl,
      price: req.body.price,
      documents: req.body.documents || [],
      documentCount: req.body.documents ? req.body.documents.length : 0,
    });

    await service.save();
    res.redirect("/admin/services");
  } catch (err) {
    console.error(err);
    next(err);
  }
};

exports.getSingleService = async (req, res) => {
  try {
    let service = await Service.findById(req.params.id);
    res.render("cybercafe/SingleService", { service });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
};

exports.getEditServiceForm = async (req, res) => {
  try {
    let service = await Service.findById(req.params.id);
    res.render("cybercafe/EditService", { service });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
};

exports.updateService = async (req, res) => {
  try {
    let service = await Service.findById(req.params.id);

    service.title = req.body.title;
    service.description = req.body.description;
    service.price = req.body.price;
    service.documents = req.body.documents || [];
    service.documentCount = req.body.documents ? req.body.documents.length : 0;

    if (req.file) {
      await cloudinary.uploader.destroy(service.image);
      const result = await cloudinary.uploader.upload(req.file.path);
      await fs.unlink(req.file.path);

      service.image = result.secure_url;
    }

    await service.save();
    res.redirect(`/admin/services`);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
};


exports.deleteService = async (req, res) => {
  try {
    let service = await Service.findById(req.params.id);

    // Delete associated ServiceApply documents
    await ServiceApply.deleteMany({ serviceId: service._id });
    

    // Now delete the Service itself
    await Service.findByIdAndDelete(service._id);

    // Optionally, you might also want to delete the image from cloudinary
    await cloudinary.uploader.destroy(service.image);

    res.redirect("/admin/services");
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
};