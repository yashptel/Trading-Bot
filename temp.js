const crypto = require("crypto");
const fs = require("fs");

// Generate RSA key pair
function generateRSAKeyPair() {
  const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: "spki",
      format: "pem",
    },
    privateKeyEncoding: {
      type: "pkcs8",
      format: "pem",
    },
  });

  return { publicKey, privateKey };
}

// Usage example
const keyPair = generateRSAKeyPair();
console.log("Public Key:", keyPair.publicKey);
console.log("Private Key:", keyPair.privateKey);

fs.writeFileSync("public.pem", keyPair.publicKey);
fs.writeFileSync("private.pem", keyPair.privateKey);
