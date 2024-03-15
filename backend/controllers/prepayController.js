import asyncHandler from '../middleware/asyncHandler.js';
import axios from 'axios';
import util from '../utils/utils.js';
import Rsa from '../utils/rsa.js';
import camelCase from 'camelcase';
import crypto from 'crypto';
import CertModel from '../Models/CertModel.js';

// @desc    get prepay_id
// @route   POST /payment/prepay
// @access  Public
const prepay = asyncHandler(async (req, res) => {
  const API_PAY = 'https://api.mch.weixin.qq.com/v3/pay/transactions/jsapi';
  const { money, openid, subject, out_trade_no, callbackToken } = req.body;
  let timeStamp = util.getTimeStamp();
  let nonceStr = util.getGuid();
  let body = {
    appid: process.env.APPID,
    mchid: process.env.MCHID,
    description: subject,
    attach: JSON.stringify({ subject, callbackToken }),
    out_trade_no: out_trade_no,
    notify_url: process.env.NOTIFY_URL,
    amount: { total: parseFloat(money) },
    payer: { openid },
  };

  let { pathname } = new URL(API_PAY);

  let messgae = joinMessage(
    'POST',
    pathname,
    timeStamp,
    nonceStr,
    JSON.stringify(body)
  );
  //签名
  let signature = calcSign(messgae);

  let authMessage = joinAuthMessage(timeStamp, nonceStr, signature);
  let {
    data: { prepay_id },
  } = await axios.post(API_PAY, body, {
    headers: {
      Authorization: 'WECHATPAY2-SHA256-RSA2048' + ' ' + authMessage,
    },
  });

  let package01 = 'prepay_id=' + prepay_id;
  let paySign = calcSign(
    joinMessage(process.env.APPID, timeStamp, nonceStr, package01)
  );

  res.json({
    appId: process.env.APPID,
    nonceStr,
    package: package01,
    paySign,
    timeStamp,
    signType: 'RSA',
  });
});

// @desc    receive wx notification
// @route   POST /payment/notify
// @access  Public
const notify = asyncHandler(async (req, res) => {
  const BASE_API = 'https://api.mch.weixin.qq.com';
  const header_serial = req.get('wechatpay-serial');
  let timeStamp = util.getTimeStamp();
  let nonceStr = util.getGuid();
  let pathName = '/v3/certificates';
  let message = joinMessage('GET', pathName, timeStamp, nonceStr, '');
  let signature = calcSign(message);
  let authMessage = joinAuthMessage(timeStamp, nonceStr, signature);
  let cert = await CertModel.findOne();
  if (cert) {
    cert = JSON.parse(cert.cert);
    let headers = req.headers;
    let header_wechat = Object.keys(headers)
      .filter((header) => header.startsWith('wechatpay-'))
      .reduce((a, c) => {
        return Object.assign(a, {
          [camelCase(c).replace('wechatpay', '')]: headers[c],
        });
      }, {});
    let { Nonce, Serial, Signature, SignatureType, Timestamp } = header_wechat;
    // //3.检查时间戳是否是五分钟内的
    if (Math.floor(+new Date() / 1000) - Timestamp > 5 * 60) {
      throw new Error('expires req');
    }

    // let isValidSign = await verifyHeaderSign({
    //   msg: joinMessage(Timestamp, Nonce, JSON.stringify(req.body)), //构造验签名串
    //   sign: Signature,
    //   serial: Serial,
    // });
    // if (!isValidSign) console.log('invalid sign');

    // console.log(isValidSign, '<<isValidSign');
    let { serial_no, encrypt_certificate } = cert;
    //检查  Wechatpay-Serial 是否一致。若不一致则重新请求证书
    if (header_serial !== serial_no) {
      //update cert in DB from official chanel
      let { data } = await axios.get(BASE_API + pathName, {
        headers: {
          Accept: 'application/json',
          Authorization: 'WECHATPAY2-SHA256-RSA2048' + ' ' + authMessage,
        },
      });
      new CertModel({
        cert: JSON.stringify(data.data[0]),
        timeStamp: new Date().getTime(),
      }).save();
      res.status(401); //terminal request,wait for next repeat notify
      throw new Error('update cert in DB');
    }
    let { ciphertext, associated_data, nonce } = encrypt_certificate;

    const pubKey = exportPubKeyFromCert(
      decryptWith256AES({ ciphertext, associated_data, nonce })
    );
    let msg01 = joinMessage(Timestamp, Nonce, JSON.stringify(req.body));
    // let signDes = Buffer.from(Signature, 'base64').toString('utf8');
    if (Rsa.verify(msg01, Signature, pubKey)) {
      //decrypt body
      let wxPayResult = JSON.parse(decryptBody(req.body.resource));
      let notifyFeedback = await axios.post(
        'https://freedoll.whtec.net/api/payment/wxGZHpayment',
        {
          ...wxPayResult,
          ...JSON.parse(wxPayResult.attach),
        }
      );
      return res.send(notifyFeedback.data);
    } else {
      res.status(401);
      throw new Error('verify error');
    }
  } else {
    //get cert firstly
    let { data } = await axios.get(BASE_API + pathName, {
      headers: {
        Accept: 'application/json',
        Authorization: 'WECHATPAY2-SHA256-RSA2048' + ' ' + authMessage,
      },
    });
    new CertModel({
      cert: JSON.stringify(data.data[0]),
      timeStamp: new Date().getTime(),
    }).save();
    return new Error("certificate haven't get");
  }
});

