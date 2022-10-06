var bitUriParser = require("./bitUriParser");
var fs = require("fs");

var axios = require("axios")
axios.defaults.adapter = require('axios/lib/adapters/http');

const SKIP_CHECK = "SKIP_CHECK"

async function testParsing(uri, expectedResult, done) {
  var logsForThisTest = [];
  var paymentRequest = null;
  (async function _doTest() {
    // console.log(uri);
    paymentRequest = await bitUriParser.parse(
      uri,
      options = { debugLog: i => logsForThisTest.push(i.toString()) }
    );

    [ "type", "memo", "isBSV", "peer", "peerProtocol" ].forEach(field => {
      if (expectedResult[field] !== SKIP_CHECK)
        expect(paymentRequest[field]).toBe(expectedResult[field]);
    })

    expect(paymentRequest.inputs.length).toBe(expectedResult.inputs.length);
    for (let i = 0; i < paymentRequest.inputs.length; i++) {
      [ "txid", "vout", "satoshis", "scriptSig"].forEach(field => {
        if (expectedResult.inputs[i][field] !== SKIP_CHECK)
          expect(paymentRequest.inputs[i][field]).toBe(expectedResult.inputs[i][field]);
      })
    }

    expect(paymentRequest.outputs.length).toBe(expectedResult.outputs.length);
    for (let i = 0; i < paymentRequest.outputs.length; i++) {
      [ "script", "satoshis" ].forEach(field => {
        if (expectedResult.outputs[i][field] !== SKIP_CHECK)
          expect(paymentRequest.outputs[i][field]).toBe(expectedResult.outputs[i][field]);
      })
    }
  })()
    .then(done)
    .catch(e => {
      console.log(
        "Test Output: \n---------------\n\n" +
        logsForThisTest
          .map( i => ">>>>>    " + i.split("\n").join("\n>        ") )
          .join("\n") +
        "\n\n---------------\n"
      );

      var message = e + "\n\n URI: " + uri;
      if (paymentRequest)
        message +=
          "\n\n Actual:\n" +
          JSON.stringify(paymentRequest) +
          "\n\n Expected:\n" +
          JSON.stringify(expectedResult);
      message += "\n\n " + e.stack;
      done(message);
    });
}
async function testParsingDPP(uri, expectedResult, done) {
  var logsForThisTest = [];
  var paymentRequest = null;
  (async function _doTest() {
    // console.log(uri);
    paymentRequest = await bitUriParser.parse(
      uri,
      options = { debugLog: i => logsForThisTest.push(i.toString()) }
    );

    [ "type", "memo", "paymentUrl", "network", "mainProtocol" ].forEach(field => {
      if (expectedResult[field] !== SKIP_CHECK)
        expect(paymentRequest[field]).toBe(expectedResult[field]);
    })
  })()
    .then(done)
    .catch(e => {
      console.log(
        "Test Output: \n---------------\n\n" +
        logsForThisTest
          .map( i => ">>>>>    " + i.split("\n").join("\n>        ") )
          .join("\n") +
        "\n\n---------------\n"
      );

      var message = e + "\n\n URI: " + uri;
      if (paymentRequest)
        message +=
          "\n\n Actual:\n" +
          JSON.stringify(paymentRequest) +
          "\n\n Expected:\n" +
          JSON.stringify(expectedResult);
      message += "\n\n " + e.stack;
      done(message);
    });
}

