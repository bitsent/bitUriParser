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
    var txRequestObject = await bitUriParser.parse(bitUri);
```

# Output Format

```json
{
    type: "string - URI type",
    outputs: [{
        script: "Hex Script 1",
        satoshis: 10000
    }, {
        script: "Hex Script 2",
        satoshis: 20000
    }],
    inputs: [{
        txid: "thxid of input 1",
        vout: 0,
        satoshis: 25561,
        scriptSig: "signature for this input"
    }, {
        txid: "thxid of input 2",
        vout: 5,
        satoshis: 562771,
        scriptSig: "signature for the input"
    }],
    memo: "Human Readable Message",
    isBSV: true, // If false, warn user about BTC protocol
    peer: "empty if not P2P protocol - peer if the payment should be sent to peer",
    peerProtocol: "empty if not P2P protocol - otherwise the name of the protocol, like 'bip270'"
}
```

# Note

- The library doesn't support **BIP72 links**. It will treat all BIP72 links as BIP272 links.

# EXAMPLES

## See [examples.md](https://github.com/bitsent/bitUriParser/blob/master/examples.md)