// var bsv = require("bsv");
var url = require("url");

// the schemes are ordered - more strict to less strict
var schemes = [
  {
    name: "privkey",
    checkhSchema: s => true,
    checkPath: p => /[0-9A-fa-f]{64}/.test(p),
    checkParams: p => p.length == 0,
    knownRequiredParams: [],

    parseOutputs: (uri, o) => [],
    parseInputs: (uri, o) => create_PrivateKey_Inputs(uri, o),
    parseMemo: (uri, o) => "Sweep Wallet",
  },
  {
    name: "paymail",
    checkhSchema: s => s === "payto:",
    checkPath: p => /^([\w\.\-]+)@([\w\-]+)((\.(\w){2,3})+)$/.test(p),
    checkParams: p => true,
    knownRequiredParams: [],
    
    parseOutputs: (uri, o) => [create_Paymail_Output(uri, o)],
    parseInputs: (uri, o) => [],
    parseMemo: (uri, o) => uri.searchParams.get("purpose") || "Send to PayMail",
  },
  {
    name: "bip275-bip2852",
    checkhSchema: s => s === "bitcoin:",
    checkPath: p => p.length == 0,
    checkParams: p =>
      ["req-inputs", "req-bip275", "paymentUrl", "network", "outputs"].every(i => p.get(i) !== null),
    knownRequiredParams: ["req-inputs", "req-bip275"],
    
    parseOutputs: (uri, o) => create_BIP275_Outputs(uri, o),
    parseInputs: (uri, o) => create_BIP275_BIP282_Inputs(uri, o),
    parseMemo: (uri, o) => uri.searchParams.get("memo") || "P2P Transaction",
  },
  {
    name: "bip272-bip2852",
    checkhSchema: s => s === "bitcoin:",
    checkPath: p => p.length == 0,
    checkParams: p => ["req-inputs", "req-bip272", "r"].every(i => p.get(i) !== null),
    knownRequiredParams: ["req-inputs", "req-bip272"],
    
    parseOutputs: (uri, o) => create_BIP272_Outputs(uri, o),
    parseInputs: (uri, o) => create_BIP272_BIP282_Inputs(uri, o),
    parseMemo: (uri, o) => o["memo"] || "P2P Transaction",
  },
  {
    name: "bip275",
    checkhSchema: s => s === "bitcoin:",
    checkPath: p => p.length == 0,
    checkParams: p =>
      ["req-bip275", "paymentUrl", "network", "outputs"].every(i => p.get(i) !== null),
    knownRequiredParams: ["req-bip275"],
    
    parseOutputs: (uri, o) => create_BIP275_Outputs(uri, o),
    parseInputs: (uri, o) => [],
    parseMemo: (uri, o) => uri.searchParams.get("memo") || "P2P Transaction",
  },
  {
    name: "bip272",
    checkhSchema: s => s === "bitcoin:",
    checkPath: p => p.length == 0,
    checkParams: p => ["req-bip272", "r"].every(i => p.get(i) !== null),
    knownRequiredParams: ["req-bip272"],
    
    parseOutputs: (uri, o) => create_BIP272_Outputs(uri, o),
    parseInputs: (uri, o) => [],
    parseMemo: (uri, o) => o["memo"] || "P2P Transaction",
  },
  {
    name: "bip21sv",
    checkhSchema: s => s === "bitcoin:",
    checkPath: p => /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(p),
    checkParams: p => p.get("sv") !== null,
    knownRequiredParams: [],
    
    parseOutputs: (uri, o) => [create_BIP21_Output(uri, o)],
    parseInputs: (uri, o) => [],
    parseMemo: (uri, o) => uri.searchParams.get("label") || uri.searchParams.get("message") || "Payment to Address",
  },
  {
    name: "bip21",
    checkhSchema: s => s === "bitcoin:",
    checkPath: p => /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(p),
    checkParams: p => true,
    knownRequiredParams: [],
    
    parseOutputs: (uri, o) => [create_BIP21_Output(uri, o)],
    parseInputs: (uri, o) => [],
    parseMemo: (uri, o) => uri.searchParams.get("label") || uri.searchParams.get("message") || "Payment to Address",
  },
  {
    name: "bip72",
    checkhSchema: s => s === "bitcoin:",
    checkPath: p => p.length == 0,
    checkParams: p => p.get("r") !== null,
    knownRequiredParams: [],
    
    parseOutputs: (uri, o) => create_BIP72_Outputs(uri, o),
    parseInputs: (uri, o) => [],
    parseMemo: (uri, o) => o["memo"] || "P2P Transaction",
  }
];

