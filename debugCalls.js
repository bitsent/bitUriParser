
const bitUriParser = require('.');


(async function(){


// address
    console.log("> Starting : address_1");
    var txRequest1 = await bitUriParser.parse(
        "1FMif2XbHJx5L2x6QWYKyWEWPpxJC1ipXw"
    );
    console.log("> DONE : address_1");
    console.log(JSON.stringify(txRequest1));


// bip21sv
    console.log("> Starting : bip21sv_2");
    var txRequest2 = await bitUriParser.parse(
        "bitcoin:1FMif2XbHJx5L2x6QWYKyWEWPpxJC1ipXw?sv=&amount=0.00123456&label=PayMe"
    );
    console.log("> DONE : bip21sv_2");
    console.log(JSON.stringify(txRequest2));

    console.log("> Starting : bip21sv_3");
    var txRequest3 = await bitUriParser.parse(
        "bitcoin:1FMif2XbHJx5L2x6QWYKyWEWPpxJC1ipXw?sv&amount=0.00123456&label=PayMe"
    );
    console.log("> DONE : bip21sv_3");
    console.log(JSON.stringify(txRequest3));

    console.log("> Starting : bip21sv_4");
    var txRequest4 = await bitUriParser.parse(
        "1FMif2XbHJx5L2x6QWYKyWEWPpxJC1ipXw?sv=&amount=0.00123456&label=PayMe"
    );
    console.log("> DONE : bip21sv_4");
    console.log(JSON.stringify(txRequest4));


// bip21
    console.log("> Starting : bip21_5");
    var txRequest5 = await bitUriParser.parse(
        "bitcoin:1FMif2XbHJx5L2x6QWYKyWEWPpxJC1ipXw?amount=0.00123456"
    );
    console.log("> DONE : bip21_5");
    console.log(JSON.stringify(txRequest5));

    console.log("> Starting : bip21_6");
    var txRequest6 = await bitUriParser.parse(
        "1FMif2XbHJx5L2x6QWYKyWEWPpxJC1ipXw?amount=0.00123456"
    );
    console.log("> DONE : bip21_6");
    console.log(JSON.stringify(txRequest6));


// bip21-noParams
    console.log("> Starting : bip21-noParams_7");
    var txRequest7 = await bitUriParser.parse(
        "bitcoin:1FMif2XbHJx5L2x6QWYKyWEWPpxJC1ipXw"
    );
    console.log("> DONE : bip21-noParams_7");
    console.log(JSON.stringify(txRequest7));


// bip275-bip282
    console.log("> Starting : bip275-bip282_8");
    var txRequest8 = await bitUriParser.parse(
        "bitcoin:?req-bip275&paymentUrl=https%3A%2F%2Fexample.com%2Fpayments&network=bitc"
    + "oin&outputs=%5B%7B%22amount%22%3A1000000%2C%22script%22%3A%2276a914808a0e92d0d42"
    + "b650f083dd223d556b410699d6f88ac%22%7D%5D&req-inputs=%5B%7B%22value%22%3A2557931%"
    + "2C%22txid%22%3A%224d5fcc930d612a23090198a79a9e6f86b5297f480accdbb6f3b2a3a2535dc6"
    + "40%22%2C%22vout%22%3A0%2C%22scriptSig%22%3A%22546865207061796d656e74207265636569"
    + "7665722077696c6c207265706c61636520746869732077697468207468652061637475616c207369"
    + "676e61747572652e%22%7D%5D"
    );
    console.log("> DONE : bip275-bip282_8");
    console.log(JSON.stringify(txRequest8));

    console.log("> Starting : bip275-bip282_9");
    var txRequest9 = await bitUriParser.parse(
        "pay:?req-bip275&paymentUrl=https%3A%2F%2Fexample.com%2Fpayments&network=bitcoin&"
    + "outputs=%5B%7B%22amount%22%3A1000000%2C%22script%22%3A%2276a914808a0e92d0d42b650"
    + "f083dd223d556b410699d6f88ac%22%7D%5D&req-inputs=%5B%7B%22value%22%3A2557931%2C%2"
    + "2txid%22%3A%224d5fcc930d612a23090198a79a9e6f86b5297f480accdbb6f3b2a3a2535dc640%2"
    + "2%2C%22vout%22%3A0%2C%22scriptSig%22%3A%22546865207061796d656e742072656365697665"
    + "722077696c6c207265706c61636520746869732077697468207468652061637475616c207369676e"
    + "61747572652e%22%7D%5D"
    );
    console.log("> DONE : bip275-bip282_9");
    console.log(JSON.stringify(txRequest9));


// bip275
    console.log("> Starting : bip275_10");
    var txRequest10 = await bitUriParser.parse(
        "bitcoin:?req-bip275&paymentUrl=https%3A%2F%2Fexample.com%2Fpayments&network=bitc"
    + "oin&outputs=%5B%7B%22amount%22%3A1000000%2C%22script%22%3A%2276a914808a0e92d0d42"
    + "b650f083dd223d556b410699d6f88ac%22%7D%2C%7B%22amount%22%3A1000000%2C%22script%22"
    + "%3A%2276a914eb280a7c70784b5136119cb889e024d22437ed4c88ac%22%7D%5D"
    );
    console.log("> DONE : bip275_10");
    console.log(JSON.stringify(txRequest10));

    console.log("> Starting : bip275_11");
    var txRequest11 = await bitUriParser.parse(
        "pay:?req-bip275&paymentUrl=https%3A%2F%2Fexample.com%2Fpayments&network=bitcoin&"
    + "outputs=%5B%7B%22amount%22%3A1000000%2C%22script%22%3A%2276a914808a0e92d0d42b650"
    + "f083dd223d556b410699d6f88ac%22%7D%2C%7B%22amount%22%3A1000000%2C%22script%22%3A%"
    + "2276a914eb280a7c70784b5136119cb889e024d22437ed4c88ac%22%7D%5D"
    );
    console.log("> DONE : bip275_11");
    console.log(JSON.stringify(txRequest11));


// bip272strict
    console.log("> Starting : bip272strict_12");
    var txRequest12 = await bitUriParser.parse(
        "bitcoin:?sv=&req-bip272=&r=https%3A%2F%2Fapi.bitsent.net%2Fpayment%2Faddress%2F1"
    + "Dmq5JKtWu4yZRLWBBKh3V2koeemNTYXAY%2F500000"
    );
    console.log("> DONE : bip272strict_12");
    console.log(JSON.stringify(txRequest12));

    console.log("> Starting : bip272strict_13");
    var txRequest13 = await bitUriParser.parse(
        "pay:?sv=&req-bip272=&r=https%3A%2F%2Fapi.bitsent.net%2Fpayment%2Faddress%2F1Dmq5"
    + "JKtWu4yZRLWBBKh3V2koeemNTYXAY%2F500000"
    );
    console.log("> DONE : bip272strict_13");
    console.log(JSON.stringify(txRequest13));


// bip272
    console.log("> Starting : bip272_14");
    var txRequest14 = await bitUriParser.parse(
        "bitcoin:?sv=&r=https%3A%2F%2Fapi.bitsent.net%2Fpayment%2Faddress%2F1Dmq5JKtWu4yZ"
    + "RLWBBKh3V2koeemNTYXAY%2F500000"
    );
    console.log("> DONE : bip272_14");
    console.log(JSON.stringify(txRequest14));

    console.log("> Starting : bip272_15");
    var txRequest15 = await bitUriParser.parse(
        "pay:?sv=&r=https%3A%2F%2Fapi.bitsent.net%2Fpayment%2Faddress%2F1Dmq5JKtWu4yZRLWB"
    + "BKh3V2koeemNTYXAY%2F500000"
    );
    console.log("> DONE : bip272_15");
    console.log(JSON.stringify(txRequest15));


// bip272-noSvParam
    console.log("> Starting : bip272-noSvParam_16");
    var txRequest16 = await bitUriParser.parse(
        "bitcoin:?&r=https%3A%2F%2Fapi.bitsent.net%2Fpayment%2Faddress%2F1Dmq5JKtWu4yZRLW"
    + "BBKh3V2koeemNTYXAY%2F500000"
    );
    console.log("> DONE : bip272-noSvParam_16");
    console.log(JSON.stringify(txRequest16));

    console.log("> Starting : bip272-noSvParam_17");
    var txRequest17 = await bitUriParser.parse(
        "pay:?&r=https%3A%2F%2Fapi.bitsent.net%2Fpayment%2Faddress%2F1Dmq5JKtWu4yZRLWBBKh"
    + "3V2koeemNTYXAY%2F500000"
    );
    console.log("> DONE : bip272-noSvParam_17");
    console.log(JSON.stringify(txRequest17));


// paymail
    console.log("> Starting : paymail_18");
    var txRequest18 = await bitUriParser.parse(
        "payto:aleks@api.bitsent.net?purpose=PayMe&amount=1234567"
    );
    console.log("> DONE : paymail_18");
    console.log(JSON.stringify(txRequest18));


// paymail-P2P
    console.log("> Starting : paymail-P2P_19");
    var txRequest19 = await bitUriParser.parse(
        "payto:aleks@moneybutton.com?purpose=PayMe&amount=1234567"
    );
    console.log("> DONE : paymail-P2P_19");
    console.log(JSON.stringify(txRequest19));


// paymail-noParams
    console.log("> Starting : paymail-noParams_20");
    var txRequest20 = await bitUriParser.parse(
        "payto:aleks%40api.bitsent.net"
    );
    console.log("> DONE : paymail-noParams_20");
    console.log(JSON.stringify(txRequest20));

    console.log("> Starting : paymail-noParams_21");
    var txRequest21 = await bitUriParser.parse(
        "payto:aleks@api.bitsent.net"
    );
    console.log("> DONE : paymail-noParams_21");
    console.log(JSON.stringify(txRequest21));

})();