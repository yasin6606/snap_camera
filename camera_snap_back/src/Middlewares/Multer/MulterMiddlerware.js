const multer = require("multer");
const os = require("os");
const path = require("path");
const fs = require("fs");
const constants = require("./../../assets/constants")

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // const savingAddress = path.join(os.homedir(), "Desktop", "camera_snap_result");

        if (!fs.existsSync(constants.SAVING_ADDRESS))
            fs.mkdirSync(constants.SAVING_ADDRESS, {recursive: true});

        cb(null, constants.SAVING_ADDRESS);
    },
    filename: (req, file, cb) => {
        cb(null, req.body.fileName)
    }
});

const diskStorage = multer({storage});

module.exports = diskStorage;