testData = {
  address: {
    uris: [
      "1FMif2XbHJx5L2x6QWYKyWEWPpxJC1ipXw"
    ],
    expected: {
      type: "address",
      mainProtocol: "address",
      outputs: [
        {
          script: "76a9149d7cda4252e8f46b12fee2d14e2d731ac074330688ac",
          satoshis: NaN
        }
      ],
      inputs: [],
      memo: "Payment to Address",
      isBSV: false,
      peer: null,
      peerProtocol: null
    }
  },
  bip21sv: {
    uris: [
      "bitcoin:1FMif2XbHJx5L2x6QWYKyWEWPpxJC1ipXw?sv=&amount=0.00123456&label=PayMe",
      "bitcoin:1FMif2XbHJx5L2x6QWYKyWEWPpxJC1ipXw?sv&amount=0.00123456&label=PayMe",
      "1FMif2XbHJx5L2x6QWYKyWEWPpxJC1ipXw?sv=&amount=0.00123456&label=PayMe"
    ],
    expected: {
      type: "bip21sv",
      mainProtocol: "bip21",
      outputs: [
        {
          script: "76a9149d7cda4252e8f46b12fee2d14e2d731ac074330688ac",
          satoshis: 123456
        }
      ],
      inputs: [],
      memo: "PayMe",
      isBSV: true,
      peer: null,
      peerProtocol: null
    }
  },
  bip21: {
    uris: [
      "bitcoin:1FMif2XbHJx5L2x6QWYKyWEWPpxJC1ipXw?amount=0.00123456",
      "1FMif2XbHJx5L2x6QWYKyWEWPpxJC1ipXw?amount=0.00123456"
    ],
    expected: {
      type: "bip21",
      mainProtocol: "bip21",
      outputs: [
        {
          script: "76a9149d7cda4252e8f46b12fee2d14e2d731ac074330688ac",
          satoshis: 123456
        }
      ],
      inputs: [],
      memo: "Payment to Address",
      isBSV: false,
      peer: null,
      peerProtocol: null
    }
  },
  "bip21-noParams": {
    uris: ["bitcoin:1FMif2XbHJx5L2x6QWYKyWEWPpxJC1ipXw"],
    expected: {
      type: "bip21",
      mainProtocol: "bip21",
      outputs: [
        {
          script: "76a9149d7cda4252e8f46b12fee2d14e2d731ac074330688ac",
          satoshis: NaN
        }
      ],
      inputs: [],
      memo: "Payment to Address",
      isBSV: false,
      peer: null,
      peerProtocol: null
    }
  },
  "bip275-bip282": {
    uris: [
      "bitcoin:?req-bip275&paymentUrl=https%3A%2F%2Fexample.com%2Fpayments&network=bitcoin&outputs=%5B%7B%22amount%22%3A1000000%2C%22script%22%3A%2276a914808a0e92d0d42b650f083dd223d556b410699d6f88ac%22%7D%5D&req-inputs=%5B%7B%22value%22%3A2557931%2C%22txid%22%3A%224d5fcc930d612a23090198a79a9e6f86b5297f480accdbb6f3b2a3a2535dc640%22%2C%22vout%22%3A0%2C%22scriptSig%22%3A%22546865207061796d656e742072656365697665722077696c6c207265706c61636520746869732077697468207468652061637475616c207369676e61747572652e%22%7D%5D",
      "pay:?req-bip275&paymentUrl=https%3A%2F%2Fexample.com%2Fpayments&network=bitcoin&outputs=%5B%7B%22amount%22%3A1000000%2C%22script%22%3A%2276a914808a0e92d0d42b650f083dd223d556b410699d6f88ac%22%7D%5D&req-inputs=%5B%7B%22value%22%3A2557931%2C%22txid%22%3A%224d5fcc930d612a23090198a79a9e6f86b5297f480accdbb6f3b2a3a2535dc640%22%2C%22vout%22%3A0%2C%22scriptSig%22%3A%22546865207061796d656e742072656365697665722077696c6c207265706c61636520746869732077697468207468652061637475616c207369676e61747572652e%22%7D%5D"
    ],
    expected: {
      type: "bip275-bip282",
      mainProtocol: "bip282",
      outputs: [
        {
          script: "76a914808a0e92d0d42b650f083dd223d556b410699d6f88ac",
          satoshis: 1000000
        }
      ],
      inputs: [
        {
          txid:
            "4d5fcc930d612a23090198a79a9e6f86b5297f480accdbb6f3b2a3a2535dc640",
          vout: 0,
          satoshis: 2557931,
          scriptSig:
            "546865207061796d656e742072656365697665722077696c6c207265706c61636520746869732077697468207468652061637475616c207369676e61747572652e"
        }
      ],
      memo: "P2P Transaction",
      isBSV: true,
      peer: "https://example.com/payments",
      peerProtocol: "bip270"
    }
  },
  bip275: {
    uris: [
      "bitcoin:?req-bip275&paymentUrl=https%3A%2F%2Fexample.com%2Fpayments&network=bitcoin&outputs=%5B%7B%22amount%22%3A1000000%2C%22script%22%3A%2276a914808a0e92d0d42b650f083dd223d556b410699d6f88ac%22%7D%2C%7B%22amount%22%3A1000000%2C%22script%22%3A%2276a914eb280a7c70784b5136119cb889e024d22437ed4c88ac%22%7D%5D",
      "pay:?req-bip275&paymentUrl=https%3A%2F%2Fexample.com%2Fpayments&network=bitcoin&outputs=%5B%7B%22amount%22%3A1000000%2C%22script%22%3A%2276a914808a0e92d0d42b650f083dd223d556b410699d6f88ac%22%7D%2C%7B%22amount%22%3A1000000%2C%22script%22%3A%2276a914eb280a7c70784b5136119cb889e024d22437ed4c88ac%22%7D%5D"
    ],
    expected: {
      type: "bip275",
      mainProtocol: "bip275",
      outputs: [
        {
          satoshis: 1000000,
          script: "76a914808a0e92d0d42b650f083dd223d556b410699d6f88ac"
        },
        {
          satoshis: 1000000,
          script: "76a914eb280a7c70784b5136119cb889e024d22437ed4c88ac"
        }
      ],
      inputs: [],
      memo: "P2P Transaction",
      isBSV: true,
      peer: "https://example.com/payments",
      peerProtocol: "bip270"
    }
  },
  bip272strict: {
    uris: [
      "bitcoin:?sv=&req-bip272=&r=" +
      encodeURIComponent(
        "https://api.bitsent.net/payment/address/1Dmq5JKtWu4yZRLWBBKh3V2koeemNTYXAY/500000"
      ),
      "pay:?sv=&req-bip272=&r=" +
      encodeURIComponent(
        "https://api.bitsent.net/payment/address/1Dmq5JKtWu4yZRLWBBKh3V2koeemNTYXAY/500000"
      )
    ],
    expected: {
      type: "bip272strict",
      mainProtocol: "bip272",
      outputs: [
        {
          satoshis: 500000,
          script: "76a9148c1bf1254637c3b521ce47f4b63636d11244a0bd88ac"
        }
      ],
      inputs: [],
      memo: "Pay to 1Dmq5JKtWu4yZRLWBBKh3V2koeemNTYXAY",
      isBSV: true,
      peer: "https://api.bitsent.net/payment/pay",
      peerProtocol: "bip270"
    }
  },
  bip272: {
    uris: [
      "bitcoin:?sv=&r=" +
      encodeURIComponent(
        "https://api.bitsent.net/payment/address/1Dmq5JKtWu4yZRLWBBKh3V2koeemNTYXAY/500000"
      ),
      "pay:?sv=&r=" +
      encodeURIComponent(
        "https://api.bitsent.net/payment/address/1Dmq5JKtWu4yZRLWBBKh3V2koeemNTYXAY/500000"
      )
    ],
    expected: {
      type: "bip272",
      mainProtocol: "bip272",
      outputs: [
        {
          satoshis: 500000,
          script: "76a9148c1bf1254637c3b521ce47f4b63636d11244a0bd88ac"
        }
      ],
      inputs: [],
      memo: "Pay to 1Dmq5JKtWu4yZRLWBBKh3V2koeemNTYXAY",
      isBSV: true,
      peer: "https://api.bitsent.net/payment/pay",
      peerProtocol: "bip270"
    }
  },
  "bip272-noSvParam": {
    uris: [
      "bitcoin:?&r=" +
      encodeURIComponent(
        "https://api.bitsent.net/payment/address/1Dmq5JKtWu4yZRLWBBKh3V2koeemNTYXAY/500000"
      ),
      "pay:?&r=" +
      encodeURIComponent(
        "https://api.bitsent.net/payment/address/1Dmq5JKtWu4yZRLWBBKh3V2koeemNTYXAY/500000"
      )
    ],
    expected: {
      type: "bip272-noSvParam",
      mainProtocol: "bip272",
      outputs: [
        {
          satoshis: 500000,
          script: "76a9148c1bf1254637c3b521ce47f4b63636d11244a0bd88ac"
        }
      ],
      inputs: [],
      memo: "Pay to 1Dmq5JKtWu4yZRLWBBKh3V2koeemNTYXAY",
      isBSV: false,
      peer: "https://api.bitsent.net/payment/pay",
      peerProtocol: "bip270"
    }
  },
  "bip272-noSvParam-dpp": {
    uris: [
      "pay:?&r=" +
      encodeURIComponent(
        "https://dev.relysia.com//v1/payment-request/e2d48069-a76c-45b6-8bb3-29637fb43de0"
      )
    ],
    expected: {
      "status": "success",
      "msg": "Operation completed successfully",
      "paymentUrl": "http://127.0.0.1:3000/v1/payment-request/pay/e2d48069-a76c-45b6-8bb3-29637fb43de0",
      "uri": "pay:?r=http://127.0.0.1:3000/v1/payment-request/pay/e2d48069-a76c-45b6-8bb3-29637fb43de0",
      "memo": "paying for testing",
      "beneficiary": {
          "email": "test@vaionex.com",
          "address": "19702 Newark, Delaware, USA",
          "paymentReference": "e2d48069-a76c-45b6-8bb3-29637fb43de0",
          "name": "vaionex test"
      },
      "network": "mainnet",
      "expirationTimestamp": 1665036997,
      "mainProtocol": "bip272",
      "type": "bip272",
      "creationTimestamp": 1664866117,
      "modes": {
          "ef63d9775da5": {
              "PaymentOption_0": {
                  "transactions": [
                      {
                          "outputs": {
                              "stas": [
                                  {
                                      "tokenRecipient": "1HQKnJ5FfCjcgvr6AAqNPYhY7NKuZXByMF",
                                      "tokenAmount": 1,
                                      "tokenId": "00b91626e0a4b97f624bc1f0d8fa3a3ef35ac664-JAJvfk"
                                  }
                              ]
                          },
                          "policies": {
                              "fees": {
                                  "data": {
                                      "bytes": 1000,
                                      "satoshis": 50
                                  },
                                  "standard": {
                                      "satoshis": 50,
                                      "bytes": 1000
                                  }
                              }
                          }
                      }
                  ]
              }
          }
      }
    }
  },
  paymail: {
    uris: ["payto:aleks@bitsent.net?purpose=PayMe&amount=1234567"],
    expected: {
      type: "paymail",
      mainProtocol: "paymail",
      outputs: [
        {
          satoshis: 1234567,
          script: "76a9148c1bf1254637c3b521ce47f4b63636d11244a0bd88ac"
        }
      ],
      inputs: [],
      memo: "PayMe",
      isBSV: true,
      peer: null,
      peerProtocol: null
    }
  },
  "paymail-P2P-handcash": {
    uris: [
      "payto:bitcoinsofia@handcash.io?purpose=PayMe&amount=1234567",
    ],
    expected: {
      type: "paymail",
      mainProtocol: "paymail",
      outputs: [
        {
          satoshis: 1234567,
          script: SKIP_CHECK
        }
      ],
      inputs: [],
      memo: "PayMe",
      isBSV: true,
      peer: "https://handcash-cloud-production.herokuapp.com/api/bsvalias/p2p-payment-destination/bitcoinsofia@handcash.io",
      peerProtocol: "paymail"
    }
  },
  "paymail-P2P-moneybutton": {
    uris: [
      "payto:bitcoinsofia@moneybutton.com?purpose=PayMe&amount=1234567",
    ],
    expected: {
      type: "paymail",
      mainProtocol: "paymail",
      outputs: [
        {
          satoshis: 1234567,
          script: SKIP_CHECK
        }
      ],
      inputs: [],
      memo: "PayMe",
      isBSV: true,
      peer: "https://www.moneybutton.com/api/v1/bsvalias/p2p-payment-destination/bitcoinsofia@moneybutton.com",
      peerProtocol: "paymail"
    }
  },
  "paymail-simplycash": {
    uris: [
      "payto:aleks@simply.cash?purpose=PayMe&amount=1234567",
    ],
    expected: {
      type: "paymail",
      mainProtocol: "paymail",
      outputs: [
        {
          satoshis: 1234567,
          script: SKIP_CHECK
        }
      ],
      inputs: [],
      memo: "PayMe",
      isBSV: true,
      peer: null,
      peerProtocol: null
    }
  },
  "paymail-noParams": {
    uris: [
      "payto:" + encodeURIComponent("aleks@bitsent.net"),
      "payto:aleks@bitsent.net"
    ],
    expected: {
      type: "paymail",
      mainProtocol: "paymail",
      outputs: [
        {
          satoshis: NaN,
          script: "76a9148c1bf1254637c3b521ce47f4b63636d11244a0bd88ac"
        }
      ],
      inputs: [],
      memo: "Send to aleks@bitsent.net",
      isBSV: true,
      peer: null,
      peerProtocol: null
    }
  },
  "paymail-noScheme": {
    uris: [
      encodeURIComponent("aleks@bitsent.net"),
      "aleks@bitsent.net"
    ],
    expected: {
      type: "paymail",
      mainProtocol: "paymail",
      outputs: [
        {
          satoshis: NaN,
          script: "76a9148c1bf1254637c3b521ce47f4b63636d11244a0bd88ac"
        }
      ],
      inputs: [],
      memo: "Send to aleks@bitsent.net",
      isBSV: true,
      peer: null,
      peerProtocol: null
    }
  }
};

