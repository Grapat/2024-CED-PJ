// routes/adminRoutes.js
const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

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
  const admin = await prisma.admin.findFirst({
    where: { username, password },
  });
  if (!admin) {
    return res.send("Login Admin ไม่ถูกต้อง");
  }
  req.session.adminId = admin.id;
  return res.redirect("/admin/complaints");
});

// หน้า complaints list
router.get("/admin/complaints", ensureAdminLoggedIn, async (req, res) => {
  const complaints = await prisma.complaint.findMany({
    include: { user: true },
    orderBy: { id: "desc" },
  });
  res.render("complaint_list_admin", { complaints });
});

// เปลี่ยนสถานะคำร้อง
router.post(
  "/admin/complaints/update-status",
  ensureAdminLoggedIn,
  async (req, res) => {
    const { complaintId, status } = req.body;
    await prisma.complaint.update({
      where: { id: parseInt(complaintId) },
      data: { status },
    });
    return res.redirect("/admin/complaints");
  }
);

module.exports = router;
