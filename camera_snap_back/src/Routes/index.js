const express = require("express");
const router = express.Router();
const pictureController = require("./../Controllers/PicturesController/PictureController");
const multerMiddleware = require("./../Middlewares/Multer/MulterMiddlerware");

// Controllers
const pictureCont = new pictureController();

// Routes
router
    .get("/", pictureCont.checkConnection)
    .post("/", multerMiddleware.single("photo"), pictureCont.getPicture);

module.exports = router;