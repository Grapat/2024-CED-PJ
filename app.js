// app.js
const express = require("express");
const session = require("express-session");
const bodyParser = require("body-parser");
const path = require("path");
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

// import routes
const indexRoutes = require("./routes/index");
const userRoutes = require("./routes/userRoutes");
const adminRoutes = require("./routes/adminRoutes");

const prisma = new PrismaClient();
const app = express();

// ===================== Security Middlewares =====================
app.use(helmet()); // เพิ่ม security headers

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100, 
});
app.use(limiter);

// =================================================================

// ตั้งค่า EJS + โฟลเดอร์ views
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(
  session({
    secret: "mysecretkey",
    resave: false,
    saveUninitialized: false,
  })
);

// =================================================
// ใช้ route ที่เรา import มา
app.use("/", indexRoutes);       // สำหรับ "/" หรือหน้าแรก
app.use("/", userRoutes);        // สำหรับ user routes ("/login", "/home", ฯลฯ)
app.use("/", adminRoutes);       // สำหรับ admin routes ("/admin/login", "/admin/complaints", ฯลฯ)
// =================================================

// ====================== Start Server ======================
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log("Server is running at http://localhost:" + port);
});
