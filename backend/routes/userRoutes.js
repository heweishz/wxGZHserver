import express from 'express';
const router = express();
import UserModel from '../Models/UserModel.js';
import {
  getCode,
  getInteractCode,
  getToken,
  getUserinfo,
} from '../controllers/userController.js';

router.get('/getCode', getCode);
router.post('/reg', function (req, res) {
  const { user, pwd } = req.body;
  new UserModel({
    user,
    pwd,
  })
    .save()
    .then(() => {
      res.send({ code: 1, msg: 'reg succeed' });
    });
});
router.get('/gettoken', getToken);
router.get('/getInteractCode', getInteractCode);
router.post('/getUserinfo', getUserinfo);

export default router;
