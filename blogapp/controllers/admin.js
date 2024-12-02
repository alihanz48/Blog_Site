const Blog = require("../models/blog");
const Category = require("../models/category");
const Role = require("../models/role");
const User = require("../models/user");
const { Op } = require("sequelize");
const sequelize = require("../data/db");
const slugField = require("../helpers/slugfield");

const fs = require("fs");

exports.get_blog_delete = async function(req, res){
    const blogid = req.params.blogid;

    try {
        const blog = await Blog.findByPk(blogid);

        if(blog) {
            return res.render("admin/blog-delete", {
                title: "delete blog",
                blog: blog
            });
        }
        res.redirect("/admin/blogs");
    }
    catch(err) {
        console.log(err); 
    }
}

exports.post_blog_delete = async function(req, res) {
    const blogid = req.body.blogid;
    try {
        const blog = await Blog.findByPk(blogid);
        if(blog) {
            await blog.destroy();
            return res.redirect("/admin/blogs?action=delete");
        }
        res.redirect("/admin/blogs");
    }
    catch(err) {
        console.log(err);
    }
}

exports.get_category_delete = async function(req, res){
    const categoryid = req.params.categoryid;

    try {
        const category = await Category.findByPk(categoryid);

        res.render("admin/category-delete", {
            title: "delete category",
            category: category
        });
    }
    catch(err) {
        console.log(err);
    }
}

exports.post_category_delete = async function(req, res) {
    const categoryid = req.body.categoryid;
    try {
        await Category.destroy({
            where: {
                id: categoryid
            }
        });
        res.redirect("/admin/categories?action=delete");
    }
    catch(err) {
        console.log(err);
    }
}

exports.get_blog_create = async function(req, res) {
    try {
        const categories = await Category.findAll();

        res.render("admin/blog-create", {
            title: "add blog",
            categories: categories
        });
    }
    catch(err) {
        console.log(err);
    }
}

exports.post_blog_create = async function(req, res) {
    const baslik = req.body.baslik;
    const altbaslik = req.body.altbaslik;
    const aciklama = req.body.aciklama;
    const resim = req.file.filename;
    const anasayfa = req.body.anasayfa == "on" ? 1:0;
    const onay = req.body.onay == "on"? 1:0;

    try {
        await Blog.create({
            baslik: baslik,
            url: slugField(baslik),
            altbaslik: altbaslik,
            aciklama: aciklama,
            resim: resim,
            anasayfa: anasayfa,
            onay: onay
        });
        res.redirect("/admin/blogs?action=create");
    }
    catch(err) {
        console.log(err);
    }
}

exports.get_category_create = async function(req, res) {
    try {
        res.render("admin/category-create", {
            title: "add category"
        });
    }
    catch(err) {
        console.log(err);
    }
}

exports.post_category_create = async function(req, res) {
    const name = req.body.name;
    try {
        await Category.create({ name: name });
        res.redirect("/admin/categories?action=create");
    }
    catch(err) {
        console.log(err);
    }
}

exports.get_blog_edit = async function(req, res) {
    const blogid = req.params.blogid;

    try {
        const blog = await Blog.findOne({
            where: {
                id: blogid
            },
            include: {
                model: Category,
                attributes: ["id"]
            }
        });
        const categories = await Category.findAll();

        if(blog) {
            return res.render("admin/blog-edit", {
                title: blog.dataValues.baslik,
                blog: blog.dataValues,
                categories: categories
            });
        }

        res.redirect("admin/blogs");
    }
    catch(err) {
        console.log(err);
    }
}

exports.post_blog_edit = async function(req, res) {
    const blogid = req.body.blogid;
    const baslik = req.body.baslik;
    const altbaslik = req.body.altbaslik;
    const aciklama = req.body.aciklama;
    const kategoriIds = req.body.categories;
    const url = req.body.url;

    let resim = req.body.resim;

    if(req.file) {
        resim = req.file.filename;

        fs.unlink("./public/images/" + req.body.resim, err => {
            console.log(err);
        });
    }

    const anasayfa = req.body.anasayfa == "on" ? 1 : 0;
    const onay = req.body.onay == "on" ? 1 : 0;

    try {
        const blog = await Blog.findOne({
            where: {
                id: blogid
            },
            include: {
                model: Category,
                attributes: ["id"]
            }
        });
        if(blog) {
            blog.baslik = baslik;
            blog.altbaslik = altbaslik;
            blog.aciklama = aciklama;
            blog.resim = resim;
            blog.anasayfa = anasayfa;
            blog.onay = onay;
            blog.url = url;
            
            if(kategoriIds == undefined) {
                await blog.removeCategories(blog.categories);
            } else {
                await blog.removeCategories(blog.categories);
                const selectedCategories = await Category.findAll({
                    where: {
                        id: {
                            [Op.in]: kategoriIds
                        }
                    }
                });
                await blog.addCategories(selectedCategories);
            }

            await blog.save();
            return res.redirect("/admin/blogs?action=edit&blogid=" + blogid);
        }
        res.redirect("/admin/blogs");
    }
    catch(err) {
        console.log(err);
    }
}

