const express = require('express');
const path = require('path');
const multer = require('multer');
const { getAll, getAllAdmin, getOne, create, update, remove } = require('../controllers/dogsController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

const storage = multer.diskStorage({
    destination: 'uploads/',
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowed = /jpeg|jpg|png|webp/;
        const validExt = allowed.test(path.extname(file.originalname).toLowerCase());
        const validMime = allowed.test(file.mimetype);
        if (validExt && validMime) {
            cb(null, true);
        } else {
            cb(new Error('Apenas imagens (jpeg, jpg, png, webp) são permitidas'));
        }
    }
});

router.get('/', getAll);
router.get('/admin', authMiddleware, getAllAdmin);
router.get('/:id', getOne);
router.post('/', authMiddleware, upload.single('image'), create);
router.put('/:id', authMiddleware, upload.single('image'), update);
router.delete('/:id', authMiddleware, remove);

module.exports = router;
