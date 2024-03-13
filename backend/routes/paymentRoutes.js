import express from 'express';
const router = express.Router();
import { prepay, notify } from '../controllers/prepayController.js';

router.post('/prepay', prepay);
router.post('/notify', notify);

export default router;
