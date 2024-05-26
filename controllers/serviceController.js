const Service = require("../models/service");
const ServiceApply = require("../models/applyservice");
const cloudinary = require("../utils/cloudinary");
const fs = require("fs").promises;

exports.getAllServices = async (req, res) => {
  try {
    let services = await Service.find({});
    res.render("cybercafe/Services", { services });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
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

exports.getApplyForm = async (req, res) => {
  try {
    let service = await Service.findById(req.params.id);
    res.render("cybercafe/Apply", { service });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
};

exports.setApplyService = async (req, res) => {
  try {
    const { fname, mname, lname, mail, contact, whcontact, price } = req.body;
    const serviceId = req.params.id;

    const documents = req.files.map(file => file.path);
    const uploadedDocuments = await Promise.all(
      documents.map(async filePath => {
        try {
          const result = await cloudinary.uploader.upload(filePath);
          await fs.unlink(filePath);
          return result.secure_url;
        } catch (error) {
          console.error("Error uploading file to Cloudinary:", error);
          throw new Error("Failed to upload file to Cloudinary");
        }
      })
    );

    if(!req.user._id){
      req.flash('error', 'Please login first');
      return res.status(401).send('Unauthorized');
    }
    const newApplyService = new ServiceApply({
      serviceId,
      userId: req.user._id,
      fname,
      mname,
      lname,
      mail,
      contact,
      whcontact,
      price,
      documents: uploadedDocuments
    });

    await newApplyService.save();
    res.redirect("/services/" + req.params.id);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
};
