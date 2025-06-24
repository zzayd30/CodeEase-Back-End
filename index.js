const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const emailjs = require("emailjs-com");
const ServiceModel = require("./Models/Service");
const OrdersModel = require("./Models/Orders");
const UsersModel = require("./Models/Users");

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

// MongoDB Connection
mongoose
  .connect("mongodb+srv://zaidlatif30:Zaidlatif12345@cluster0.hledrsi.mongodb.net/CodeEase?retryWrites=true&w=majority&appName=Cluster0", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// EmailJS Configuration (Make sure to use your EmailJS service ID and template ID)
const emailjsConfig = {
  serviceID: "service_mji72wi", // Replace with your EmailJS Service ID
  templateID: "template_itpqrmd", // Replace with your EmailJS Template ID
  userID: "udq9XLuX-kA06VzUz", // Replace with your EmailJS User ID
};

// Send Email using EmailJS
app.post("/Sendmail", (req, res) => {
  const { name, email, subject, message } = req.body;

  // Prepare the template data
  const templateParams = {
    from_name: name,
    from_email: email,
    subject: subject,
    message: message,
  };

  // Send the email using EmailJS
  emailjs
    .send(
      emailjsConfig.serviceID, // Your EmailJS Service ID
      emailjsConfig.templateID, // Your EmailJS Template ID
      templateParams, // Template parameters
      emailjsConfig.userID // Your EmailJS User ID
    )
    .then((response) => {
      console.log("Email sent successfully: ", response);
      res.status(200).json({
        type: "success",
        message: "Email sent successfully.",
      });
    })
    .catch((error) => {
      console.error("Failed to send email:", error);
      res.status(500).json({
        type: "error",
        message: "Failed to send email.",
        error: error.message,
      });
    });
});

// Register User
app.post("/Register", (req, res) => {
  console.log(req.body);
  UsersModel.create(req.body)
    .then((user) =>
      res.status(201).json({
        type: "success",
        message: "User registered successfully",
        user,
      })
    )
    .catch((err) =>
      res
        .status(500)
        .json({ type: "error", message: "Registration failed", error: err })
    );
});

// Get Services by Category
app.get("/api/services", async (req, res) => {
  const category = req.query.category;
  console.log(category);
  try {
    const services = await ServiceModel.find({ category });
    res.status(200).json({ success: true, data: services });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Error fetching services" });
  }
});

// Add to Cart
app.post("/api/add-to-cart", async (req, res) => {
  const { email, serviceName, servicePrice } = req.body;

  try {
    const user = await UsersModel.findOne({ email });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const newItem = {
      id: Date.now().toString(),
      serviceName,
      servicePrice,
    };

    user.cart.push(newItem);
    await user.save();

    return res
      .status(200)
      .json({ success: true, message: "Service added to cart" });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "An error occurred while adding to cart",
    });
  }
});

// Fetch team member's orders
app.get("/GetTeamMembers", async (req, res) => {
  try {
    console.log("In get team members");
    const teamMembers = await UsersModel.find(
      { isTeam: true },
      "username email team_type"
    );
    console.log(teamMembers);
    res.status(teamMembers.length ? 200 : 404).json({
      type: teamMembers.length ? "success" : "error",
      message: teamMembers.length
        ? "Team members fetched successfully"
        : "No team members found",
      teamMembers: teamMembers.length ? teamMembers : [],
    });
  } catch (err) {
    res.status(500).json({
      type: "error",
      message: "Failed to fetch team members",
      error: err.message,
    });
  }
});

// Fetch orders for a specific team member
app.get("/TeamOrders/:email", async (req, res) => {
  const { email } = req.params;

  try {
    // Find the user by email and ensure they are a team member
    const user = await UsersModel.findOne({ email, isTeam: true });
    console.log(user);
    if (!user) {
      return res.status(404).json({
        type: "error",
        message: "Team member not found",
      });
    }

    // If the user exists and is a team member, return the orders
    res.status(200).json({
      type: "success",
      message: "Orders fetched successfully",
      team_orders: user.team_orders, // Returning the user's team_orders
    });
  } catch (err) {
    console.error("Error fetching orders:", err);
    res.status(500).json({
      type: "error",
      message: "Failed to fetch orders",
      error: err.message,
    });
  }
});

