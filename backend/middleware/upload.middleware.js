const multer = require("multer");

const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: {
        fieldSize: 500 * 1024 * 1024 // 500MB
    }
});

module.exports = upload;
