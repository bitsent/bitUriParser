var url = require("url");
var axios = require("axios");
var bsv = require("bsv");

// the schemes are ordered - more strict to less strict
var schemes = [
  {
    name: "privkey",
    mainProtocol: "privkey",
    checkhSchema: s => true,
    checkPath: p => /[0-9A-Fa-f]{64}/.test(p),
    checkParams: p => Object.keys(p).length === 0,
    knownRequiredParams: [],

    parseOutputs: (uri, o) => [],
    parseInputs: (uri, o) => create_PrivateKey_Inputs(uri, o, bsv.PrivateKey.fromHex(uri.host)),
    parseMemo: (uri, o) => "Sweep Key",
    parsePeer: (uri, o) => null,
    getPeerProtocol: (uri, o) => null
  },
  {
    name: "privkey-wif",
    mainProtocol: "privkey",
    checkhSchema: s => true,
    checkPath: p => /[a-km-zA-HJ-NP-Z1-9]{51,52}/.test(p),
    checkParams: p => Object.keys(p).length === 0,
    knownRequiredParams: [],

    parseOutputs: (uri, o) => [],
    parseInputs: (uri, o) => create_PrivateKey_Inputs(uri, o, bsv.PrivateKey.fromWIF(uri.host)),
    parseMemo: (uri, o) => "Sweep Key",
    parsePeer: (uri, o) => null,
    getPeerProtocol: (uri, o) => null
  },
  {
    name: "address",
    mainProtocol: "address",
    checkhSchema: s => s === "",
    checkPath: p => /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(p),
    checkParams: p => Object.keys(p).length === 0,
    knownRequiredParams: [],

    parseOutputs: (uri, o) => [create_BIP21_Output(uri, o)],
    parseInputs: (uri, o) => [],
    parseMemo: (uri, o) =>
      uri.searchParams["label"] ||
      uri.searchParams["message"] ||
      "Payment to Address",
    parsePeer: (uri, o) => null,
    getPeerProtocol: (uri, o) => null
  },
  {
    name: "paymail",
    mainProtocol: "paymail",
    checkhSchema: s => s === "payto:" || s === "",
    checkPath: p => {
      var regex = /^([\w\.\-]+)@([\w\.\-]+)((\.(\w){2,8})+)$/;
      return regex.test(p) || regex.test(decodeURIComponent(p));
    },
    checkParams: p => true,
    knownRequiredParams: [],

    parseOutputs: async (uri, o) => [await create_Paymail_Output(uri, o)],
    parseInputs: (uri, o) => [],
    parseMemo: (uri, o) =>
      uri.searchParams["purpose"] || "Send to " + decodeURIComponent(uri.host),
    parsePeer: (uri, o) => check_Paymail_Peer(uri, o),
    getPeerProtocol: (uri, o) => o["peer"] ? "paymail" : null
  },
  {
    name: "bip275-bip282",
    mainProtocol: "bip282",
    checkhSchema: s => s === "bitcoin:" || s === "pay:",
    checkPath: p => p === "",
    checkParams: p =>
      ["req-inputs", "req-bip275", "paymentUrl", "network", "outputs"].every(
        i => typeof p[i] === "string"
      ),
    knownRequiredParams: ["req-inputs", "req-bip275"],

    parseOutputs: (uri, o) => create_BIP275_Outputs(uri, o),
    parseInputs: (uri, o) => create_BIP275_BIP282_Inputs(uri, o),
    parseMemo: (uri, o) => uri.searchParams["memo"] || "P2P Transaction",
    parsePeer: (uri, o) => uri.searchParams["paymentUrl"],
    getPeerProtocol: (uri, o) => "bip270"
  },
  {
    name: "bip272-bip282",
    mainProtocol: "bip282",
    checkhSchema: s => s === "bitcoin:" || s === "pay:",
    checkPath: p => p === "",
    checkParams: p =>
      ["req-inputs", "req-bip272", "r"].every(i => typeof p[i] === "string"),
    knownRequiredParams: ["req-inputs", "req-bip272"],

    parseOutputs: (uri, o) => create_BIP272_Outputs(uri, o),
    parseInputs: (uri, o) => create_BIP272_BIP282_Inputs(uri, o),
    parseMemo: (uri, o) => o["memo"] || "P2P Transaction",
    parsePeer: (uri, o) => o["peer"],
    getPeerProtocol: (uri, o) => "bip270"
  },
  {
    name: "bip275",
    mainProtocol: "bip275",
    checkhSchema: s => s === "bitcoin:" || s === "pay:",
    checkPath: p => p === "",
    checkParams: p =>
      ["req-bip275", "paymentUrl", "network", "outputs"].every(
        i => typeof p[i] === "string"
      ),
    knownRequiredParams: ["req-bip275"],

    parseOutputs: (uri, o) => create_BIP275_Outputs(uri, o),
    parseInputs: (uri, o) => [],
    parseMemo: (uri, o) => uri.searchParams["memo"] || "P2P Transaction",
    parsePeer: (uri, o) => uri.searchParams["paymentUrl"],
    getPeerProtocol: (uri, o) => "bip270"
  },
  {
    name: "bip272strict",
    mainProtocol: "bip272",
    checkhSchema: s => s === "bitcoin:" || s === "pay:",
    checkPath: p => p === "",
    checkParams: p => ["req-bip272", "r"].every(i => typeof p[i] === "string"),
    knownRequiredParams: ["req-bip272"],

    parseOutputs: (uri, o) => create_BIP272_Outputs(uri, o),
    parseInputs: (uri, o) => [],
    parseMemo: (uri, o) => o["memo"] || "P2P Transaction",
    parsePeer: (uri, o) => o["peer"],
    getPeerProtocol: (uri, o) => "bip270"
  },
  {
    name: "bip272",
    mainProtocol: "bip272",
    checkhSchema: s => s === "bitcoin:" || s === "pay:",
    checkPath: p => p === "",
    checkParams: p => ["sv", "r"].every(i => typeof p[i] === "string"),
    knownRequiredParams: [],

    parseOutputs: (uri, o) => create_BIP272_Outputs(uri, o),
    parseInputs: (uri, o) => [],
    parseMemo: (uri, o) => o["memo"] || "P2P Transaction",
    parsePeer: (uri, o) => o["peer"],
    getPeerProtocol: (uri, o) => "bip270"
  },
  {
    name: "bip272-noSvParam",
    mainProtocol: "bip272",
    checkhSchema: s => s === "bitcoin:" || s === "pay:",
    checkPath: p => p === "",
    checkParams: p => ["r"].every(i => typeof p[i] === "string"),
    knownRequiredParams: [],

    parseOutputs: (uri, o) => create_BIP272_Outputs(uri, o),
    parseInputs: (uri, o) => [],
    parseMemo: (uri, o) => o["memo"] || "P2P Transaction",
    parsePeer: (uri, o) => o["peer"],
    getPeerProtocol: (uri, o) => "bip270"
  },
  {
    name: "bip21sv",
    mainProtocol: "bip21",
    checkhSchema: s => s === "bitcoin:" || s === "",
    checkPath: p => /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(p),
    checkParams: p => typeof p["sv"] === "string",
    knownRequiredParams: [],

    parseOutputs: (uri, o) => [create_BIP21_Output(uri, o)],
    parseInputs: (uri, o) => [],
    parseMemo: (uri, o) =>
      uri.searchParams["label"] ||
      uri.searchParams["message"] ||
      "Payment to Address",
    parsePeer: (uri, o) => null,
    getPeerProtocol: (uri, o) => null
  },
  {
    name: "bip21",
    mainProtocol: "bip21",
    checkhSchema: s => s === "bitcoin:" || s === "",
    checkPath: p => /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(p),
    checkParams: p => true,
    knownRequiredParams: [],

    parseOutputs: (uri, o) => [create_BIP21_Output(uri, o)],
    parseInputs: (uri, o) => [],
    parseMemo: (uri, o) =>
      uri.searchParams["label"] ||
      uri.searchParams["message"] ||
      "Payment to Address",
    parsePeer: (uri, o) => null,
    getPeerProtocol: (uri, o) => null
  },
  {
    name: "bip72",
    mainProtocol: "bip72",
    checkhSchema: s => s === "bitcoin:",
    checkPath: p => p === "",
    checkParams: p => typeof p["r"] === "string",
    knownRequiredParams: [],

    parseOutputs: (uri, o) => create_BIP72_Outputs(uri, o),
    parseInputs: (uri, o) => [],
    parseMemo: (uri, o) => o["memo"] || "P2P Transaction",
    parsePeer: (uri, o) => o["peer"],
    getPeerProtocol: (uri, o) => "bip70"
  }
];

