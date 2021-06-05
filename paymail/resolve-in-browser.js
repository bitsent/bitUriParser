var paymail = require("@moneybutton/paymail-client");
var bsv = require("bsv");
var fetch = require("isomorphic-fetch");

const defaultOptions = {
  paymailOfPaymailUser: "alekstest@wallet.vaionex.com",
  hdPrivKey:
    "xprv9s21ZrQH143K42VC5n2vzZfFXEsTbQA5LnWjbm7ScYwroo6QSLYK383z7oiPqsQehQP2hNa2vvRoQGxMuSqF5kghvWPcrDnZrBGu1YVia2X",
  derivationPath: "m/44'/0'/0'/0/0",

  paymailResolverFunction: resolve,
  paymailPeerDnsResolverFunction: findPeerEndpoint,
};

async function resolve(paymailAddress, satoshis = 100000, o = defaultOptions) {
  o = { ...defaultOptions, ...o };

  var derivedIdentityKey = bsv.HDPrivateKey.fromString(o.hdPrivKey).deriveChild(
    o.derivationPath
  );
  var privkeyOfPaymailUser = derivedIdentityKey.privateKey.toString();
  var pubkeyOfPaymailUser = derivedIdentityKey.publicKey.toHex();

  var client = new paymail.PaymailClient();

  var senderInfo = {
    senderName: o.paymailOfPaymailUser.split("@")[0],
    senderHandle: o.paymailOfPaymailUser,
    amount: satoshis,
    dt: new Date().toISOString(),
    purpose: "Request from " + o.paymailOfPaymailUser,
    pubkey: pubkeyOfPaymailUser,
  };

  senderInfo.signature =
    paymail.VerifiableMessage.forBasicAddressResolution(senderInfo).sign(
      privkeyOfPaymailUser
    );

  var out = await client.getOutputFor(paymailAddress, senderInfo);
  return out;
}

async function findPeerEndpoint(paymailString, o = defaultOptions) {
  o = { ...defaultOptions, ...o };

  var [alias, host] = paymailString.split("@");

  var paymailHost = host;
  try {
    var dnsSrvQuery = await fetch(
      `https://dns.google.com/resolve?name=_bsvalias._tcp.${host}&type=SRV&cd=0`
    ).then((r) => r.json());
    if (dnsSrvQuery.Status !== 0)
      throw new Error("No SRV record found for " + host);
    var data = dnsSrvQuery.Answer[0].data;
    var [_, _, paymailPort, paymailHost] = data.split(" ");
    paymailHost = paymailHost.substr(0, paymailHost.length - 1); // remove the '.'
    paymailHost = paymailHost + ":" + paymailPort;
  } catch (error) {
    // failed to get SRV record - assuming that the host is same as in the paymail address
  }

  var capabilitiesURL = `https://${paymailHost}/.well-known/bsvalias`;
  try {
    var reply = await fetch(capabilitiesURL).then((r) => r.json());
    if (!reply.capabilities)
      if (o.debugLog)
        o.debugLog(
          `Failed to get Paymail Provider Capabilities of '${host}'` +
            `\nURL: ${capabilitiesURL}` +
            `\nReply: ${JSON.stringify(reply)}`
        );
  } catch (error) {
    // failed to get /.well-known/bsvalias
    return null;
  }

  var peer = reply.capabilities["2a40af698840"];
  if (peer) {
    peer = peer.replace("{alias}", alias).replace("{domain.tld}", host);
    return peer;
  } else return null;
}

module.exports = {
  defaultOptions,
  resolve,
  findPeerEndpoint,
};
