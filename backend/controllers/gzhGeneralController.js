import asyncHandler from '../middleware/asyncHandler.js';
import TicketModel from '../Models/TicketModel.js';
import sha1 from 'sha1';
import getRowBody from 'raw-body';
import parseXML from '../utils/parseXML.js';
import { sign } from '../utils/sign.js';
import ejs from 'ejs';

//message template maker
let tpl = `<xml>
<ToUserName><![CDATA[<%-toUserName%>]]></ToUserName>
<FromUserName><![CDATA[<%-fromUserName%>]]></FromUserName>
<CreateTime><%=createTime%></CreateTime>
<MsgType><![CDATA[<%-msgType%>]]></MsgType>
<Content><![CDATA[<%-content%>]]></Content>
</xml>`;
const compiled = ejs.compile(tpl);

const reply = (content, fromUserName, toUserName) => {
  let info = {};
  info.toUserName = toUserName;
  info.fromUserName = fromUserName;
  info.createTime = new Date().getTime();
  info.msgType = 'text';
  info.content = content;
  return compiled(info);
};

function landingPage(req, res, next) {
  res.render('index', { title: 'Express' });
}

const verifyHost = (req, res) => {
  const { signature, timestamp, nonce, echostr } = req.query;
  const token = 'whtec';
  let array = [timestamp, nonce, token];
  array.sort();
  let str = array.join('');
  const sha1str = sha1(str);
  if (sha1str === signature) {
    res.set('Content-type', 'text/plain');
    res.send(echostr);
  } else {
    res.send('Error!');
  }
};

const messageInteract = asyncHandler(async function (req, res, next) {
  const { signature, timestamp, nonce, openid } = req.query;
  console.log(signature, timestamp, nonce, openid);
  const token = 'whtec';
  let array = [timestamp, nonce, token];
  array.sort();
  let str = array.join('');
  const sha1str = sha1(str);
  if (sha1str === signature) {
    const xml = await getRowBody(req, {
      length: req.headers['content-length'],
      limit: '1mb',
      encoding: req.charset || 'utf-8',
    });
    const formated = await parseXML(xml);
    console.log(formated, '<<formated recieved msg');

    let content = '';
    if (formated.MsgType === 'text') {
      content = formated.Content;
    }
    const replyXML = reply(content, formated.ToUserName, formated.FromUserName);

    res.send(replyXML);
    // res.send(`<xml>
    //   <ToUserName><![CDATA[${openid}]]></ToUserName>
    //   <FromUserName><![CDATA[${formated.ToUserName}]]></FromUserName>
    //   <CreateTime>${new Date().getTime()}</CreateTime>
    //   <MsgType><![CDATA[text]]></MsgType>
    //   <Content><![CDATA[https://freedoll.whtec.net]]></Content>
    // </xml>`);
  } else {
    res.send('Error!');
  }
});

const getJsapiConf = asyncHandler(async function (req, res) {
  const url = decodeURIComponent(req.query.url);
  const conf = await sign(url);
  res.send(conf);
});

const cleanToken = asyncHandler(async (req, res) => {
  const ticketFromDB = await TicketModel.find();
  if (ticketFromDB) {
    const id = ticketFromDB[0]._id;
    await TicketModel.deleteOne({ _id: id });
    res.send('succeed clean token in DB');
  } else res.send({ err: 'no record' });
});

export { landingPage, verifyHost, messageInteract, getJsapiConf, cleanToken };
