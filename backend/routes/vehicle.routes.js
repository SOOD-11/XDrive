const express = require('express');
const { requireAuth } = require('../middlewares/auth');
const { listVehicles ,searchVehicles,createVehicle,updateVehicle,deleteVehicle} = require('../controllers/vehicle.controller');
const { purchaseVehicle } = require('../controllers/purchase.controller');
const multer = require('multer');
const { uploadVehicleImage } = require('../controllers/image.controller');
const { restockVehicle } = require('../controllers/inventory.controller');
const router = express.Router();
const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter(_req, file, callback) {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];

    if (!allowed.includes(file.mimetype)) {
      return callback(new Error('Only JPEG, PNG, or WebP images are allowed'));
    }

    callback(null, true);
  },
});

function receiveImage(req, res, next) {
  imageUpload.single('image')(req, res, (error) => {
    if (!error) return next();

    const status = error.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
    return res.status(status).json({ error: error.message });
  });
}
router.post('/:id/image', requireAuth, receiveImage, uploadVehicleImage);
router.post('/:id/restock', requireAuth, restockVehicle);
router.get('/', requireAuth, listVehicles);
router.get('/search', requireAuth, searchVehicles);
router.post('/', requireAuth, createVehicle);
router.put('/:id', requireAuth, updateVehicle);
router.delete('/:id', requireAuth, deleteVehicle);
router.post('/:id/purchase', requireAuth, purchaseVehicle);
module.exports = router;