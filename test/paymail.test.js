var paymail = require("../paymail");

jest.setTimeout(30000);

async function runPaymailTest(
  paymailAddress,
  useBowserCompatibleResolver,
  isExpectedToBeP2P
) {
  const methods = useBowserCompatibleResolver
    ? {
        resolve: paymail.browser.resolve,
        findPeer: paymail.browser.findPeerEndpoint,
      }
    : {
        resolve: paymail.node.resolve,
        findPeer: paymail.node.findPeerEndpoint,
      };

  const outputString = await methods.resolve(paymailAddress, 100000);

  if (!/[0-9a-f]+/.test(outputString))
    throw new Error(
      "Output string expected to be a HEX string, but was : " +
        JSON.stringify(outputString)
    );

  const peer = await methods.findPeer(paymailAddress);

  if (isExpectedToBeP2P) {
    if (!peer) throw new Error("Expected to resolve peer, but got : " + peer);
  } else if (peer !== null) {
    throw new Error("Expected peer to be null, but got : " + peer);
  }
}

test("NodeJS Resolve: bitcoinsofia@handcash.io", function (done) {
  runPaymailTest("bitcoinsofia@handcash.io", false, true).catch(done).then(done);
});

test("NodeJS Resolve: bitcoinsofia@moneybutton.com", function (done) {
  runPaymailTest("bitcoinsofia@moneybutton.com", false, true).catch(done).then(done);
});

test("NodeJS Resolve: bitcoinsofia@relayx.io", function (done) {
  runPaymailTest("bitcoinsofia@relayx.io", false).catch(done).then(done);
});

test("NodeJS Resolve: aleks@centbee.com", function (done) {
  runPaymailTest("aleks@centbee.com", false).catch(done).then(done);
});

test("NodeJS Resolve: alekstest@wallet.vaionex.com", function (done) {
  runPaymailTest("alekstest@wallet.vaionex.com", false).catch(done).then(done);
});

test("Browser Resolve: bitcoinsofia@handcash.io", function (done) {
  runPaymailTest("bitcoinsofia@handcash.io", true, true).catch(done).then(done);
});

test("Browser Resolve: bitcoinsofia@moneybutton.com", function (done) {
  runPaymailTest("bitcoinsofia@moneybutton.com", true, true).catch(done).then(done);
});

test("Browser Resolve: bitcoinsofia@relayx.io", function (done) {
  runPaymailTest("bitcoinsofia@relayx.io", true).catch(done).then(done);
});

test("Browser Resolve: aleks@centbee.com", function (done) {
  runPaymailTest("aleks@centbee.com", true).catch(done).then(done);
});

test("Browser Resolve: alekstest@wallet.vaionex.com", function (done) {
  runPaymailTest("alekstest@wallet.vaionex.com", true).catch(done).then(done);
});
