# Examples:
(Autogenerate examples with ```node test.js``` )


```js
//// address ////

var txRequest = await bitUriParser.parse(
    "1FMif2XbHJx5L2x6QWYKyWEWPpxJC1ipXw"
);
```

```js
//// bip21sv ////

var txRequest = await bitUriParser.parse(
    "bitcoin:1FMif2XbHJx5L2x6QWYKyWEWPpxJC1ipXw?sv=&amount=0.00123456&label=PayMe"
);
var txRequest1 = await bitUriParser.parse(
    "bitcoin:1FMif2XbHJx5L2x6QWYKyWEWPpxJC1ipXw?sv&amount=0.00123456&label=PayMe"
);
var txRequest2 = await bitUriParser.parse(
    "1FMif2XbHJx5L2x6QWYKyWEWPpxJC1ipXw?sv=&amount=0.00123456&label=PayMe"
);
```

```js
//// bip21 ////

var txRequest = await bitUriParser.parse(
    "bitcoin:1FMif2XbHJx5L2x6QWYKyWEWPpxJC1ipXw?amount=0.00123456"
);
var txRequest1 = await bitUriParser.parse(
    "1FMif2XbHJx5L2x6QWYKyWEWPpxJC1ipXw?amount=0.00123456"
);
```

```js
//// bip21-noParams ////

var txRequest = await bitUriParser.parse(
    "bitcoin:1FMif2XbHJx5L2x6QWYKyWEWPpxJC1ipXw"
);
```

```js
//// bip275-bip282 ////

var txRequest = await bitUriParser.parse(
    "bitcoin:?req-bip275&paymentUrl=https%3A%2F%2Fexample.com%2Fpayments&network=bitc"
    + "oin&outputs=%5B%7B%22amount%22%3A1000000%2C%22script%22%3A%2276a914808a0e92d0d42"
    + "b650f083dd223d556b410699d6f88ac%22%7D%5D&req-inputs=%5B%7B%22value%22%3A2557931%"
    + "2C%22txid%22%3A%224d5fcc930d612a23090198a79a9e6f86b5297f480accdbb6f3b2a3a2535dc6"
    + "40%22%2C%22vout%22%3A0%2C%22scriptSig%22%3A%22546865207061796d656e74207265636569"
    + "7665722077696c6c207265706c61636520746869732077697468207468652061637475616c207369"
    + "676e61747572652e%22%7D%5D"
);
var txRequest1 = await bitUriParser.parse(
    "pay:?req-bip275&paymentUrl=https%3A%2F%2Fexample.com%2Fpayments&network=bitcoin&"
    + "outputs=%5B%7B%22amount%22%3A1000000%2C%22script%22%3A%2276a914808a0e92d0d42b650"
    + "f083dd223d556b410699d6f88ac%22%7D%5D&req-inputs=%5B%7B%22value%22%3A2557931%2C%2"
    + "2txid%22%3A%224d5fcc930d612a23090198a79a9e6f86b5297f480accdbb6f3b2a3a2535dc640%2"
    + "2%2C%22vout%22%3A0%2C%22scriptSig%22%3A%22546865207061796d656e742072656365697665"
    + "722077696c6c207265706c61636520746869732077697468207468652061637475616c207369676e"
    + "61747572652e%22%7D%5D"
);
```

```js
//// bip275 ////

var txRequest = await bitUriParser.parse(
    "bitcoin:?req-bip275&paymentUrl=https%3A%2F%2Fexample.com%2Fpayments&network=bitc"
    + "oin&outputs=%5B%7B%22amount%22%3A1000000%2C%22script%22%3A%2276a914808a0e92d0d42"
    + "b650f083dd223d556b410699d6f88ac%22%7D%2C%7B%22amount%22%3A1000000%2C%22script%22"
    + "%3A%2276a914eb280a7c70784b5136119cb889e024d22437ed4c88ac%22%7D%5D"
);
var txRequest1 = await bitUriParser.parse(
    "pay:?req-bip275&paymentUrl=https%3A%2F%2Fexample.com%2Fpayments&network=bitcoin&"
    + "outputs=%5B%7B%22amount%22%3A1000000%2C%22script%22%3A%2276a914808a0e92d0d42b650"
    + "f083dd223d556b410699d6f88ac%22%7D%2C%7B%22amount%22%3A1000000%2C%22script%22%3A%"
    + "2276a914eb280a7c70784b5136119cb889e024d22437ed4c88ac%22%7D%5D"
);
```

