// var bsv = require("bsv");
var url = require("url");

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
    checkPath: p => /^([\w\.\-]+)@([\w\-]+)((\.(\w){2,3})+)$/.test(p),
    checkParams: p => true,
    knownRequiredParams: [],

    parseOutputs: (uri, o) => [create_Paymail_Output(uri, o)],
    parseInputs: (uri, o) => [],
    parseMemo: (uri, o) => uri.searchParams["purpose"] || "Send to PayMail",
    parsePeer: (uri, o) => null,
    peerProtocol: null
  },
  {
    name: "bip275-bip282",
    checkhSchema: s => s === "bitcoin:",
    checkPath: p => p === "",
    checkParams: p =>
      ["req-inputs", "req-bip275", "paymentUrl", "network", "outputs"].every(
        i => typeof(p[i]) === "string"
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
      ["req-inputs", "req-bip272", "r"].every(i => typeof(p[i]) === "string"),
    knownRequiredParams: ["req-inputs", "req-bip272"],

    parseOutputs: (uri, o) => create_BIP272_Outputs(uri, o),
    parseInputs: (uri, o) => create_BIP272_BIP282_Inputs(uri, o),
    parseMemo: (uri, o) => o["memo"] || "P2P Transaction",
    parsePeer: (uri, o) => uri.searchParams["r"],
    peerProtocol: "bip270"
  },
  {
    name: "bip275",
    checkhSchema: s => s === "bitcoin:",
    checkPath: p => p === "",
    checkParams: p =>
      ["req-bip275", "paymentUrl", "network", "outputs"].every(
        i => typeof(p[i]) === "string"
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
    checkParams: p => ["req-bip272", "r"].every(i => typeof(p[i]) === "string"),
    knownRequiredParams: ["req-bip272"],

    parseOutputs: (uri, o) => create_BIP272_Outputs(uri, o),
    parseInputs: (uri, o) => [],
    parseMemo: (uri, o) => o["memo"] || "P2P Transaction",
    parsePeer: (uri, o) => uri.searchParams["r"],
    peerProtocol: "bip270"
  },
  {
    name: "bip272",
    checkhSchema: s => s === "bitcoin:",
    checkPath: p => p === "",
    checkParams: p => ["sv", "r"].every(i => typeof(p[i]) === "string"),
    knownRequiredParams: [],

    parseOutputs: (uri, o) => create_BIP272_Outputs(uri, o),
    parseInputs: (uri, o) => [],
    parseMemo: (uri, o) => o["memo"] || "P2P Transaction",
    parsePeer: (uri, o) => uri.searchParams["r"],
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
    checkParams: p => typeof(p['r']) === "string",
    knownRequiredParams: [],

    parseOutputs: (uri, o) => create_BIP72_Outputs(uri, o),
    parseInputs: (uri, o) => [],
    parseMemo: (uri, o) => o["memo"] || "P2P Transaction",
    parsePeer: (uri, o) => uri.searchParams["r"],
    peerProtocol: "bip70"
  }
];

function create_PrivateKey_Inputs(uri, o) {
  return [];
  // TODO: Implement this method
}
function create_Paymail_Output(uri, o) {
  return {};
  // TODO: Implement this method
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
function create_BIP272_Outputs(uri, o) {
  return [];
  // TODO: Implement this method
}
function create_BIP272_BIP282_Inputs(uri, o) {
  return [];
  // TODO: Implement this method
  // TODO: Parse INPUTS written in the property of the 'o' object
}
function create_BIP21_Output(uri, o) {
  return {
    script: scripter.p2pkh(uri.host),
    satoshis: (parseFloat(uri.searchParams["amount"]) * 100000000).toFixed(8)
  };
}
function create_BIP72_Outputs(uri, o) {
  return [];
  // TODO: Implement this method
  // TODO: Add MEMO property to the 'o' object
}

function findUriType(bitcoinUri) {
  var requiredParams = [];
  Object.keys(bitcoinUri.searchParams).forEach(k => {
    if (k.startsWith("req-")) requiredParams.push(k);
  });

  var comparisons = []
  for (var sch in schemes) {
    comparisons.push ({
      name: schemes[sch].name,
      protocolPass: schemes[sch].checkhSchema(bitcoinUri.protocol),
      pathPass: schemes[sch].checkPath(bitcoinUri.host),
      paramsPass: schemes[sch].checkParams(bitcoinUri.searchParams),
      unknownRequiredParams: requiredParams.filter(
        p => schemes[sch].knownRequiredParams.indexOf(p) < 0
      ),
    });
  }

  var matches = comparisons.filter(i=> i.protocolPass && i.pathPass && i.paramsPass && i.unknownRequiredParams.length === 0)

  console.log("comparisons", JSON.stringify(comparisons.map(i=>JSON.stringify(i)), null, 1));
  console.log("matches", JSON.stringify(matches.map(i=>JSON.stringify(i)), null, 1));

  if (matches[0])
    return matches[0].name;
  
  return (
    "Unknown Bitcoin URI" +
    (requiredParams.length > 0
      ? " - with required parameters: [" + requiredParams.join(", ") + "]"
      : "")
  );
}

function checkUtxosOfPrivKey(privkey) {
  return [
    {
      txid: "txid 1",
      vout: 1,
      satoshis: 10000
    }
  ];
}
function resolvePaymail(paymail) {
  return "output script";
}

function getUriObject(uriString) {
  bitcoinUri = {
    host: uriString.substring(
      uriString.indexOf(":")+1,
      uriString.indexOf("?")
    ),
    search: uriString.substring(
      uriString.indexOf("?")
    ),
    protocol: uriString.substring(
      0,
      uriString.indexOf(":") + 1
    ),
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

  // console.log(JSON.stringify(bitcoinUri,null,1));
  return bitcoinUri;
}

defaultOptions = {
  checkUtxosOfPrivKeyFunction: privkey => checkUtxosOfPrivKey(privkey),
  paymailResolverFunction: paymail => resolvePaymail(paymail)
};

async function parse(bitcoinUriString, options = defaultOptions) {
  for (const key in defaultOptions)
    options[key] =
      options[key] !== undefined ? options[key] : defaultOptions[key];

  bitcoinUri = getUriObject(bitcoinUriString, options);

  var uriType = findUriType(bitcoinUri);

  var isBtcProtocol = uriType === "address" || uriType === "bip21" || uriType === "bip72";
  if (isBtcProtocol) console.warn("Warning: This might be a BTC request.");

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