exports.get_category_remove = async function(req, res) {
    const blogid = req.body.blogid;
    const categoryid = req.body.categoryid;

    await sequelize.query(`delete from blogCategories where blogId=${blogid} and categoryId=${categoryid}`);
    res.redirect("/admin/categories/" + categoryid);
}

exports.get_category_edit = async function(req, res) {
    const categoryid = req.params.categoryid;

    try {
        const category = await Category.findByPk(categoryid);
        const blogs = await category.getBlogs();
        const countBlog = await category.countBlogs();

        if(category) {
            return res.render("admin/category-edit", {
                title: category.dataValues.name,
                category: category.dataValues,
                blogs: blogs,
                countBlog: countBlog
            });
        }

        res.redirect("admin/categories");
    }
    catch(err) {
        console.log(err);
    }
}

exports.post_category_edit = async function(req, res) {
    const categoryid = req.body.categoryid;
    const name = req.body.name;

    try {
        await Category.update({ name: name }, {
            where: {
              id: categoryid
            }
        });
        return res.redirect("/admin/categories?action=edit&categoryid=" + categoryid);
    }    
    catch(err) {
        console.log(err);
    }
}

exports.get_blogs = async function(req, res) {
    try {
        const blogs = await Blog.findAll({ 
            attributes: ["id","baslik","altbaslik","resim"],
            include: {
                model: Category,
                attributes: ["name"]
            } 
        });
        res.render("admin/blog-list", {
            title: "blog list",
            blogs: blogs,
            action: req.query.action,
            blogid: req.query.blogid
        });
    }
    catch(err) {
        console.log(err);
    }
}

exports.get_categories = async function(req, res) {
    try {
        const categories = await Category.findAll();

        res.render("admin/category-list", {
            title: "blog list",
            categories: categories,
            action: req.query.action,
            categoryid: req.query.categoryid
        });
    }
    catch(err) {
        console.log(err);
    }
}

exports.get_roles = async function(req, res) {
    try {
        const roles = await Role.findAll({
            attributes: {
                include: ['role.id','role.rolename',[sequelize.fn('COUNT', sequelize.col('users.id')), 'user_count']]
            },
            include: [
                {model: User, attributes:['id'] }
            ],
            group: ['role.id'],
            raw: true,
            includeIgnoreAttributes: false
        });

        res.render("admin/role-list", {
            title: "role list",
            roles: roles
        });
    }
    catch(err) {
        console.log(err);
    }
}

exports.get_role_edit = async function(req, res) {
    const roleid = req.params.roleid;
    try {
       const role = await Role.findByPk(roleid);
       const users = await role.getUsers();
       if(role) {
        return res.render("admin/role-edit", {
            title: role.rolename,
            role: role,
            users: users
        });
       }

       res.redirect("admin/roles");
    }
    catch(err) {
        console.log(err);
    }
}

exports.post_role_edit = async function(req, res) {
    const roleid= req.body.roleid;
    const rolename= req.body.rolename;
    try {
       await Role.update({ rolename: rolename }, {
        where: {
            id: roleid
        }
       });
       return res.redirect("/admin/roles");
    }
    catch(err) {
        console.log(err);
    }
}

exports.roles_remove = async function(req, res) {
    const roleid= req.body.roleid;
    const userid= req.body.userid;
    console.log(roleid, userid);

    try {
       await sequelize.query(`delete from userRoles where userId=${userid} and roleId=${roleid}`);
       return res.redirect("/admin/roles/" + roleid);
    }
    catch(err) {
        console.log(err);
    }
}

exports.get_user = async function(req,res) {
    try {
       const users = await User.findAll({
        attributes: ["id","fullname","email"],
        include: {
            model: Role,
            attributes: ["rolename"]
        }
       });

       res.render("admin/user-list", {
        title: "user list",
        users: users
       })
     }
     catch(err) {
         console.log(err);
     }
}


