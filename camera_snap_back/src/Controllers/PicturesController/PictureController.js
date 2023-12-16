const path = require("path")

class PictureController {

    getPicture = (req, res) => {
        res.json({status: "image successfully saved."});
    };

    checkConnection = (req, res) => {
        const indexPath = path.join(__dirname, "../../statics/index.js");
        res.sendFile(indexPath, {root: __dirname});
    };
}

module.exports = PictureController;