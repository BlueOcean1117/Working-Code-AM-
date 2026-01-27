// backend/routes/files.js
const router = require("express").Router();
const multer = require("multer");
const path = require("path");
const uploadFolder = path.join(__dirname, "..", "uploads");
const fs = require("fs");
if(!fs.existsSync(uploadFolder)) fs.mkdirSync(uploadFolder);
const storage = multer.diskStorage({
  destination: (req, file, cb)=> cb(null, uploadFolder),
  filename: (req, file, cb)=> cb(null, Date.now()+"_"+file.originalname)
});
const upload = multer({ storage });

router.post("/upload", upload.array("files", 10), (req, res)=>{
  // return URLs (local paths) — in prod upload to S3 and return public URLs
  const files = req.files.map(f => ({ filename: f.filename, url: `/uploads/${f.filename}` }));
  res.json(files);
});

module.exports = router;
