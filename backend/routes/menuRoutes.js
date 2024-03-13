import express from 'express';
const router = express.Router();

import {
  menuQuery,
  menuEdit,
  menuDelete,
} from '../controllers/menuController.js';

//menuQuery
router.get('/menuQuery', menuQuery);
//menuEdit
router.get('/menuEdit', menuEdit);
//menuDelete
router.get('/menuDelete', menuDelete);
export default router;
