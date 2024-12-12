const mongoose = require("mongoose");

const ServiceSchema = new mongoose.Schema({
  serviceName: { type: String, required: true }, // Name of the service
  serviceDescription: { type: String, required: true }, // Detailed description
  category: { type: String, required: true }, // Category of the service (e.g., Web Development)
  servicePrice: { type: Number, required: true }, // Price of the service
});

const ServiceModel = mongoose.model("Service", ServiceSchema);

module.exports = ServiceModel;
