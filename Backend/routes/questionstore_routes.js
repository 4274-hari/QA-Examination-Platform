const express = require("express");
const { uploadFile } = require("../controllers/question_controllers/questionstore_controllers");

const router = express.Router();
router.post("/excelupload", uploadFile);


module.exports = router;