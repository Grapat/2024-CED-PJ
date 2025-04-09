// routes/adminRoutes.js

const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const bcrypt = require("bcrypt");

// Middleware ตรวจ admin
function ensureAdminLoggedIn(req, res, next) {
  if (req.session.adminId) {
    return next();
  }
  return res.redirect("/admin/login");
}

// หน้า login admin
router.get("/admin/login", (req, res) => {
  res.render("login_admin");
});

// รับ POST จากฟอร์ม login admin
router.post("/admin/login", async (req, res) => {
  const { username, password } = req.body;

  // (โค้ด login เปรียบเทียบ bcrypt เป้นต้น)
  const admin = await prisma.admin.findUnique({ where: { username } });
  if (!admin) {
    return res.send("ไม่พบ Admin username นี้");
  }
  const match = await bcrypt.compare(password, admin.password);
  if (!match) {
    return res.send("รหัสผ่านไม่ถูกต้อง");
  }

  req.session.adminId = admin.id;
  return res.redirect("/admin/home");
});

// =========== เพิ่ม Route Admin Home ===========

// หน้า Home ของ Admin
router.get("/admin/home", ensureAdminLoggedIn, (req, res) => {
  // แสดงหน้า admin_home.ejs ซึ่งมีลิงก์ไปยัง complaint list / user list
  res.render("adminHome");
});

// =========== หน้า Complaints List เดิม ===========

router.get("/admin/complaints", ensureAdminLoggedIn, async (req, res) => {
  const complaints = await prisma.complaint.findMany({
    include: { user: true },
    orderBy: { id: "desc" },
  });
  res.render("complaint_list", { complaints });
});

router.post("/admin/complaints/update-status", ensureAdminLoggedIn, async (req, res) => {
  const { complaintId, status } = req.body;
  await prisma.complaint.update({
    where: { id: parseInt(complaintId) },
    data: { status },
  });
  return res.redirect("/admin/complaints");
});

// =========== เพิ่ม Route “User List” ===========

router.get("/admin/users", ensureAdminLoggedIn, async (req, res) => {
  
  const users = await prisma.user.findMany({
    orderBy: { id: "asc" },
  });

  function maskCitizenNumber(citizenNumber) {
    // ถ้าไม่มี citizenNumber ก็คืนค่าว่าง
    if (!citizenNumber) return "";

    const visibleDigits = 4;
    const length = citizenNumber.length;
    if (length <= visibleDigits) {
      // ถ้าสั้นเกินไปก็แสดงทั้งหมด
      return citizenNumber;
    }
    const hiddenLen = length - visibleDigits;
    const masked = "*".repeat(hiddenLen) + citizenNumber.slice(-visibleDigits);
    return masked;
  }

  const maskedUsers = users.map(u => {
    return {
      ...u,
      citizenNumber: maskCitizenNumber(u.citizenNumber),
    };
  });

  res.render("user_list", { users: maskedUsers });
});

module.exports = router;
