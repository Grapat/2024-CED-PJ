// routes/index.js
const express = require("express");
const router = express.Router();

// หน้า Root ("/") -> Redirect ไปหน้า /login (User)
router.get("/", (req, res) => {
  res.redirect("/login");
});

module.exports = router;
