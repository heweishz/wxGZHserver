// https请求方式: GET https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=APPID&secret=APPSECRET
import axios from 'axios';
import sha1 from 'sha1';
import TicketModel from '../Models/TicketModel.js';

const getTicketFromDB = async () => {
  let token, ticket;
  const ticketFromDB = await TicketModel.find();
  if (ticketFromDB.length === 0) {
    token = await getAccessToken();
    ticket = await getTicket();
    new TicketModel({
      accessToken: token,
      ticketData: ticket,
      timeStamp: new Date().getTime(),
    }).save();
  } else {
    if (new Date().getTime() - ticketFromDB[0].timeStamp < 7000000) {
      token = ticketFromDB[0].accessToken;
      ticket = ticketFromDB[0].ticketData;
    } else {
      token = await getAccessToken();
      ticket = await getTicket();
      const _id = ticketFromDB[0]._id;
      // await TicketModel.update(
      //   { _id },
      //   {
      //     accessToken: token,
      //     ticketData: ticket,
      //     timeStamp: new Date().getTime(),
      //   }
      // );
      const tobeUpdate = await TicketModel.findById(_id);
      if (tobeUpdate) {
        (tobeUpdate.accessToken = token),
          (tobeUpdate.ticketData = ticket),
          (tobeUpdate.timeStamp = new Date().getTime()),
          await tobeUpdate.save();
      }
    }
  }
  return { token, ticket };
};
async function getAccessToken() {
  let accessToken;
  const tokenData = await axios
    .get(
      `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${process.env.APPID}&secret=${process.env.APP_SECRET}`
    )
    .then((res) => {
      accessToken = res.data.access_token;
    })
    .catch((err) => console.log(err, 'getAccessToken err'));
  return accessToken;
}

async function getTicket() {
  const tokenData = await axios.get(
    `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${process.env.APPID}&secret=${process.env.APP_SECRET}`
  );

  const accessToken = tokenData.data.access_token;
  const ticketData = await axios.get(
    `https://api.weixin.qq.com/cgi-bin/ticket/getticket?access_token=${accessToken}&type=jsapi`
  );
  return ticketData.data.ticket;
}

const createNonceStr = () => {
  return Math.random().toString(36).substr(2, 15);
};
const createTimeStamp = () => {
  return parseInt(new Date().getTime() / 1000) + '';
};
const row = (obj) => {
  let keys = Object.keys(obj);
  keys = keys.sort();
  const newObj = {};
  keys.forEach((key) => {
    newObj[key.toLowerCase()] = obj[key];
  });
  let str = '';
  for (let k in newObj) {
    str += '&' + k + '=' + newObj[k];
  }
  return (str = str.slice(1));
};

const sign = async (url) => {
  const { ticket } = await getTicketFromDB();
  const jsapi_ticket = ticket;
  const obj = {
    jsapi_ticket,
    nonceStr: createNonceStr(),
    timestamp: createTimeStamp(),
    url,
  };
  const str = row(obj);
  const signature = sha1(str);
  obj.signature = signature;
  obj.appId = process.env.APPID;
  return obj;
};

export { sign, getAccessToken, getTicketFromDB };
