// app.js
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const app = express();

// ตั้งค่า EJS + โฟลเดอร์ views
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ถ้ามีไฟล์ static (css, js) ก็ใส่:
// app.use(express.static(path.join(__dirname, 'public')));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(session({
  secret: 'mysecretkey',
  resave: false,
  saveUninitialized: false
}));

// Middleware ตรวจ user
function ensureUserLoggedIn(req, res, next) {
  if (req.session.userId) {
    return next();
  }
  return res.redirect('/login');
}

// Middleware ตรวจ admin
function ensureAdminLoggedIn(req, res, next) {
  if (req.session.adminId) {
    return next();
  }
  return res.redirect('/admin/login');
}

// ====================== Routes (User) ======================

// หน้า login user
app.get('/login', (req, res) => {
  res.render('login_user');
});

// รับ POST จากฟอร์ม login user
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  // งานจริงควรเข้ารหัส password
  const user = await prisma.user.findFirst({
    where: { username, password }
  });
  if (!user) {
    return res.send('Username หรือ Password ไม่ถูกต้อง');
  }
  req.session.userId = user.id;
  return res.redirect('/home');
});

// หน้า Home user
app.get('/home', ensureUserLoggedIn, (req, res) => {
  res.render('home_user');
});

// หน้า create complaint
app.get('/complaint/create', ensureUserLoggedIn, (req, res) => {
  res.render('create_complaint');
});

app.post('/complaint/create', ensureUserLoggedIn, async (req, res) => {
  const { subject, detail } = req.body;
  await prisma.complaint.create({
    data: {
      subject,
      detail,
      userId: req.session.userId
    }
  });
  return res.redirect('/complaint/history');
});

// หน้า history complaint
app.get('/complaint/history', ensureUserLoggedIn, async (req, res) => {
  const complaints = await prisma.complaint.findMany({
    where: { userId: req.session.userId },
    orderBy: { id: 'desc' }
  });
  res.render('history_complaint', { complaints });
});

// ====================== Routes (Admin) ======================

// หน้า login admin
app.get('/admin/login', (req, res) => {
  res.render('login_admin');
});

// รับ POST จากฟอร์ม login admin
app.post('/admin/login', async (req, res) => {
  const { username, password } = req.body;
  const admin = await prisma.admin.findFirst({
    where: { username, password }
  });
  if (!admin) {
    return res.send('Login Admin ไม่ถูกต้อง');
  }
  req.session.adminId = admin.id;
  return res.redirect('/admin/complaints');
});

// หน้า complaints list
app.get('/admin/complaints', ensureAdminLoggedIn, async (req, res) => {
  const complaints = await prisma.complaint.findMany({
    include: { user: true },
    orderBy: { id: 'desc' }
  });
  res.render('complaint_list_admin', { complaints });
});

// เปลี่ยนสถานะคำร้อง
app.post('/admin/complaints/update-status', ensureAdminLoggedIn, async (req, res) => {
  const { complaintId, status } = req.body;
  await prisma.complaint.update({
    where: { id: parseInt(complaintId) },
    data: { status }
  });
  return res.redirect('/admin/complaints');
});

// ====================== Start Server ======================
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log('Server is running at http://localhost:' + port);
});
