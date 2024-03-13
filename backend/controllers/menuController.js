import asyncHandler from '../middleware/asyncHandler.js';
import { sign, getTicketFromDB } from '../utils/sign.js';
import axios from 'axios';
// const menu = require('../utils/menu.js');
import menu from '../utils/menu.json' assert { type: 'json' };

const menuQuery = asyncHandler(async function (req, res) {
  const { token } = await getTicketFromDB();
  const menuData = await axios.get(
    `https://api.weixin.qq.com/cgi-bin/get_current_selfmenu_info?access_token=${token}`
  );
  console.log(menuData.data, '<<menuData');

  res.send(menuData.data);
});
const menuDelete = asyncHandler(async function (req, res) {
  const { token } = await getTicketFromDB();
  const result = await axios.get(
    `https://api.weixin.qq.com/cgi-bin/menu/delete?access_token=${token}`
  );

  res.send(result.data);
});

const menuEdit = asyncHandler(async (req, res) => {
  const { token } = await getTicketFromDB();
  //https://api.weixin.qq.com/cgi-bin/menu/addconditional?access_token=ACCESS_TOKEN
  let result;
  try {
    result = await axios.post(
      `https://api.weixin.qq.com/cgi-bin/menu/addconditional?access_token=${token}`,
      menu
    );
  } catch (error) {
    console.log(error);
  }
  console.log(result.data, '<<result');
  res.send(result.data);
});

export { menuQuery, menuEdit, menuDelete };
