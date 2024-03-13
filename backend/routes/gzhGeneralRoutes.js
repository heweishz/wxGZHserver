import express from 'express';
const router = express.Router();
import {
  landingPage,
  verifyHost,
  messageInteract,
  getJsapiConf,
  cleanToken,
} from '../controllers/gzhGeneralController.js';

/* GET home page. */
// router.get('/', landingPage);
// verify host
router.get('/auth', verifyHost);
//message interact
router.post('/auth', messageInteract);
//jsapi
router.get('/jsapi', getJsapiConf);
//menuQuery
// router.get('/menuQuery', menuQuery);
//menuEdit
// router.get('/menuEdit', menuEdit);
//menuDelete
// router.get('/menuDelete', menuDelete);
//cleanToken in DB
router.get('/cleanToken', cleanToken);
export default router;
