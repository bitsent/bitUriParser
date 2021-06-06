# bitUriParser
A parser for bitcoin URI strings

### Supports formats like PrivateKey, Address, Paymail, Bip21, Bip272, Bip275, Bip282

### Released under "OPEN BSV-SPECIFIC LICENSE"


# Install

#### NodeJS
```
    npm i --save bituriparser
```

#### Browser
```
    // will be available later...
```

# Use


``` js
    var bitUriParser = require("bituriparser");

    var bitUri = "bitcoin:1FMif2XbHJx5L2x6QWYKyWEWPpxJC1ipXw?sv=&amount=0.00123456&label=PayMe";
    var txRequestObject = await bitUriParser.parse(bitUri, {});
```

The second parameter in the parse method is the options object.
If you need to resolve paymails, then you need to provide some options in that object.

If you have an identity in a running paymail server, simply add this:
``` js
    await bitUriParser.parse(bitUri, {
        hdPrivKey: "Private key from which the identity is derived."
        derivationPath: "Derivation path used to derive that identity."
    });
```

Alternatively, you can also provide your own function for resolving paymails:
``` js
    await bitUriParser.parse(bitUri, {
        paymailResolverFunction: async function(paymailAddress, satoshis, optionsObject) {
            return "The output script in HEX format";
        }
    });
```

You can also replace the logic used to discover UTXOs when sweeping Private Keys in the HEX or WIF formats:

```js
await bitUriParser.parse(bitUri, {
  checkUtxosOfAddressFunction: async function (address, optionsObject) {
    return [
      { txid, vout, satoshis, scriptPubKey, scriptPubKey },
      { txid, vout, satoshis, scriptPubKey, scriptPubKey },
    ];
  },
});
```

# Output Format

```js
{
    uri: "the URI that got parsed",
    type: "string - URI type",
    outputs: [{
        script: "Hex Script 1",
        satoshis: 10000
    }, {
        script: "Hex Script 2",
        satoshis: 20000
    }],
    inputs: [{
        txid: "txid of input 1",
        vout: 0,
        satoshis: 25561,
        scriptSig: "signature for this input"
    }, {
        txid: "txid of input 2",
        vout: 5,
        satoshis: 562771,
        scriptSig: "signature for the input"
    }],
    memo: "Human Readable Message",
    isBSV: true, // If false, warn user about BTC protocol
    peer: "empty if not P2P protocol - peer if the payment should be sent to peer",
    peerData: "A value of unspecified type to be included with the P2P payment (like 'merchantData' for BIP270)",
    peerProtocol: "empty if not P2P protocol - otherwise the name of the protocol, like 'bip270'"
}
```

# Note

- The library doesn't support **BIP72 links**. It will treat all BIP72 links as BIP272 links.

# EXAMPLES

## See [examples.md](https://github.com/bitsent/bitUriParser/blob/master/examples.md)
