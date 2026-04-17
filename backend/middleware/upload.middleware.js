const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, "..", "uploads"));
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + "-" + file.originalname);
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fieldSize: 100 * 1024 * 1024 // 100MB
    }
});

module.exports = upload;
