const decodeBase64 = (encoded) => Buffer.from(encoded, "base64").toString("utf-8");
module.exports = decodeBase64;

