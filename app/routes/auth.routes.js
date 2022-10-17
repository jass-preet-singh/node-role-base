const { authJwt } = require("../middlewares");
const { verifySignUp } = require("../middlewares");
const controller = require("../controllers/auth.controller");

module.exports = function (app) {
  app.use(function (req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });

  /* signup Api */
  app.post(
    "/api/auth/signup",
    [
      verifySignUp.checkDuplicateUsernameOrEmail,
      verifySignUp.checkRolesExisted
    ],
    controller.signup
  );
  /* login Api */
  app.post("/api/auth/signin", controller.signin);

  /* reset email password*/
  app.post('/api/auth/reset-password-email', [authJwt.verifyToken], controller.resetPassword);

  /* update password */
  app.post("/api/auth/upload-images", [authJwt.verifyToken], controller.multipleUpload);

  app.post('/api/auth/update-password', [authJwt.verifyToken], controller.updatePassword)
};
