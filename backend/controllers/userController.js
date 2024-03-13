import asyncHandler from '../middleware/asyncHandler.js';
import axios from 'axios';
const getInteractCode = asyncHandler((req, res) => {
  let url = `https://open.weixin.qq.com/connect/oauth2/authorize?appid=${
    process.env.APPID
  }&redirect_uri=${encodeURIComponent(
    'https://freedoll.whtec.net'
  )}&response_type=code&scope=snsapi_userinfo&state=STATE#wechat_redirect`;
  console.log('reach getInteractCode');
  res.send(url);
});
const getCode = asyncHandler((req, res) => {
  let url = `https://open.weixin.qq.com/connect/oauth2/authorize?appid=${
    process.env.APPID
  }&redirect_uri=${encodeURIComponent(
    'https://freedoll.whtec.net'
  )}&response_type=code&scope=snsapi_base&state=STATE#wechat_redirect`;
  console.log('reach getCode');
  res.send(url);
});

const getToken = asyncHandler(async (req, res) => {
  const code = req.query.code;
  console.log(code, '<<<code');
  if (!!code) {
    let tokenUrl = `https://api.weixin.qq.com/sns/oauth2/access_token?appid=${process.env.APPID}&secret=${process.env.APP_SECRET}&code=${code}&grant_type=authorization_code`;
    const { access_token, openid } = (await axios.get(tokenUrl)).data;

    let infoUrl = `https://api.weixin.qq.com/sns/userinfo?access_token=${access_token}&openid=${openid}&lang=zh_CN`;
    const result = (await axios.get(infoUrl)).data;
    console.log(result);
    res.send(result);
  }
  res.send('code is undefined');
});
const getUserinfo = asyncHandler(async (req, res) => {
  console.log(req.body, '<<<req.body from getUserinfo');
  const code = req.body.code;

  if (!!code) {
    let tokenUrl = `https://api.weixin.qq.com/sns/oauth2/access_token?appid=${process.env.APPID}&secret=${process.env.APP_SECRET}&code=${code}&grant_type=authorization_code`;
    const { access_token, openid } = (await axios.get(tokenUrl)).data;

    let infoUrl = `https://api.weixin.qq.com/sns/userinfo?access_token=${access_token}&openid=${openid}&lang=zh_CN`;
    const result = (await axios.get(infoUrl)).data;
    console.log(result);
    console.log('reach getUserinfo');
    return res.send(result);
  }
  res.send('code is undefined');
});

export { getCode, getInteractCode, getToken, getUserinfo };