////////////////////////////
/////     GENERATE     /////
////////////////////////////

function generateTestCalls(testData) {
  var lines = []
  lines.push("// AUTOGENERATED TESTS");
  lines.push("//   (do not modify)");
  
  lines.push("\n// RUN with 'jest'\n");

  lines.push("\nconst { testData, testParsing } = require('../testDefinitions')\n");

  Object.keys(testData).forEach((testName) => {
    lines.push(`\n// ${testName}`);
    var uris = testData[testName].uris;
      uris.forEach((uri, i) => {
      lines.push(`test("${testName}_#${i+1}", function (done) {`);
      lines.push(`    var td = testData["${testName}"];`);
      lines.push(`    testParsing(td.uris[${i}], td.expected, done);`);
      lines.push(`});`);
    });
  });

  fs.writeFileSync('test/test.js', lines.join("\n"));
  console.log("Generated test/test.js");
}

function generateMarkdownExamples(testData) {
  var lines = []
  lines.push("# Examples:");
  lines.push("(Autogenerate examples with ```node test.js``` )");
  lines.push("\n");
  Object.keys(testData).forEach((testName) => {
    var uris = testData[testName].uris;

    lines.push("```js");
    lines.push("//// " + testName + " ////\n")

    uris.forEach((uri, i) => {
      lines.push(`var txRequest${i?i:""} = await bitUriParser.parse(`);
      var parts = [];
      for (let i = 0; i < uri.length / 80 + 1; i++)
        parts.push(uri.substr(i * 80, 80));
      lines.push('    "' + parts.filter(i => i).join('"\n    + "') + '"');
      lines.push(');')
    });
    lines.push("```\n");
  });

  fs.writeFileSync('examples.md', lines.join("\n"));
  console.log("Generated examples.md");
}


console.log("Generating tests and examples from 'testDefinitions.js'");
generateTestCalls(testData);
generateMarkdownExamples(testData);


module.exports = {
  testData, testParsing, testParsingDPP
}