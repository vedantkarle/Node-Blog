const express = require("express");
const router = express.Router();
const { ensureAuth, ensureGuest } = require("../middleware/auth");
const Blog = require("../models/Blog");

router.get("/", ensureGuest, (req, res) => {
  res.render("login", {
    layout: "login",
  });
});

router.get("/dashboard", ensureAuth, async (req, res) => {
  try {
    const blogs = await Blog.find({ postedBy: req.user.id }).lean();

    res.render("dashboard", {
      name: req.user.firstName,
      blogs,
    });
  } catch (error) {
    console.log(error);
    res.render("error/500");
  }
});

module.exports = router;
