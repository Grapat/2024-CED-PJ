// routes/userRoutes.js

const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const bcrypt = require("bcrypt");
const crypto = require("crypto");

// Middleware ตรวจ user
function ensureUserLoggedIn(req, res, next) {
  if (req.session.userId) {
    return next();
  }
  return res.redirect("/login");
}

// หน้า login user
router.get("/login", (req, res) => {
  res.render("login");
});

// รับ POST จากฟอร์ม login user
router.post("/login", async (req, res) => {
  const { citizenNumber, password } = req.body;

  // แปลง citizenNumber เป็น sha256 (เหมือนขั้นตอนข้างบน)
  const hashedCitizenNumber = crypto
    .createHash('sha256')
    .update(citizenNumber + "SALT")
    .digest('hex');

  // หา user ด้วย hashedCitizenNumber (unique)
  const user = await prisma.user.findUnique({
    where: { citizenNumber: hashedCitizenNumber },
  });
  if (!user) {
    return res.send("ไม่พบผู้ใช้ในระบบ (citizenNumber ผิด)");
  }

  // เช็ค password ด้วย bcrypt
  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    return res.send("Password ไม่ถูกต้อง");
  }

  req.session.userId = user.id;
  res.redirect("/home");
});

// หน้า Home user
router.get("/home", ensureUserLoggedIn, (req, res) => {
  res.render("home");
});

// หน้า create complaint
router.get("/complaint/create", ensureUserLoggedIn, (req, res) => {
  res.render("create_complaint");
});

router.post("/complaint/create", ensureUserLoggedIn, async (req, res) => {
  const { subject, detail } = req.body;
  await prisma.complaint.create({
    data: {
      subject,
      detail,
      userId: req.session.userId,
    },
  });
  return res.redirect("/home");
});

// ------------------ Register ------------------ //

// หน้า Register
router.get("/register", (req, res) => {
  res.render("register");
});

// รับข้อมูล Register
router.post("/register", async (req, res) => {
  try {
    const { username,fullname,citizenNumber, password } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);
    console.log("hashedPassword", hashedPassword);

    const hashedCitizenNumber = crypto
      .createHash("sha256")
      .update(citizenNumber + "SALT") 
      .digest("hex");

      console.log("hashedCitizenNumber", hashedCitizenNumber);
    await prisma.user.create({
      data: {
        username,
        fullname,
        citizenNumber: hashedCitizenNumber,
        password: hashedPassword,
      }
    });
    // ลงทะเบียนสำเร็จ -> ไปหน้า login
    res.redirect("/login");
  } catch (err) {
    console.error(err);
    res.send("เกิดข้อผิดพลาด หรืออาจมี citizenNumber / username ซ้ำแล้ว");
  }
});

module.exports = router;
