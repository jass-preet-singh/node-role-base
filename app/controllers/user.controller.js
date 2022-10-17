const WebSocket = require('ws');
const db = require("../models");
const fs = require("fs");
const User = db.user;
const Role = db.role;
const QRCode = require('qrcode');
var axios = require('axios');

exports.allAccess = (req, res) => {
  const url = "https://jsonplaceholder.typicode.com/users";
  var data = [];
  var config = {
    method: 'get',
    url: url,
    headers: {},
    data: data
  };

  axios(config)
    .then(function (response) {
      res.send({ data: response.data })
    })
    .catch(function (error) {
      console.log(error);
      res.send({ error: error })

    });

};

exports.userBoard = (req, res) => {
  res.status(200).send("User Content.");
};

exports.adminBoard = (req, res) => {
  res.status(200).send("Admin Content.");
};

exports.moderatorBoard = (req, res) => {
  res.status(200).send("Moderator Content.");
};

exports.getUsersDetail = (req, res) => {
  User.find({
    roles: { $in: [("6335b11bcc812a61346c0f57"), ("6335b11bcc812a61346c0f58")] }
  }, { "password": 0, "__v": 0, "_id": 0, }).populate("roles", "-__v").exec((err, results) => {

    if (err) {
      res.status(500).send({ message: err });
      return;
    }
    if (!results) {
      return res.status(404).send({ message: "User Not found." });
    }
    var response = [];
    if (results) {
      results.forEach((result, i) => {
        for (let j = 0; j < result.roles.length; j++) {
          let role = "ROLE_" + result.roles[j].name.toUpperCase();
          response.push({
            roles: role,
            username: result.username,
            id: (i + 1),
            email: result.email,
            createdAt: result.createdAt,
            updatedAt: result.updatedAt,
          });
        }
      })
      return res.status(200).send({
        message: "sucess",
        data: response,
      });
    }
  })
}

exports.getUsersDetail = (req, res) => {
  User.find({
    roles: { $in: [("6335b11bcc812a61346c0f57"), ("6335b11bcc812a61346c0f58")] }
  }, { "password": 0, "__v": 0, "_id": 0, }).populate("roles", "-__v -_id").exec((err, results) => {

    if (err) {
      res.status(500).send({ message: err });
      return;
    }
    if (!results) {
      return res.status(404).send({ message: "User Not found." });
    }
    var response = [];
    if (results) {
      results.forEach((result, i) => {
        for (let j = 0; j < result.roles.length; j++) {
          let role = "ROLE_" + result.roles[j].name.toUpperCase();
          response.push({
            roles: role,
            username: result.username,
            id: (i + 1),
            email: result.email,
            createdAt: result.createdAt,
            updatedAt: result.updatedAt,
          });
        }
      })
      return res.status(200).send({
        message: "sucess",
        data: response,
      });
    }
  })
}

exports.updateUserDetails = (req, res) => {

  User.updateOne({
    username: req.body.username
  }).populate("roles", "-__v -_id").exec((err, results) => {

    if (err) {
      res.status(500).send({ message: err });
      return;
    }
    if (!results) {
      return res.status(404).send({ message: "User Not found." });
    }

    return res.status(200).send({
      message: "sucess",
      username: results.username,
      email: results.email,
      phone: results.phone
    });
  })
}

exports.qrCodeGenerate = (req, res) => {

  User.find({
    username: req.body.slug
  }, { "password": 0, "__v": 0, "_id": 0 })
    .populate("roles", "-__v -_id")
    .exec((err, user) => {
      if (err) {
        res.status(500).send({ message: err });
        return;
      }

      if (!user) {
        return res.status(404).send({ message: "User Not found." });
      }

      var authorities = [];

      if (user) {
        user.forEach(users => {
          console.log("roles", users.roles)
          for (let i = 0; i < users.roles.length; i++) {
            authorities.push("ROLE_" + users.roles[i].name.toUpperCase());
          }
          user.push({ authorities });
        })
      }
      console.log("user", user)

      var data = req.body;
      let stringdata = JSON.stringify(user)

      QRCode.toString(stringdata,
        function (err, QRcode) {

          if (err) return console.log("error occurred")

          console.log("QRcode", QRcode)
        })
      QRCode.toDataURL(stringdata, function (err, code) {
        if (err) return console.log("error occurred")
        res.status(200).send({ message: "success", data: code });
      })
    })
}

exports.chatboat = (req, res) => {

  const server = new WebSocket.Server({
    port: 8080
  },
    () => {
      console.log('Server started on port 8080');
    }
  );

  const users = new Set();

  server.on('connection', (ws) => {
    const userRef = {
      ws,
    };
    users.add(userRef);

    ws.on('message', (message) => {
      console.log(message);
      try {

        // Parsing the message
        const data = JSON.parse(message);

        // Checking if the message is a valid one

        if (
          typeof data.sender !== 'string' ||
          typeof data.body !== 'string'
        ) {
          console.error('Invalid message');
          return;
        }

        // Sending the message

        const messageToSend = {
          sender: data.sender,
          body: data.body,
          sentAt: Date.now()
        }

        sendMessage(messageToSend);

      } catch (e) {
        console.error('Error passing message!', e)
      }
    });

    ws.on('close', (code, reason) => {
      users.delete(userRef);
      console.log(`Connection closed: ${code} ${reason}!`);
    });
  });

  const sendMessage = (message) => {
    users.forEach((user) => {
      user.ws.send(JSON.stringify(message));
    });
  }
}