const config = require("../config/auth.config");
const db = require("../models");
const User = db.user;
const Role = db.role;
const randtoken = require('rand-token');
const nodemailer = require('nodemailer');
const upload = require("../middlewares/upload");

var jwt = require("jsonwebtoken");
var bcrypt = require("bcryptjs");


exports.signup = (req, res) => {
  const user = new User({
    active: 1,
    username: req.body.username,
    email: req.body.email,
    password: bcrypt.hashSync(req.body.password, 8)
  });

  user.save((err, user) => {
    if (err) {
      res.status(500).send({ message: err });
      return;
    }

    if (req.body.roles) {
      Role.find(
        {
          name: { $in: req.body.roles }
        },
        (err, roles) => {
          if (err) {
            res.status(500).send({ message: err });
            return;
          }

          user.roles = roles.map(role => role._id);
          user.save(err => {
            if (err) {
              res.status(500).send({ message: err });
              return;
            }

            res.send({ message: "User was registered successfully!" });
          });
        }
      );
    } else {
      Role.findOne({ name: "user" }, (err, role) => {
        if (err) {
          res.status(500).send({ message: err });
          return;
        }

        user.roles = [role._id];
        user.save(err => {
          if (err) {
            res.status(500).send({ message: err });
            return;
          }

          res.send({ message: "User was registered successfully!" });
        });
      });
    }
  });
};

exports.signin = (req, res) => {
  User.findOne({
    username: req.body.username
  })
    .populate("roles", "-__v")
    .exec((err, user) => {
      if (err) {
        res.status(500).send({ message: err });
        return;
      }

      if (!user) {
        return res.status(404).send({ message: "User Not found." });
      }

      var passwordIsValid = bcrypt.compareSync(
        req.body.password,
        user.password
      );

      if (!passwordIsValid) {
        return res.status(401).send({
          accessToken: null,
          message: "Invalid Password!"
        });
      }

      var token = jwt.sign({ id: user.id }, config.secret, {
        expiresIn: 86400 // 24 hours
      });

      var authorities = [];

      for (let i = 0; i < user.roles.length; i++) {
        authorities.push("ROLE_" + user.roles[i].name.toUpperCase());
      }
      res.status(200).send({
        username: user.username,
        email: user.email,
        roles: authorities,
        accessToken: token
      });
    });


};

exports.resetPassword = (req, res) => {
  var email = req.body.email;

  User.findOne({
    email: req.body.email
  }).exec((err, result) => {

    if (err) {
      res.status(500).send({ message: err });
      return;
    }
    
    var type = ''
    var msg = ''

    console.log(result.email);

    if (result.email.length > 0) {
      console.log("result.email");

      var token = randtoken.generate(20);
      var sent = sendEmail(email, token);
      
      res.send({"sent": sent});
      // if (sent != '0') {
      //   var data = {
      //     token: token
      //   }
      //   connection.query('UPDATE users SET ? WHERE email ="' + email + '"', data, function (err, result) {
      //     if (err) throw err
      //   })
      //   type = 'success';
      //   msg = 'The reset password link has been sent to your email address';
      // } else {
      //   type = 'error';
      //   msg = 'Something goes to wrong. Please try again';
      // }
    } else {
      console.log('2');
      type = 'error';
      msg = 'The Email is not registered with us';
    }
    // req.flash(type, msg);
    // res.redirect('/');
  });
}

/* update password to database */
exports.updatePassword = (req, res) => {

  var token = req.body.token;
  var password = req.body.password;

  connection.query('SELECT * FROM users WHERE token ="' + token + '"', function (err, result) {
    if (err) throw err;

    var type
    var msg

    if (result.length > 0) {

      var saltRounds = 10;
      // var hash = bcrypt.hash(password, saltRounds);
      bcrypt.genSalt(saltRounds, function (err, salt) {
        bcrypt.hash(password, salt, function (err, hash) {
          var data = {
            password: hash
          }
          connection.query('UPDATE users SET ? WHERE email ="' + result[0].email + '"', data, function (err, result) {
            if (err) throw err
          });
        });
      });
      type = 'success';
      msg = 'Your password has been updated successfully';
    } else {
      console.log('2');
      type = 'success';
      msg = 'Invalid link; please try again';
    }
    req.flash(type, msg);
    res.redirect('/');
  });
}



function sendEmail(email, token) {

  var email = "jaswantsingh.ameotech@gmail.com";
  var token = token;

  var mail = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'jaswantsingh.ameotech@gmail.com', // Your email id
      pass: 'jaswant@1234' // Your password
    }
  });

  var mailOptions = {
    from: 'jaswantsingh.ameotech@gmail.com',
    to: email,
    subject: 'Reset Password Link - Tutsmake.com',
    html: '<p>You requested for reset password, kindly use this <a href="http://localhost:4000/reset-password?token=' + token + '">link</a> to reset your password</p>'

  };

  mail.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(1,"error",error)
    } else {
      console.log(0)
    }
  });
}



exports.multipleUpload = async (req, res) => {
  try {
    await upload(req, res);
    
    if (req.files.length <= 0) {
      return res.send(`You must select at least 1 file.`);
    }

    return res.send(`Files has been uploaded.`);
  } catch (error) {
    console.log(error);

    if (error.code === "LIMIT_UNEXPECTED_FILE") {
      return res.send("Too many files to upload.");
    }
    return res.send(`Error when trying upload many files: ${error}`);
  }
};