async function create_PrivateKey_Inputs(uri, o, key) {
  var address = bsv.Address.fromPrivateKey(key);
  var utxoData = await o.checkUtxosOfAddressFunction(address.toString(), o);

  var utxos = utxoData.map(i => {
    return {
      txid: i.txid.toString(),
      vout: parseInt(i.vout.toString()),
      satoshis: parseInt(i.satoshis.toString()),
      scriptPubKey: i.scriptPubKey.toString(),
      privkey: key.toString(),
      scriptType: findScriptType(i.scriptPubKey.toString()),
    };
  }).map(i=>{
      i.scriptSig = generateScriptSigForUtxo(i, key);
      return i;
  });
  return utxos
}
async function create_Paymail_Output(uri, o) {
  return {
    script: await o.paymailResolverFunction(uri.host, o),
    satoshis: parseInt(uri.searchParams["amount"])
  };
}
async function check_Paymail_Peer(uri, o) {
  var paymail = decodeURIComponent(uri.host);
  var atIndex = paymail.indexOf("@");
  var alias = paymail.substr(0, atIndex);
  var host = paymail.substr(atIndex + 1);
  var dnsSrvQuery = await get(`https://dns.google.com/resolve?name=_bsvalias._tcp.${host}&type=SRV&cd=0`, o);
  if (dnsSrvQuery.Status !== 0) throw new Error("No SRV record found for " + host);
  var data = dnsSrvQuery.Answer[0].data;
  var [ _, _, paymailPort, paymailHost ] = data.split(' ');
  paymailHost = paymailHost.substr(0, paymailHost.length-1); // remove the '.'
  var capabilitiesURL = `https://${paymailHost}:${paymailPort}/.well-known/bsvalias`;
  var req = await get(capabilitiesURL, o);
  if(!req.capabilities)
    throw new Error(`Failed to get Paymail Provider Capabilities of '${host}'`
      +`\nURL: ${capabilitiesURL}`
      +`\nReq: ${JSON.stringify(req)}`)
  var peer = req.capabilities["2a40af698840"]
  if(peer) {
    peer = peer.replace("{alias}", alias).replace("{domain.tld}", host);
    o["peer"] = peer;
    return peer;
  }
  else return null
}
function create_BIP275_Outputs(uri, o) {
  var outs = JSON.parse(uri.searchParams["outputs"]);
  return outs.map(o => {
    return {
      script: o.script,
      satoshis: parseInt(o.amount)
    };
  });
}
function create_BIP275_BIP282_Inputs(uri, o) {
  var ins = JSON.parse(uri.searchParams["req-inputs"]);
  return ins.map(i => {
    return {
      txid: i.txid,
      vout: parseInt(i.vout),
      satoshis: parseInt(i.value),
      scriptSig: i.scriptSig,
      privkey: undefined
    };
  });
}
async function create_BIP272_Outputs(uri, o) {
  var r = uri.searchParams["r"];
  var req = await get(r, o);

  req = {
    network: "bitcoin",
    outputs: [
      {
        amount: 500000,
        script: "76a9148c1bf1254637c3b521ce47f4b63636d11244a0bd88ac"
      }
    ],
    creationTimestamp: 1584288774,
    memo: "Pay to 1Dmq5JKtWu4yZRLWBBKh3V2koeemNTYXAY",
    paymentUrl: "https://api.bitsent.net/payment/pay"
  };

  o["memo"] = req["memo"];
  o["peer"] = req["paymentUrl"];
  o["req-inputs"] = req["req-inputs"];

  return req.outputs.map(o => {
    return {
      script: o.script,
      satoshis: parseInt(o.amount)
    };
  });
}
function create_BIP272_BIP282_Inputs(uri, o) {
  var ins = o["req-inputs"];
  return ins.map(i => {
    return {
      txid: i.txid,
      vout: parseInt(i.vout),
      satoshis: parseInt(i.value),
      scriptSig: i.scriptSig
    };
  });
}
function create_BIP21_Output(uri, o) {
  return {
    script: bsv.Script.fromAddress(uri.host).toHex(),
    satoshis: parseInt(
      parseFloat(uri.searchParams["amount"]).toFixed(8) * 100000000
    )
  };
}
function create_BIP72_Outputs(uri, o) {
  throw new Error("BIP72 Not Implemented");
  // TODO: Implement this method
  // TODO: Add MEMO property to the 'o' object
}

