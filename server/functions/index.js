global.__base = __dirname + '/';
const functions = require("firebase-functions");

var rep3 = require(__base + 'rep3');

exports.api = functions.https.onRequest((req, res) => {
    return rep3.api(req, res);
}); // api
