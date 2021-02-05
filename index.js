const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const hbs = require("express-handlebars");
const passport = require("passport");
const session = require("express-session");
const MongoStore = require("connect-mongo")(session);
const methodOverride = require("method-override");
require("dotenv").config();

const app = express();

//mongoose config
mongoose
  .connect(process.env.DB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
  })
  .then(() => console.log("DB Connected"))
  .catch((e) => console.log(e));

//passport Config
require("./config/passport")(passport);

// Express Config
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(methodOverride("_method"));

app.use(express.static(path.join(__dirname, "public")));

//HBS Helpers
const {
  formatDate,
  stripTags,
  truncate,
  editIcon,
  select,
} = require("./helpers/hbs");

// HBS
app.engine(
  "hbs",
  hbs({
    defaultLayout: "main",
    extname: ".hbs",
    helpers: { formatDate, stripTags, truncate, editIcon, select },
  })
);
app.set("view engine", "hbs");

//Sessions
app.use(
  session({
    secret: process.env.SECRET_KEY,
    resave: false,
    saveUninitialized: false,
    store: new MongoStore({ mongooseConnection: mongoose.connection }),
  })
);

//Passport middleware
app.use(passport.initialize());
app.use(passport.session());

//locals
app.use(function (req, res, next) {
  res.locals.user = req.user || null;
  next();
});

//Routes
app.use("/", require("./routes/index"));
app.use("/auth", require("./routes/auth"));
app.use("/blogs", require("./routes/blogs"));

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log("Server Started");
});
