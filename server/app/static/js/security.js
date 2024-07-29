/**
 * Hash function using SHA-256. Hashed 10,000 times for security purposes.
 * @param message message to be hashed
 * @param iterations number of iterations to be hashed (default 10,000)
 * @returns {Promise<string>}
 */
async function hash(message, iterations = 10000) {
  // Convert the message string to an ArrayBuffer
  let msgBuffer = new TextEncoder().encode(message);

  for (let i = 0; i < iterations; i++) {
    // Hash the message using SHA-256
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);

    // Convert the ArrayBuffer to a Uint8Array for the next iteration
    msgBuffer = new Uint8Array(hashBuffer);
  }

  // Convert the final ArrayBuffer to a hexadecimal string
  const hashArray = Array.from(msgBuffer);
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}


/**
 * Generates an AES key from a password and salt.
 * @param password the password
 * @param salt the salt
 * @returns {Promise<CryptoKey>}
 */
async function deriveAESKey(password, salt) {
    // Encode the password and salt as Uint8Array
    const enc = new TextEncoder();
    const passwordBytes = enc.encode(password);
    const saltBytes = enc.encode(salt);

    // Import the password as key material
    const keyMaterial = await window.crypto.subtle.importKey(
        'raw',
        passwordBytes,
        { name: 'PBKDF2' },
        false,
        ['deriveKey']
    );

    // Derive a key using PBKDF2 with SHA-256
    const key = await window.crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: saltBytes,
            iterations: 100000,
            hash: 'SHA-256'
        },
        keyMaterial,
        { name: 'AES-CBC', length: 256 },
        true,
        ['encrypt', 'decrypt']
    );

    return key;
}


/**
 * Encrypts a message using an AES key
 * @param key the AES key
 * @param message the message to be encrypted
 * @returns {Promise<{encrypted: string, iv: string}>}
 */
async function encryptMessage(key, message) {
    // Generate a random initialization vector
    const iv = window.crypto.getRandomValues(new Uint8Array(16));

    // Encode the message as Uint8Array
    const enc = new TextEncoder();
    const messageBytes = enc.encode(message);

    // Encrypt the message
    const encrypted = await window.crypto.subtle.encrypt(
        {
            name: 'AES-CBC',
            iv: iv
        },
        key,
        messageBytes
    );

    // Convert the encrypted ArrayBuffer to a hexadecimal string
    const encryptedArray = Array.from(new Uint8Array(encrypted));
    const encryptedHex = encryptedArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // Convert the IV to a hexadecimal string
    const ivHex = Array.from(iv).map(b => b.toString(16).padStart(2, '0')).join('');

    return { iv: ivHex, encrypted: encryptedHex };
}


/**
 * Converts the encrypted message dictionary to a string.
 * @param encryptionResult dictionary resulting from AES encryption
 * @returns {string} string representing the encryption
 */
function encryptMessageToString(encryptionResult) {
    // Concatenate the IV and encrypted message using a separator (e.g., a colon)
    return `${encryptionResult.iv}:${encryptionResult.encrypted}`;
}


/**
 * Converts the string representation of the encrypted message back to a dictionary.
 * @param encryptedString string representing the encryption
 * @returns {{encrypted: *, iv: *}} dictionary resulting from AES encryption
 */
function stringToEncryptMessage(encryptedString) {
    // Split the string by the separator to retrieve IV and encrypted message
    const [iv, encrypted] = encryptedString.split(':');
    return { iv, encrypted };
}


/**
 * Decrypts the message from the encrypted text, the initial value, and the AES key.
 * @param key the AES key
 * @param ivHex the initial value
 * @param encryptedHex the encrypted text
 * @returns {Promise<string>}
 */
async function decryptMessage(key, ivHex, encryptedHex) {
    // Convert the IV and encrypted message from hex to Uint8Array
    const iv = new Uint8Array(ivHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
    const encryptedBytes = new Uint8Array(encryptedHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));

    // Decrypt the message
    const decrypted = await window.crypto.subtle.decrypt(
        {
            name: 'AES-CBC',
            iv: iv
        },
        key,
        encryptedBytes
    );

    // Decode the decrypted ArrayBuffer to a string
    const dec = new TextDecoder();
    return dec.decode(decrypted);
}


/**
 * Generates a randomm RSA public/private key pair
 * @returns {Promise<{privateKey: string, publicKey: string}>}
 */
async function generateRSAKeyPair() {
    // Generate the key pair
    const keyPair = await window.crypto.subtle.generateKey(
        {
            name: "RSASSA-PKCS1-v1_5",
            modulusLength: 2048,
            publicExponent: new Uint8Array([1, 0, 1]), // 65537
            hash: { name: "SHA-256" },
        },
        true,
        ["sign", "verify"]
    );

    const publicKey = await window.crypto.subtle.exportKey("spki", keyPair.publicKey);
    const privateKey = await window.crypto.subtle.exportKey("pkcs8", keyPair.privateKey);

    return {
        public_key: arrayBufferToPem(publicKey, "PUBLIC KEY"),
        private_key: arrayBufferToPem(privateKey, "PRIVATE KEY"),
    };
}

function arrayBufferToPem(buffer, type) {
    const binary = String.fromCharCode.apply(null, new Uint8Array(buffer));
    const base64 = window.btoa(binary);
    const pem = `-----BEGIN ${type}-----\n${formatBase64(base64)}\n-----END ${type}-----`;
    return pem;
}

function formatBase64(base64String) {
    const lineLength = 64;
    let result = '';
    for (let i = 0; i < base64String.length; i += lineLength) {
        result += base64String.slice(i, i + lineLength) + '\n';
    }
    return result.trim();
}