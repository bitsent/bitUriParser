var url = require("url");
var http = require("http");
var https = require("https");
var bsv = require("bsv");

// the schemes are ordered - more strict to less strict
var schemes = [
  {
    name: "privkey",
    checkhSchema: s => true,
    checkPath: p => /[0-9A-Fa-f]{64}/.test(p),
    checkParams: p => Object.keys(p).length === 0,
    knownRequiredParams: [],

    parseOutputs: (uri, o) => [],
    parseInputs: (uri, o) => create_PrivateKey_Inputs(uri, o, bsv.PrivateKey.fromHex(uri.host)),
    parseMemo: (uri, o) => "Sweep Key",
    parsePeer: (uri, o) => null,
    peerProtocol: null
  },
  {
    name: "privkey-wif",
    checkhSchema: s => true,
    checkPath: p => /[a-km-zA-HJ-NP-Z1-9]{51,52}/.test(p),
    checkParams: p => Object.keys(p).length === 0,
    knownRequiredParams: [],

    parseOutputs: (uri, o) => [],
    parseInputs: (uri, o) => create_PrivateKey_Inputs(uri, o, bsv.PrivateKey.fromWIF(uri.host)),
    parseMemo: (uri, o) => "Sweep Key",
    parsePeer: (uri, o) => null,
    peerProtocol: null
  },
  {
    name: "address",
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
    peerProtocol: null
  },
  {
    name: "paymail",
    checkhSchema: s => s === "payto:",
    checkPath: p => {
      var regex = /^([\w\.\-]+)@([\w\.\-]+)((\.(\w){2,3})+)$/;
      return regex.test(p) || regex.test(decodeURIComponent(p));
    },
    checkParams: p => true,
    knownRequiredParams: [],

    parseOutputs: async (uri, o) => [await create_Paymail_Output(uri, o)],
    parseInputs: (uri, o) => [],
    parseMemo: (uri, o) =>
      uri.searchParams["purpose"] || "Send to " + decodeURIComponent(uri.host),
    parsePeer: (uri, o) => null,
    peerProtocol: null
  },
  {
    name: "bip275-bip282",
    checkhSchema: s => s === "bitcoin:",
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
    peerProtocol: "bip270"
  },
  {
    name: "bip272-bip282",
    checkhSchema: s => s === "bitcoin:",
    checkPath: p => p === "",
    checkParams: p =>
      ["req-inputs", "req-bip272", "r"].every(i => typeof p[i] === "string"),
    knownRequiredParams: ["req-inputs", "req-bip272"],

    parseOutputs: (uri, o) => create_BIP272_Outputs(uri, o),
    parseInputs: (uri, o) => create_BIP272_BIP282_Inputs(uri, o),
    parseMemo: (uri, o) => o["memo"] || "P2P Transaction",
    parsePeer: (uri, o) => o["peer"],
    peerProtocol: "bip270"
  },
  {
    name: "bip275",
    checkhSchema: s => s === "bitcoin:",
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
    peerProtocol: "bip270"
  },
  {
    name: "bip272strict",
    checkhSchema: s => s === "bitcoin:",
    checkPath: p => p === "",
    checkParams: p => ["req-bip272", "r"].every(i => typeof p[i] === "string"),
    knownRequiredParams: ["req-bip272"],

    parseOutputs: (uri, o) => create_BIP272_Outputs(uri, o),
    parseInputs: (uri, o) => [],
    parseMemo: (uri, o) => o["memo"] || "P2P Transaction",
    parsePeer: (uri, o) => o["peer"],
    peerProtocol: "bip270"
  },
  {
    name: "bip272",
    checkhSchema: s => s === "bitcoin:",
    checkPath: p => p === "",
    checkParams: p => ["sv", "r"].every(i => typeof p[i] === "string"),
    knownRequiredParams: [],

    parseOutputs: (uri, o) => create_BIP272_Outputs(uri, o),
    parseInputs: (uri, o) => [],
    parseMemo: (uri, o) => o["memo"] || "P2P Transaction",
    parsePeer: (uri, o) => o["peer"],
    peerProtocol: "bip270"
  },
  {
    name: "bip21sv",
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
    peerProtocol: null
  },
  {
    name: "bip21",
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
    peerProtocol: null
  },
  {
    name: "bip72",
    checkhSchema: s => s === "bitcoin:",
    checkPath: p => p === "",
    checkParams: p => typeof p["r"] === "string",
    knownRequiredParams: [],

    parseOutputs: (uri, o) => create_BIP72_Outputs(uri, o),
    parseInputs: (uri, o) => [],
    parseMemo: (uri, o) => o["memo"] || "P2P Transaction",
    parsePeer: (uri, o) => o["peer"],
    peerProtocol: "bip70"
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
  var requestString = await get(r, o);
  var req = JSON.parse(requestString);

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

function get(uri, o) {
  var get = uri.startsWith("https:") ? https.get : http.get;
  return new Promise(async (resolve, reject) => {
    get(uri, resp => {
      let data = "";
      resp.on("data", chunk => (data += chunk));
      resp.on("end", () => {
        o.debugLog("GET ===> " + data);
        resolve(data);
      });
    }).on("error", err => reject(err));
  });
}
async function checkUtxosOfAddress(address, o) {
  var url = "https://api.mattercloud.net/api/v3/main/address/" + address + "/utxo"
  return JSON.parse(await get(url, o));
}

async function resolvePaymail(paymail, o) {
  var paymailResolveUrl =
    "https://api.bitsent.net/paymail/" +
    encodeURIComponent(decodeURIComponent(paymail));
  var requestString = await get(paymailResolveUrl, o);
  var outputScript = JSON.parse(requestString).output;
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
    uriType === "address" || uriType === "bip21" || uriType === "bip72";
  if (isBtcProtocol)
    console.warn(
      "Warning: This might be a BTC request. (type=" + uriType + ")"
    );

  var schema = schemes.filter(s => s.name === uriType)[0];
  if (!schema) throw new Error(uriType);

  return {
    type: uriType,
    outputs: await schema.parseOutputs(bitcoinUri, options),
    inputs: await schema.parseInputs(bitcoinUri, options),
    memo: await schema.parseMemo(bitcoinUri, options),
    isBSV: !isBtcProtocol,
    peer: await schema.parsePeer(bitcoinUri, options),
    peerProtocol: schema.peerProtocol
  };
}

module.exports = {
  parse: parse,
  supportedSchemes: schemes.map(s => s.name)
};