app.get("/TeamOrders/:email", async (req, res) => {
  const { email } = req.params;

  try {
    const teamOrders = await Order.find({ assignedTo: email });
    if (teamOrders.length > 0) {
      res.status(200).json({
        type: "success",
        message: "Orders fetched successfully",
        team_orders: teamOrders,
      });
    } else {
      res.status(404).json({
        type: "error",
        message: "No orders found for this team member",
      });
    }
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({
      type: "error",
      message: "Server error while fetching orders",
    });
  }
});

// Route to update order status
app.put("/updateOrderStatus/:orderId", async (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body;
  const { email } = req.body;

  if (!orderId || !status) {
    return res.status(400).json({
      type: "error",
      message: "Order ID and status are required",
    });
  }

  try {
    const existingOrder = await OrdersModel.findById(orderId);
    if (!existingOrder) {
      return res.status(404).json({
        type: "error",
        message: "Order not found",
      });
    }

    existingOrder.status = status;
    const updatedOrder = await existingOrder.save();

    try {
      const finduser = await UsersModel.find({ email });
      if (!finduser || finduser.length === 0) {
        return res.status(404).json({
          type: "error",
          message: "User not found",
        });
      }

      const user = finduser[0];
      const teamOrders = user.team_orders;

      // Check if teamOrders is not empty
      if (teamOrders.length > 0) {
        console.log(teamOrders[0].status);
      }

      // Remove the order with the specific orderId
      await UsersModel.updateOne(
        { email },
        { $pull: { team_orders: { orderId } } }
      );
    } catch (error) {
      console.log(error);
    }

    res.status(200).json({
      type: "success",
      message: "Order status updated successfully",
      order: updatedOrder,
    });
  } catch (error) {
    console.error("Error updating order status:", error);
    res.status(500).json({
      type: "error",
      message: "Server error while updating order status",
    });
  }
});

// Log In
app.post("/LogIn", (req, res) => {
  const { email, password } = req.body;

  UsersModel.findOne({ email })
    .then((user) => {
      if (!user) {
        return res
          .status(404)
          .json({ type: "error", message: "User Not Found" });
      }

      if (user.password === password) {
        res.json({
          type: "success",
          admin: user.admin || false,
          username: user.username,
          email: user.email,
          isTeam: user.isTeam || false,
          team_type: user.team_type || "",
          team_orders: user.team_orders || [],
          message: user.admin ? "Admin Login Success" : "User Login Success",
        });
      } else {
        res.status(401).json({ type: "error", message: "Invalid Password" });
      }
    })
    .catch((err) =>
      res
        .status(500)
        .json({ type: "error", message: "An error occurred", error: err })
    );
});

// Add Service
app.post("/AddService", (req, res) => {
  const { serviceName, serviceDescription, category, servicePrice } = req.body;

  if (!serviceName || !serviceDescription || !category || !servicePrice) {
    return res
      .status(400)
      .json({ type: "error", message: "All fields are required" });
  }

  ServiceModel.create({
    serviceName,
    serviceDescription,
    category,
    servicePrice,
  })
    .then((service) =>
      res.status(201).json({
        type: "success",
        message: "Service added successfully",
        service,
      })
    )
    .catch((err) =>
      res
        .status(500)
        .json({ type: "error", message: "Failed to add service", error: err })
    );
});

// Get Cart Items
app.get("/api/cart", async (req, res) => {
  const email = req.query.email;

  try {
    const user = await UsersModel.findOne({ email });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const cartItems = user.cart;
    res.status(200).json({ success: true, data: cartItems });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Error fetching cart items", error });
  }
});

// Proceed Order
app.post("/api/proceed-order", async (req, res) => {
  const { email, serviceName, servicePrice, status } = req.body;

  try {
    const user = await UsersModel.findOne({ email });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const cartItem = user.cart.find((item) => item.serviceName === serviceName);

    if (cartItem) {
      const total = servicePrice; // Assuming you only have one item for now

      // Proceed with the order
      const newOrder = new OrdersModel({
        UserEmail: email,
        Order: [{ serviceName, servicePrice, status }],
        Total: total,
      });

      await newOrder.save();

      // Remove the item from the user's cart
      user.cart = user.cart.filter((item) => item.serviceName !== serviceName);
      await user.save();

      res.json({
        success: true,
        message: "Order proceeded and saved successfully",
      });
    } else {
      res.json({ success: false, message: "Item not found in cart" });
    }
  } catch (error) {
    console.error("Error proceeding with the order:", error);
    res.json({ success: false, message: "An error occurred" });
  }
});

