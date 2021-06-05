var bitUriParser = require("./bitUriParser");
var browserPaymailResolver = require("./paymail/resolve-in-browser");

const defailtOptions = browserPaymailResolver.defaultOptions;

window.bitUriParser = {
  ...bitUriParser,
  parse: (bitcoinUriString, o = defailtOptions) =>
    bitUriParser.parse(bitcoinUriString, {...defailtOptions, ...o}),
};
