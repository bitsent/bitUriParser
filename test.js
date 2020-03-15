
var bitUriParser = require("./bitUriParser")

async function testParsing(uri, expectedResult, done) {
    var paymentRequest = null;
    ((async function _doTest() {
        console.log(uri);
        paymentRequest = await bitUriParser.parse(uri);
        
        expect(paymentRequest.type).toBe(expectedResult.type);
        expect(paymentRequest.memo).toBe(expectedResult.memo);
        expect(paymentRequest.isBSV).toBe(expectedResult.isBSV);

        expect(paymentRequest.inputs.length).toBe(expectedResult.inputs.length);
        for (let i = 0; i < paymentRequest.inputs.length; i++) {
            expect(paymentRequest.inputs[i].txid).toBe(expectedResult.inputs[i].txid);
            expect(paymentRequest.inputs[i].vout).toBe(expectedResult.inputs[i].vout);
            expect(paymentRequest.inputs[i].satoshis).toBe(expectedResult.inputs[i].satoshis);
            expect(paymentRequest.inputs[i].scriptSig).toBe(expectedResult.inputs[i].scriptSig);
        }

        expect(paymentRequest.outputs.length).toBe(expectedResult.outputs.length);
        for (let i = 0; i < paymentRequest.outputs.length; i++) {
            expect(paymentRequest.outputs[i].script).toBe(expectedResult.outputs[i].script);
            expect(paymentRequest.outputs[i].amount).toBe(expectedResult.outputs[i].amount);
        }

    })()).then(done).catch(e => {
        var message = e + "\n\n URI: " + uri; 
        if (paymentRequest)
            message += "\n\n Actual:\n" + JSON.stringify(paymentRequest) + "\n\n Expected:\n" + JSON.stringify(expectedResult);
        done(message);
    });
}

testData = {
    "bip21sv" : {
        uris: [
            "bitcoin:1FMif2XbHJx5L2x6QWYKyWEWPpxJC1ipXw?sv=&amount=0.00123456&label=PayMe",
            "1FMif2XbHJx5L2x6QWYKyWEWPpxJC1ipXw?sv=&amount=0.00123456&label=PayMe",
        ],
        expected: {
            "type":"bip21sv",
            "outputs":[{"script":"76a9149d7cda4252e8f46b12fee2d14e2d731ac074330688ac","satoshis":123456}],
            "inputs":[],
            "memo":"PayMe",
            "isBSV":true
        }
    },
    "bip21" : {
        uris: [
            "bitcoin:1FMif2XbHJx5L2x6QWYKyWEWPpxJC1ipXw?amount=0.00123456",
            "1FMif2XbHJx5L2x6QWYKyWEWPpxJC1ipXw?amount=0.00123456",
        ],
        expected: {
            "type":"bip21",
            "outputs":[{"script":"76a9149d7cda4252e8f46b12fee2d14e2d731ac074330688ac","satoshis":123456}],
            "inputs":[],
            "memo":"Payment to Address",
            "isBSV":false
        }
    }
}

Object.keys(testData).forEach(testName => {
    var uris = testData[testName].uris;
    var expected = testData[testName].expected;
    for (let i = 0; i < uris.length; i++)
        test(testName + " #" + i , function (done) { 
            testParsing(uris[i], expected, done); 
        });
});