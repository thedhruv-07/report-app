const multer = require("multer");

const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: {
        fieldSize: 100 * 1024 * 1024 // 100MB
    }
});

module.exports = upload;
