var bitUriParser = require("./bitUriParser");

async function testParsing(uri, expectedResult, done) {
  var logsForThisTest = [];
  var paymentRequest = null;
  (async function _doTest() {
    // console.log(uri);
    paymentRequest = await bitUriParser.parse(
      uri,
      (options = { debugLog: i => logsForThisTest.push(i) })
    );

    expect(paymentRequest.type).toBe(expectedResult.type);
    expect(paymentRequest.memo).toBe(expectedResult.memo);
    expect(paymentRequest.isBSV).toBe(expectedResult.isBSV);

    expect(paymentRequest.peer).toBe(expectedResult.peer);
    expect(paymentRequest.peerProtocol).toBe(expectedResult.peerProtocol);

    expect(paymentRequest.inputs.length).toBe(expectedResult.inputs.length);
    for (let i = 0; i < paymentRequest.inputs.length; i++) {
      expect(paymentRequest.inputs[i].txid).toBe(expectedResult.inputs[i].txid);
      expect(paymentRequest.inputs[i].vout).toBe(expectedResult.inputs[i].vout);
      expect(paymentRequest.inputs[i].satoshis).toBe(
        expectedResult.inputs[i].satoshis
      );
      expect(paymentRequest.inputs[i].scriptSig).toBe(
        expectedResult.inputs[i].scriptSig
      );
    }

    expect(paymentRequest.outputs.length).toBe(expectedResult.outputs.length);
    for (let i = 0; i < paymentRequest.outputs.length; i++) {
      expect(paymentRequest.outputs[i].script).toBe(
        expectedResult.outputs[i].script
      );
      expect(paymentRequest.outputs[i].satoshis).toBe(
        expectedResult.outputs[i].satoshis
      );
    }
  })()
    .then(done)
    .catch(e => {
      console.log(
        "Test Output: \n---------------\n\n" +
          logsForThisTest
            .map(i =>
              i
                .split("\n")
                .map(l => ">\t\t" + l)
                .join("\n")
            )
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
  bip21sv: {
    uris: [
      "bitcoin:1FMif2XbHJx5L2x6QWYKyWEWPpxJC1ipXw?sv=&amount=0.00123456&label=PayMe",
      "bitcoin:1FMif2XbHJx5L2x6QWYKyWEWPpxJC1ipXw?sv&amount=0.00123456&label=PayMe",
      "1FMif2XbHJx5L2x6QWYKyWEWPpxJC1ipXw?sv=&amount=0.00123456&label=PayMe"
    ],
    expected: {
      type: "bip21sv",
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
  "bip275-bip282": {
    uris: [
      "bitcoin:?req-bip275&paymentUrl=https%3A%2F%2Fexample.com%2Fpayments&network=bitcoin&outputs=%5B%7B%22amount%22%3A1000000%2C%22script%22%3A%2276a914808a0e92d0d42b650f083dd223d556b410699d6f88ac%22%7D%5D&req-inputs=%5B%7B%22value%22%3A2557931%2C%22txid%22%3A%224d5fcc930d612a23090198a79a9e6f86b5297f480accdbb6f3b2a3a2535dc640%22%2C%22vout%22%3A0%2C%22scriptSig%22%3A%22546865207061796d656e742072656365697665722077696c6c207265706c61636520746869732077697468207468652061637475616c207369676e61747572652e%22%7D%5D"
    ],
    expected: {
      type: "bip275-bip282",
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
      "bitcoin:?req-bip275&paymentUrl=https%3A%2F%2Fexample.com%2Fpayments&network=bitcoin&outputs=%5B%7B%22amount%22%3A1000000%2C%22script%22%3A%2276a914808a0e92d0d42b650f083dd223d556b410699d6f88ac%22%7D%2C%7B%22amount%22%3A1000000%2C%22script%22%3A%2276a914eb280a7c70784b5136119cb889e024d22437ed4c88ac%22%7D%5D"
    ],
    expected: {
      type: "bip275",
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
      "bitcoin:?sv=&req-bip272=&r=" + encodeURIComponent("https://api.bitsent.net/payment/address/1Dmq5JKtWu4yZRLWBBKh3V2koeemNTYXAY/500000")
    ],
    expected: {
      type: "bip272strict",
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
      "bitcoin:?sv=&r=" + encodeURIComponent("https://api.bitsent.net/payment/address/1Dmq5JKtWu4yZRLWBBKh3V2koeemNTYXAY/500000")
    ],
    expected: {
      type: "bip272",
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
  }
};

Object.keys(testData).forEach(testName => {
  var uris = testData[testName].uris;
  var expected = testData[testName].expected;
  for (let i = 0; i < uris.length; i++)
    test(testName + " #" + i, function(done) {
      testParsing(uris[i], expected, done);
    });
});
