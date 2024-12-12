const mongoose = require("mongoose");

const OrdersSchema = new mongoose.Schema({
    UserEmail: { type: String, required: true },
    Order: { type: Array, required: true },
    Total: { type: Number, required: true },
    status: { type: String, default: "Pending" },
    assignedTo: { type: String, default: "" },
});

// Export the model, not the schema
const OrdersModel = mongoose.model("Orders", OrdersSchema);

module.exports = OrdersModel;
