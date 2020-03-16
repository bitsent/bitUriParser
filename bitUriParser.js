var url = require("url");
var http = require("http");
var https = require("https");

var scripter = (function() {
  var base58Alphabet =
    "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

  var to_b58 = function(
    B, //Uint8Array raw byte input
    A //Base58 characters (i.e. "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz")
  ) {
    var d = [],
      s = "",
      i,
      j,
      c,
      n;
    for (i in B) {
      (j = 0), (c = B[i]);
      s += c || s.length ^ i ? "" : A[0];
      while (j in d || c) {
        n = d[j];
        n = n ? n * 256 + c : c;
        c = (n / 58) | 0;
        d[j] = n % 58;
        j++;
      }
    }
    while (j--) s += A[d[j]];
    return s;
  };

  var from_b58 = function(
    S, //Base58 string
    A //Base58 characters (i.e. "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz")
  ) {
    var d = [],
      b = [],
      i,
      j,
      c,
      n;
    for (i in S) {
      (j = 0), (c = A.indexOf(S[i]));
      if (c < 0) return undefined;
      c || b.length ^ i ? i : b.push(0);
      while (j in d || c) {
        n = d[j];
        n = n ? n * 58 + c : c;
        c = n >> 8;
        d[j] = n % 256;
        j++;
      }
    }
    while (j--) b.push(d[j]);
    return new Uint8Array(b);
  };

  function toHexString(byteArray) {
    return Array.from(byteArray, function(byte) {
      return ("0" + (byte & 0xff).toString(16)).slice(-2);
    }).join("");
  }

  function hex2littleEndian(hexValue) {
    var hexParts = [];
    for (var i = 0; i < hexValue.length; i += 2)
      hexParts.push(hexValue.substr(i, 2));
    return hexParts.reverse().join("");
  }

  var _2bytesLimit = Math.pow(16, 4);
  var _4bytesLimit = Math.pow(16, 8);

  function hexValueInScript(hexString) {
    if (hexString.length % 2 == 1) hexString = "0" + hexString;

    var len = hexString.length / 2;

    if (hexString === "00")
      // OP_FALSE
      return "00";

    if (len < 76) return ("0" + len.toString(16)).slice(-2) + hexString;
    else if (76 <= len && len < 256)
      return "4c" + ("0" + len.toString(16)).slice(-2) + hexString;
    else if (256 <= len && len < _2bytesLimit)
      return (
        "4d" +
        hex2littleEndian(("000" + len.toString(16)).slice(-4)) +
        hexString
      );
    else if (_2bytesLimit <= len && len < _4bytesLimit)
      return (
        "4e" +
        hex2littleEndian(("0000000" + len.toString(16)).slice(-8)) +
        hexString
      );
  }

  function p2pkh(address) {
    var pub = from_b58(address, base58Alphabet);
    var pubCheckSum = pub.slice(21);
    var pubMain = pub.slice(1, 21);
    var pubHash160 = toHexString(pubMain);

    // TODO: Check the checksum and throw exception if address is invalid

    var resultScript = "76a9" + hexValueInScript(pubHash160) + "88ac";
    return resultScript;
  }

  function str2hex(str) {
    if (Array.isArray(str))
      return str.map(function(part) {
        return str2hex(part);
      });

    var result = "";
    for (var i = 0; i < str.length; i++) {
      var hex = str.charCodeAt(i).toString(16);
      result += ("0" + hex).slice(-2);
    }
    return result;
  }

  function op_return(hexValues, use_op_false) {
    if (use_op_false === undefined) use_op_false = true;

    if (typeof hexValues == "string") hexValues = [hexValues];
    if (!Array.isArray(hexValues))
      throw new Error(
        "op_return method expects an array of hexadecimal strings"
      );
    var resultScript = use_op_false ? "006a" : "6a";
    for (var i = 0; i < hexValues.length; i++) {
      resultScript = resultScript + hexValueInScript(hexValues[i]);
    }
    return resultScript;
  }

  return {
    p2pkh: p2pkh,
    op_return: op_return,
    str2hex: str2hex
  };
})();

// the schemes are ordered - more strict to less strict
var schemes = [
  {
    name: "privkey",
    checkhSchema: s => true,
    checkPath: p => /[0-9A-fa-f]{64}/.test(p),
    checkParams: p => Object.keys(p).length === 0,
    knownRequiredParams: [],

    parseOutputs: (uri, o) => [],
    parseInputs: (uri, o) => create_PrivateKey_Inputs(uri, o),
    parseMemo: (uri, o) => "Sweep Wallet",
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

function create_PrivateKey_Inputs(uri, o) {
  throw new Error("PrivateKey Not Implemented");
  // TODO: Implement this method
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
      scriptSig: i.scriptSig
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
    script: scripter.p2pkh(uri.host),
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
async function checkUtxosOfPrivKey(privkey, o) {
  return [
    {
      txid: "txid 1",
      vout: 1,
      satoshis: 10000
    }
  ];
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
  checkUtxosOfPrivKeyFunction: checkUtxosOfPrivKey,
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
