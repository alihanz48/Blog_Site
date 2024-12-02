// express
const express = require("express");
const app = express();

const cookieParser = require('cookie-parser');
const session = require('express-session');
const SequelizeStore = require("connect-session-sequelize")(session.Store);
const csurf = require("csurf");

// node modules
const path = require("path");

// routes
const userRoutes = require("./routes/user");
const adminRoutes = require("./routes/admin");
const authRoutes = require("./routes/auth");

// custom modules
const sequelize = require("./data/db");
const dummyData = require("./data/dummy-data");
const locals = require("./middlewares/locals");

// template engine
app.set("view engine", "ejs");

// models
const Category = require("./models/category");
const Blog = require("./models/blog");
const User = require("./models/user");
const Role = require("./models/role");

// middleware
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(session({
    secret: "hello world",
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 1000 * 60 * 60 * 24
    },
    store: new SequelizeStore({
        db: sequelize
    })
}));

app.use(locals);
app.use(csurf());

app.use("/libs", express.static(path.join(__dirname, "node_modules")));
app.use("/static", express.static(path.join(__dirname, "public")));

app.use("/admin", adminRoutes);
app.use("/account", authRoutes);
app.use(userRoutes); 

Blog.belongsTo(User, {
    foreignKey: {
        allowNull: true
    }
});
User.hasMany(Blog);

Blog.belongsToMany(Category, { through: "blogCategories"});
Category.belongsToMany(Blog, { through: "blogCategories"});

Role.belongsToMany(User, {through: "userRoles"});
User.belongsToMany(Role, {through: "userRoles"});

(async () => {
    // await sequelize.sync({ force: true });
    // await dummyData();
})();

app.listen(3000, function() {
    console.log("listening on port 3000");
});