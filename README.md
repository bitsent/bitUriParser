# bitUriParser
A parser for bitcoin URI strings

### NO LICENSE YET
Contact aleks@bitcoinsofia.com for licensing.

# EXAMPLES

```js
//// address #0 ////
var txRequest = await bitUriParser.parse("1FMif2XbHJx5L2x6QWYKyWEWPpxJC1ipXw")
```
```js
//// bip21sv #0 ////
var txRequest = await bitUriParser.parse("bitcoin:1FMif2XbHJx5L2x6QWYKyWEWPpxJC1ipXw?sv=&amount=0.00123456&label=PayMe")
```
```js
//// bip21sv #1 ////
var txRequest = await bitUriParser.parse("bitcoin:1FMif2XbHJx5L2x6QWYKyWEWPpxJC1ipXw?sv&amount=0.00123456&label=PayMe")
```
```js
//// bip21sv #2 ////
var txRequest = await bitUriParser.parse("1FMif2XbHJx5L2x6QWYKyWEWPpxJC1ipXw?sv=&amount=0.00123456&label=PayMe")
```
```js
//// bip21 #0 ////
var txRequest = await bitUriParser.parse("bitcoin:1FMif2XbHJx5L2x6QWYKyWEWPpxJC1ipXw?amount=0.00123456")
```
```js
//// bip21 #1 ////
var txRequest = await bitUriParser.parse("1FMif2XbHJx5L2x6QWYKyWEWPpxJC1ipXw?amount=0.00123456")
```
```js
//// bip21-noParams #0 ////
var txRequest = await bitUriParser.parse("bitcoin:1FMif2XbHJx5L2x6QWYKyWEWPpxJC1ipXw")
```
```js
//// bip275-bip282 #0 ////
var txRequest = await bitUriParser.parse("bitcoin:?req-bip275&paymentUrl=https%3A%2F%2Fexample.com%2Fpayments&network=bitcoin&outputs=%5B%7B%22amount%22%3A1000000%2C%22script%22%3A%2276a914808a0e92d0d42b650f083dd223d556b410699d6f88ac%22%7D%5D&req-inputs=%5B%7B%22value%22%3A2557931%2C%22txid%22%3A%224d5fcc930d612a23090198a79a9e6f86b5297f480accdbb6f3b2a3a2535dc640%22%2C%22vout%22%3A0%2C%22scriptSig%22%3A%22546865207061796d656e742072656365697665722077696c6c207265706c61636520746869732077697468207468652061637475616c207369676e61747572652e%22%7D%5D")
```
```js
//// bip275 #0 ////
var txRequest = await bitUriParser.parse("bitcoin:?req-bip275&paymentUrl=https%3A%2F%2Fexample.com%2Fpayments&network=bitcoin&outputs=%5B%7B%22amount%22%3A1000000%2C%22script%22%3A%2276a914808a0e92d0d42b650f083dd223d556b410699d6f88ac%22%7D%2C%7B%22amount%22%3A1000000%2C%22script%22%3A%2276a914eb280a7c70784b5136119cb889e024d22437ed4c88ac%22%7D%5D")
```
```js
//// bip272strict #0 ////
var txRequest = await bitUriParser.parse("bitcoin:?sv=&req-bip272=&r=https%3A%2F%2Fapi.bitsent.net%2Fpayment%2Faddress%2F1Dmq5JKtWu4yZRLWBBKh3V2koeemNTYXAY%2F500000")
```
```js
//// bip272 #0 ////
var txRequest = await bitUriParser.parse("bitcoin:?sv=&r=https%3A%2F%2Fapi.bitsent.net%2Fpayment%2Faddress%2F1Dmq5JKtWu4yZRLWBBKh3V2koeemNTYXAY%2F500000")
```
```js
//// paymail #0 ////
var txRequest = await bitUriParser.parse("payto:aleks@api.bitsent.net?purpose=PayMe&amount=1234567")
```
```js
//// paymail-noParams #0 ////
var txRequest = await bitUriParser.parse("payto:aleks%40api.bitsent.net")
```
```js
//// paymail-noParams #1 ////
var txRequest = await bitUriParser.parse("payto:aleks@api.bitsent.net")
```