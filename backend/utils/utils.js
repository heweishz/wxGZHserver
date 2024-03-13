import guid from 'guid';

function getGuid() {
  return guid.create().value.replace(/-/g, '');
}
function getTimeStamp() {
  return Math.round(+new Date() / 1000).toString();
}
function parseObj2QsVsQuote(obj) {
  return Object.keys(obj)
    .map((k) => `${k}="${obj[k]}"`)
    .join();
}
export default {
  getGuid,
  getTimeStamp,
  parseObj2QsVsQuote,
};