function findScriptType(s) {
  if (s.length == 50 && s.startsWith("76a9") && s.endsWith("ac"))
    return "p2pkh";
  else if (s.length == 70 && s.endsWith("ac"))
    return "p2pk";
  else
    return null;
}

function generateScriptSigForUtxo(utxo, key) {
  // utxo -> { txid, vout, satoshis, scriptPubKey, privkey, scriptType }
  let sigtype = bsv.crypto.Signature.SIGHASH_NONE
  | bsv.crypto.Signature.SIGHASH_ANYONECANPAY
  | bsv.crypto.Signature.SIGHASH_FORKID;
  var scriptSig = bsv.Transaction().from(utxo).sign(key, sigtype).inputs[0].script.toHex();
  return scriptSig;
}

function findUriType(bitcoinUri, options) {
  var requiredParams = [];
  Object.keys(bitcoinUri.searchParams).forEach(k => {
    if (k.startsWith("req-")) requiredParams.push(k);
  });

  var comparisons = [];
  for (var sch in schemes) {
    comparisons.push({
      name: schemes[sch].name,
      protocolPass: schemes[sch].checkhSchema(bitcoinUri.protocol),
      pathPass: schemes[sch].checkPath(bitcoinUri.host),
      paramsPass: schemes[sch].checkParams(bitcoinUri.searchParams),
      unknownRequiredParams: requiredParams.filter(
        p => schemes[sch].knownRequiredParams.indexOf(p) < 0
      )
    });
  }

  var matches = comparisons.filter(
    i =>
      i.protocolPass &&
      i.pathPass &&
      i.paramsPass &&
      i.unknownRequiredParams.length === 0
  );

  options.debugLog(
    "Scheme Comparisons : " +
      JSON.stringify(
        comparisons.map(i => JSON.stringify(i)),
        null,
        1
      )
  );
  options.debugLog(
    "Matches : " +
      JSON.stringify(
        matches.map(i => JSON.stringify(i)),
        null,
        1
      )
  );

  if (matches[0]) return matches[0].name;

  return (
    "Unknown Bitcoin URI" +
    (requiredParams.length > 0
      ? " - with required parameters: [" + requiredParams.join(", ") + "]"
      : "")
  );
}

