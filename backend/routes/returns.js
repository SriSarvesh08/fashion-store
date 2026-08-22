const express = require('express');
const router = express.Router();
const returnController = require('../controllers/returnController');
const authMiddleware = require('../middleware/auth');

router.post('/', returnController.submitReturn);
router.get('/', authMiddleware, returnController.getAllReturns);
router.patch('/:id', authMiddleware, returnController.updateReturn);

module.exports = router;