app.put("/api/orders/deliver", async (req, res) => {
  const { orderId, status } = req.body;

  try {
    // Find the order and update its status to "Delivered"
    const updatedOrder = await OrdersModel.findByIdAndUpdate(
      orderId,
      { status: status || "Delivered" },
      { new: true }
    );

    if (updatedOrder) {
      res.status(200).json({
        success: true,
        message: "Order status updated to Delivered.",
        order: updatedOrder,
      });
    } else {
      res.status(404).json({ success: false, message: "Order not found." });
    }
  } catch (error) {
    console.error("Error updating order status:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
});

// Update order status to "Cancelled"
app.put("/api/orders/cancel", async (req, res) => {
  const { orderId, status } = req.body;

  try {
    // Find the order and update its status to "Cancelled"
    const updatedOrder = await OrdersModel.findByIdAndUpdate(
      orderId,
      { status: status || "Cancelled" },
      { new: true }
    );

    if (updatedOrder) {
      res.status(200).json({
        success: true,
        message: "Order status updated to Cancelled.",
        order: updatedOrder,
      });
    } else {
      res.status(404).json({ success: false, message: "Order not found." });
    }
  } catch (error) {
    console.error("Error updating order status:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
});

// Express.js example
app.delete("/api/remove-service", async (req, res) => {
  const { serviceName } = req.body;

  try {
    const deletedService = await ServiceModel.findOneAndDelete({ serviceName });

    if (deletedService) {
      res
        .status(200)
        .json({ success: true, message: "Service removed successfully." });
    } else {
      res.status(404).json({ success: false, message: "Service not found." });
    }
  } catch (error) {
    console.error("Error removing service:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
});

app.get("/services", async (req, res) => {
  try {
    const services = await ServiceModel.find(); // Fetch all services from the database
    res.status(200).json({ success: true, services });
  } catch (error) {
    console.error("Error fetching services:", error);
    res
      .status(500)
      .json({ success: false, message: "Error fetching services" });
  }
});

// Fetch all orders (Admin)
app.get("/api/orders-all", async (req, res) => {
  try {
    const orders = await OrdersModel.find(); // Assuming 'Order' is your model for orders
    res.json({
      success: true,
      orders,
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ success: false, message: "Error fetching orders." });
  }
});

app.get("/api/orders", async (req, res) => {
  const { email } = req.query; // Get email from query parameters

  try {
    // Fetch orders for the user from the database
    const orders = await OrdersModel.find({ UserEmail: email });

    if (orders.length === 0) {
      return res.json({ success: true, orders: [] });
    }

    res.json({ success: true, orders });
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.json({ success: false, message: "An error occurred" });
  }
});

// Cancel Order
app.post("/api/cancel-order", async (req, res) => {
  const { email, serviceName } = req.body;

  try {
    const user = await UsersModel.findOne({ email });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const cartItem = user.cart.find((item) => item.serviceName === serviceName);

    if (cartItem) {
      user.cart = user.cart.filter((item) => item.serviceName !== serviceName);
      await user.save();
      res.json({ success: true, message: "Order canceled successfully" });
    } else {
      res.json({ success: false, message: "Item not found in cart" });
    }
  } catch (error) {
    console.error("Error canceling the order:", error);
    res.json({ success: false, message: "An error occurred" });
  }
});

app.put("/api/assignToTeam", async (req, res) => {
  try {
    const { selectedEmail, orderDetails } = req.body;

    // Update the user's assigned orders
    const updatedUser = await UsersModel.findOneAndUpdate(
      { email: selectedEmail },
      { $push: { team_orders: orderDetails } },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update the order's assignedTo and status fields
    const updatedOrder = await OrdersModel.findOneAndUpdate(
      { _id: orderDetails.orderId },
      {
        assignedTo: selectedEmail,
        status: "Assigned",
      },
      { new: true }
    );

    if (!updatedOrder) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.status(200).json({
      message: "Order assigned successfully",
      user: updatedUser,
      order: updatedOrder,
    });
  } catch (error) {
    console.error("Error in assignment:", error);
    res.status(500).json({ message: "Server error", error });
  }
});

// Default Route
app.get("/", (req, res) => {
  res.send("Hello World from Zaid");
});

// Start Server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
