const express = require("express");
const { uploadFile } = require("../controllers/question_controllers/question_store_controller");

const router = express.Router();
router.post("/excelupload", uploadFile);


module.exports = router;