async function get(uri, o) {
  o.debugLog(`GETTING ${uri}`);
  var res = await axios.get(uri);
  o.debugLog(`GET ${uri} ===> ${JSON.stringify(res.data)}`);
  return res.data;
}
async function checkUtxosOfAddress(address, o) {
  var url = "https://api.mattercloud.net/api/v3/main/address/" + address + "/utxo"
  return await get(url, o);
}

async function resolvePaymail(paymail, o) {
  var paymailResolveUrl =
    "https://api.bitsent.net/paymail/" +
    encodeURIComponent(decodeURIComponent(paymail));
  var requestString = await get(paymailResolveUrl, o);
  var outputScript = requestString.output;
  return outputScript;
}

function getUriObject(uriString, options) {
  var i1 = uriString.indexOf(":");
  i1 = i1 < 0 ? -1 : i1;

  var i2 = uriString.indexOf("?");
  i2 = i2 < 0 ? uriString.length : i2;

  bitcoinUri = {
    host: uriString.substring(i1 + 1, i2),
    search: uriString.substring(i2),
    protocol: uriString.substring(0, i1 + 1)
  };
  bitcoinUri.searchParams = getJsonFromUrlSearch(bitcoinUri.search);

  function getJsonFromUrlSearch(urlSearchQuery) {
    var result = {};
    urlSearchQuery
      .substr(1)
      .split("&")
      .forEach(function(part) {
        var item = part.split("=");
        if(item[0])
          result[item[0]] = decodeURIComponent(item[1]);
      });
    return result;
  }

  options.debugLog("Parsed URI: \n" + JSON.stringify(bitcoinUri, null, 1));
  return bitcoinUri;
}

defaultOptions = {
  debugLog: () => {
    /** no logging by default */
  },
  checkUtxosOfAddressFunction: checkUtxosOfAddress,
  paymailResolverFunction: resolvePaymail
};

async function parse(bitcoinUriString, options = defaultOptions) {
  for (const key in defaultOptions)
    options[key] =
      options[key] !== undefined ? options[key] : defaultOptions[key];

  bitcoinUri = getUriObject(bitcoinUriString, options);

  var uriType = findUriType(bitcoinUri, options);

  var isBtcProtocol =
    ["address", "bip21", "bip72", "bip272-noSvParam"].some(i=> uriType === i);
  if (isBtcProtocol)
    console.warn("Warning: This might be a BTC request. (type=" + uriType + ")");

  var req = await get(bitcoinUri.searchParams["r"], options);
  if(req.data){
    return req.data;
  }
  var schema = schemes.filter(s => s.name === uriType)[0];
  if (!schema) throw new Error(uriType);

  return {
    type: uriType,
    mainProtocol: schema.mainProtocol,
    outputs: await schema.parseOutputs(bitcoinUri, options),
    inputs: await schema.parseInputs(bitcoinUri, options),
    memo: await schema.parseMemo(bitcoinUri, options),
    isBSV: !isBtcProtocol,
    peer: await schema.parsePeer(bitcoinUri, options),
    peerProtocol: await schema.getPeerProtocol(bitcoinUri, options)
  };
}

module.exports = {
  parse: parse,
  supportedSchemes: schemes.map(s => s.name)
};