// @desc    query wx payment result actively
// @route   POST /payment/queryTransaction
// @access  Public
// @ this api have been used in production
const queryTransaction = asyncHandler(async (req, res) => {
  //https://api.mch.weixin.qq.com
  ///v3/pay/transactions/id/{transaction_id}
  const { transaction_id } = req.query;
  let timeStamp = util.getTimeStamp();
  let nonceStr = util.getGuid();
  const queryURL = `https://api.mch.weixin.qq.com/v3/pay/transactions/id/${transaction_id}?mchid=${process.env.MCHID}`;
  const { pathname, search } = new URL(queryURL);
  let message = joinMessage('GET', pathname + search, timeStamp, nonceStr, '');
  //签名
  let signature = calcSign(message);
  let authMessage = joinAuthMessage(timeStamp, nonceStr, signature);
  let { data } = await axios.get(queryURL, {
    headers: {
      Accept: 'application/json',
      Authorization: 'WECHATPAY2-SHA256-RSA2048' + ' ' + authMessage,
    },
  });
  res.send(true);
});

/**
 * help function begin
 */
function joinMessage(...args) {
  return args.join('\n') + '\n';
}
function calcSign(msg) {
  //   console.log(msg);

  return Rsa.sign(msg, process.env.PRIMARY_PEM);
}
function joinAuthMessage(timestamp, nonce_str, signature) {
  return util.parseObj2QsVsQuote({
    mchid: process.env.MCHID,
    serial_no: process.env.SERIAL_NO,
    nonce_str,
    timestamp,
    signature,
  });
}
function decryptBody({ ciphertext, associated_data, nonce }) {
  return decryptWith256AES({ ciphertext, associated_data, nonce });
}

//如果首次请求证书

async function verifyHeaderSign({ msg, sign, pubKey }) {
  //验签
  return Rsa.verify(msg, sign, pubKey);
}

function decryptWith256AES(encrypted) {
  //algorithm=AEAD_AES_256_GCM
  //ciphertext=加密后的证书内容,nonce加密证书的随机串】 对应到加密算法中的IV。
  //加密算法中的IV就是加盐，即使原文一样，密钥一样，因为盐值的不同，密文也不一样
  const { ciphertext, associated_data, nonce } = encrypted;
  //base64用于指定ciphertext的编码格式.(base64)
  const encryptedBuffer = Buffer.from(ciphertext, 'base64');
  //encryptedBuffer分成二部分，最后的16个字节是认证标签
  //前面的才是加密后的内容
  const authTag = encryptedBuffer.subarray(encryptedBuffer.length - 16);
  const encryptedData = encryptedBuffer.subarray(
    0,
    encryptedBuffer.length - 16
  );
  //AEAD_AES_256_GCM 提供了认证加密的功能，在这个模块式，除了加密的数据本身外，还生成一个认证标签的额外数据
  //用于保证数据的完整性的真实性
  //AAD附加认证数据 AAD是在加密过程中使用的数据，但不会被加密

  //创建一个解密器
  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    process.env.API_KEY,
    nonce
  );
  decipher.setAuthTag(authTag); //设置认证标签
  decipher.setAAD(Buffer.from(associated_data)); //设置附加认证数据
  //开始解密，得到解密结果
  const decrypted = Buffer.concat([
    decipher.update(encryptedData),
    decipher.final(),
  ]);
  const decryptedString = decrypted.toString('utf8');
  return decryptedString;
}
function exportPubKeyFromCert(certificateString) {
  return crypto
    .createPublicKey(certificateString)
    .export({ type: 'spki', format: 'pem' });
}
function base64toStr(signature) {
  Buffer.from(signature, 'base64').toString('utf8');
}
/**
 * help function end
 */
export { prepay, notify, queryTransaction };
