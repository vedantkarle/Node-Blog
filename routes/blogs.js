const express = require("express");
const router = express.Router();
const { ensureAuth } = require("../middleware/auth");
const Blog = require("../models/Blog");
const multer = require("multer");
const { storage } = require("../config/cloudinary");

const upload = multer({ storage: storage });

router.get("/add", ensureAuth, (req, res) => {
  res.render("blogs/add");
});

router.post("/", ensureAuth, upload.single("image"), async (req, res) => {
  try {
    req.body.user = req.user.id;
    await Blog.create({
      ...req.body,
      image: req.file.path,
      postedBy: req.user.id,
    });
    res.redirect("/dashboard");
  } catch (error) {
    console.log(error);
    res.render("error/500");
  }
});

router.get("/:id", ensureAuth, async (req, res) => {
  try {
    let blog = await Blog.findById(req.params.id)
      .populate("postedBy")
      .populate("comments.postedBy")
      .lean();

    if (!blog) {
      return res.render("error/404");
    }
    res.render("blogs/show", {
      blog,
    });
  } catch (error) {
    console.log(error);
    return res.render("error/404");
  }
});

router.get("/", ensureAuth, async (req, res) => {
  try {
    const blogs = await Blog.find({ status: "public" })
      .populate("postedBy")
      .sort({ createdAt: "desc" })
      .lean();

    res.render("blogs/index", {
      blogs,
    });
  } catch (error) {
    console.log(error);
    res.render("error/500");
  }
});

router.get("/edit/:id", ensureAuth, async (req, res) => {
  const blog = await Blog.findOne({ _id: req.params.id }).lean();

  if (!blog) {
    return res.render("error/404");
  }

  if (blog.postedBy != req.user.id) {
    res.redirect("/blogs");
  } else {
    res.render("blogs/edit", { blog });
  }
});

router.put("/:id", ensureAuth, upload.single("image"), async (req, res) => {
  let blog = await Blog.findById(req.params.id).lean();
  let blogImage, blogObject;

  if (!blog) {
    return res.render("error/404");
  }

  if (blog.postedBy != req.user.id) {
    res.redirect("/blogs");
  } else {
    if (req.file) {
      blogImage = req.file.path;
      blogObject = { ...req.body, image: blogImage };
    } else {
      blogObject = req.body;
    }

    blog = await Blog.findOneAndUpdate({ _id: req.params.id }, blogObject, {
      new: true,
    });
  }

  res.redirect("/dashboard");
});

router.delete("/:id", ensureAuth, async (req, res) => {
  try {
    await Blog.remove({ _id: req.params.id });
    res.redirect("/dashboard");
  } catch (error) {
    console.log(error);
    return res.render("error/500");
  }
});

router.post("/:id/comment", ensureAuth, async (req, res) => {
  const text = req.body.text;
  const postedBy = req.user.id;

  const blog = await Blog.findOne({ _id: req.params.id });

  blog.comments.push({ text, postedBy });

  await blog.save();

  res.redirect(`/blogs/${req.params.id}`);
});

module.exports = router;
