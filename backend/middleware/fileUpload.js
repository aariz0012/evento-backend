const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create upload directory if it doesn't exist
const createUploadDir = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

// Set storage engine
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let uploadPath = '';
    
    if (file.fieldname === 'images') {
      uploadPath = 'uploads/images';
    } else if (file.fieldname === 'videos') {
      uploadPath = 'uploads/videos';
    } else if (file.fieldname === 'documents') {
      uploadPath = 'uploads/documents';
    } else {
      uploadPath = 'uploads/others';
    }
    
    createUploadDir(path.join(__dirname, '..', uploadPath));
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Create unique filename with original extension
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`);
  }
});

// Check file type
const fileFilter = (req, file, cb) => {
  // Allowed extensions
  const imageFileTypes = /jpeg|jpg|png|gif/;
  const videoFileTypes = /mp4|mov|avi|wmv/;
  const documentFileTypes = /pdf|doc|docx|txt/;
  
  let extname = '';
  let isValid = false;
  
  if (file.fieldname === 'images') {
    extname = imageFileTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = imageFileTypes.test(file.mimetype);
    isValid = extname && mimetype;
  } else if (file.fieldname === 'videos') {
    extname = videoFileTypes.test(path.extname(file.originalname).toLowerCase());
    isValid = extname;
  } else if (file.fieldname === 'documents') {
    extname = documentFileTypes.test(path.extname(file.originalname).toLowerCase());
    isValid = extname;
  }
  
  if (isValid) {
    return cb(null, true);
  } else {
    return cb(new Error(`Invalid file type. Only ${file.fieldname === 'images' ? 'JPEG, JPG, PNG, GIF' : file.fieldname === 'videos' ? 'MP4, MOV, AVI, WMV' : 'PDF, DOC, DOCX, TXT'} are allowed.`));
  }
};

// Initialize upload
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: (req, file) => {
      if (file.fieldname === 'images') {
        return parseInt(process.env.MAX_IMAGE_SIZE) || 10 * 1024 * 1024; // 10MB
      } else if (file.fieldname === 'videos') {
        return parseInt(process.env.MAX_VIDEO_SIZE) || 30 * 1024 * 1024; // 30MB
      } else {
        return 5 * 1024 * 1024; // 5MB default for other files
      }
    }
  }
});

module.exports = upload;
