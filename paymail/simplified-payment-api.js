
var fetch = require("isomorphic-fetch");
var browser = require("./resolve-in-browser")

const defaultOptions = {
  simplifiedApiBaseUri: "https://api.bitsent.net",
  paymailResolverFunction: resolve,
  paymailPeerDnsResolverFunction: browser.findPeerEndpoint,
};


async function resolve(paymail, o = defaultOptions) {
  o = { ...defaultOptions, ...o };

  var paymailResolveUrl =
    simplifiedApiBaseUri +
    "/paymail/" +
    encodeURIComponent(decodeURIComponent(paymail));
  var res = await fetch(paymailResolveUrl).then(r=>r.json());
  return res.output;
}

module.exports = {
  defaultOptions,
  resolve,
};
