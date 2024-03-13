import { parseString } from 'xml2js';
function parseXML(xml) {
  return new Promise((resolve, reject) => {
    parseString(
      xml,
      {
        trim: true,
        explicitArray: false,
        ignoreAttrs: true,
      },
      (err, result) => {
        if (err) {
          reject(err);
        }
        resolve(result.xml);
      }
    );
  });
}
export default parseXML;
