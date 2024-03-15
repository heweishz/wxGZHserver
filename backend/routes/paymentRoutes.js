import express from 'express';
const router = express.Router();
import {
  prepay,
  notify,
  queryTransaction,
} from '../controllers/prepayController.js';

router.post('/prepay', prepay);
router.post('/notify', notify);
router.get('/queryTransaction', queryTransaction);

export default router;
