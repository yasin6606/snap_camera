const path = require("path");
const os = require("os");

module.exports = Object.freeze({
    SAVING_ADDRESS: path.join(os.homedir(), "Desktop", "camera_snap_result")
})