function create_PrivateKey_Inputs(uri, o) {
  throw new Error("Not Implemented");
  // TODO: Implement this method
}
function create_Paymail_Output(uri, o) {
  throw new Error("Not Implemented");
  // TODO: Implement this method
}
function create_BIP275_Outputs(uri, o) {
  throw new Error("Not Implemented");
  // TODO: Implement this method
}
function create_BIP275_BIP282_Inputs(uri, o) {
  throw new Error("Not Implemented");
  // TODO: Implement this method
}
function create_BIP272_Outputs(uri, o) {
  throw new Error("Not Implemented");
  // TODO: Implement this method
  // TODO: Add MEMO property to the 'o' object
  // TODO: Add INPUTS property to the 'o' object
}
function create_BIP272_BIP282_Inputs(uri, o) {
  throw new Error("Not Implemented");
  // TODO: Implement this method
  // TODO: Parse INPUTS written in the property of the 'o' object
}
function create_BIP21_Output(uri, o) {
  throw new Error("TODO: Fill the script field");
  return {
    script: "",
    amount: parseFloat(uri.searchParams.get("amount"))
  }
}
function create_BIP72_Outputs(uri, o) {
  throw new Error("Not Implemented");
  // TODO: Implement this method
  // TODO: Add MEMO property to the 'o' object
}


function findUriType(bitcoinUri) {
  var requiredParams = [];
  bitcoinUri.searchParams.forEach((v, k) => {
    if (k.startsWith("req-")) requiredParams.push(k);
  });

  for (var sch in schemes) {
    var pathPass = schemes[sch].checkhSchema(bitcoinUri.protocol);
    var pathPass = schemes[sch].checkPath(bitcoinUri.host);
    var paramsPass = schemes[sch].checkParams(bitcoinUri.searchParams);
    var unknownRequiredParams = requiredParams.filter(
      p => schemes[sch].knownRequiredParams.indexOf(p) < 0
    );

    if (pathPass && paramsPass) {
      if (unknownRequiredParams.length > 0) continue;
      return schemes[sch].name;
    }
  }
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
  return "output script"
}

function getUriObject(uriString, options) {
  bUri = url.parse(uriString + "");
  if (!bUri.host && !options.strictAboutScheme)
    bUri = url.parse("bitcoin:" + uriString);
  // The URL library is NOT case sensitive.
  // All fields need to be taken from the original string.
  bitcoinUri = {
    host: uriString.substr(uriString.toLowerCase().indexOf(bUri.host), bUri.host.length),
    search: uriString.substr(uriString.toLowerCase().indexOf(bUri.search), bUri.search.length),
    protocol: bUri.protocol,
  }
  bitcoinUri.searchParams = new URLSearchParams(bitcoinUri.search);
  return bitcoinUri;
}

defaultOptions = {
  strictAboutScheme: false,
  checkUtxosOfPrivKeyFunction: (privkey) => checkUtxosOfPrivKey(privkey),
  paymailResolverFunction: (paymail) => resolvePaymail(paymail),
};

function parse(bitcoinUriString, options = defaultOptions) {
  for (const key in defaultOptions)
    options[key] = options[key] !== undefined ? options[key] : defaultOptions[key];

  bitcoinUri = getUriObject(bitcoinUriString, options);

  var uriType = findUriType(bitcoinUri);

  var isBtcProtocol = (uriType === "bip21" || uriType === "bip72")
  if(isBtcProtocol)
    console.warn("Warning: This might be a BTC request.");

  var schema = schemes.filter(s=>s.name === uriType)[0];
  if(!schema)
    throw new Error(uriType);
    
  return {
    type: uriType,
    outputs: schema.parseOutputs(bitcoinUri, options),
    inputs: schema.parseInputs(bitcoinUri, options),
    memo: schema.parseMemo(bitcoinUri, options),
    isBSVProtocol: !isBtcProtocol,
  }
}

module.exports = {
  parse
};

function log (obj) { console.log(JSON.stringify(obj, null, 2)); }

log(parse(        "1FMif2XbHJx5L2x6QWYKyWEWPpxJC1ipXw?sv=&amount=1234"));
log(parse("bitcoin:1FMif2XbHJx5L2x6QWYKyWEWPpxJC1ipXw?sv=&amount=1234"));
