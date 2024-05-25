const Service = require("../models/service");
const ServiceApply = require("../models/applyservice");
const ExpressError = require("../utils/ExpressError");
const cloudinary = require("../utils/cloudinary");
const fs = require("fs").promises;
const asyncHandler = require("../utils/asyncHandler");

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
    console.log(req.params.id);
    res.render("cybercafe/Apply", { service });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
};

// Create a new ServiceApply
exports.setApplyService = asyncHandler(async (req, res) => {
  // Extract form data from req.body
  const { fname, mname, lname, mail, contact, whcontact, price } = req.body;
  
console.log(req.params.id);
  const serviceId = req.params.id;
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
  const newApplyService = new ServiceApply({
    serviceId, // Corrected field name
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
});