```js
//// bip272strict ////

var txRequest = await bitUriParser.parse(
    "bitcoin:?sv=&req-bip272=&r=https%3A%2F%2Fapi.bitsent.net%2Fpayment%2Faddress%2F1"
    + "Dmq5JKtWu4yZRLWBBKh3V2koeemNTYXAY%2F500000"
);
var txRequest1 = await bitUriParser.parse(
    "pay:?sv=&req-bip272=&r=https%3A%2F%2Fapi.bitsent.net%2Fpayment%2Faddress%2F1Dmq5"
    + "JKtWu4yZRLWBBKh3V2koeemNTYXAY%2F500000"
);
```

```js
//// bip272 ////

var txRequest = await bitUriParser.parse(
    "bitcoin:?sv=&r=https%3A%2F%2Fapi.bitsent.net%2Fpayment%2Faddress%2F1Dmq5JKtWu4yZ"
    + "RLWBBKh3V2koeemNTYXAY%2F500000"
);
var txRequest1 = await bitUriParser.parse(
    "pay:?sv=&r=https%3A%2F%2Fapi.bitsent.net%2Fpayment%2Faddress%2F1Dmq5JKtWu4yZRLWB"
    + "BKh3V2koeemNTYXAY%2F500000"
);
```

```js
//// bip272-noSvParam ////

var txRequest = await bitUriParser.parse(
    "bitcoin:?&r=https%3A%2F%2Fapi.bitsent.net%2Fpayment%2Faddress%2F1Dmq5JKtWu4yZRLW"
    + "BBKh3V2koeemNTYXAY%2F500000"
);
var txRequest1 = await bitUriParser.parse(
    "pay:?&r=https%3A%2F%2Fapi.bitsent.net%2Fpayment%2Faddress%2F1Dmq5JKtWu4yZRLWBBKh"
    + "3V2koeemNTYXAY%2F500000"
);
```

```js
//// bip272-noSvParam-dpp ////

var txRequest = await bitUriParser.parse(
    "pay:?&r=https%3A%2F%2Fdev.relysia.com%2F%2Fv1%2Fpayment-request%2Fe2d48069-a76c-"
    + "45b6-8bb3-29637fb43de0"
);
```

```js
//// paymail ////

var txRequest = await bitUriParser.parse(
    "payto:aleks@bitsent.net?purpose=PayMe&amount=1234567"
);
```

```js
//// paymail-P2P-handcash ////

var txRequest = await bitUriParser.parse(
    "payto:bitcoinsofia@handcash.io?purpose=PayMe&amount=1234567"
);
```

```js
//// paymail-P2P-moneybutton ////

var txRequest = await bitUriParser.parse(
    "payto:bitcoinsofia@moneybutton.com?purpose=PayMe&amount=1234567"
);
```

```js
//// paymail-simplycash ////

var txRequest = await bitUriParser.parse(
    "payto:aleks@simply.cash?purpose=PayMe&amount=1234567"
);
```

```js
//// paymail-noParams ////

var txRequest = await bitUriParser.parse(
    "payto:aleks%40bitsent.net"
);
var txRequest1 = await bitUriParser.parse(
    "payto:aleks@bitsent.net"
);
```

```js
//// paymail-noScheme ////

var txRequest = await bitUriParser.parse(
    "aleks%40bitsent.net"
);
var txRequest1 = await bitUriParser.parse(
    "aleks@bitsent.net"
);
```
