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
 * Generates a random AES key.
 * @returns {Promise<CryptoKey>}
 */
async function generateAESKey() {
    // Generate a random AES key
    const key = await crypto.subtle.generateKey(
        {
            name: "AES-CBC",
            length: 256,
        },
        true,
        ["encrypt", "decrypt"]
    );

    return key;
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
 * Converts an aes key to a string
 * @param aesKey the aes key
 * @returns {Promise<string>}
 */
async function aesKeyToString(aesKey) {
    // Export the AES key to raw format
    const keyData = await crypto.subtle.exportKey('raw', aesKey);

    // Convert the raw key data to a Base64 string
    const base64Key = btoa(String.fromCharCode(...new Uint8Array(keyData)));

    return base64Key;
}


/**
 * Converts an aes key string back to an aes key
 * @param base64Key the string representation of the aes key
 * @returns {Promise<CryptoKey|null>}
 */
async function stringToAesKey(base64Key) {
    // Decode the Base64 string to a Uint8Array
    const keyData = Uint8Array.from(atob(base64Key), c => c.charCodeAt(0));

    // Import the raw key data to create an AES key
    const aesKey = await crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'AES-CBC' }, // or 'AES-GCM' depending on your use case
        true, // Extractable
        ['encrypt', 'decrypt']
    );

    return aesKey;
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
 * Generates a random RSA public/private key pair
 * @returns {Promise<{privateKey: string, publicKey: string}>}
 */
async function generateRSAKeyPair() {
    // Generate the key pair
    const keyPair = await window.crypto.subtle.generateKey(
        {
            name: "RSA-OAEP",
            modulusLength: 2048,
            publicExponent: new Uint8Array([1, 0, 1]), // 65537
            hash: { name: "SHA-256" },
        },
        true,
        ["encrypt", "decrypt"]
    );

    const publicKey = await window.crypto.subtle.exportKey("spki", keyPair.publicKey);
    const privateKey = await window.crypto.subtle.exportKey("pkcs8", keyPair.privateKey);

    return {
        public_key: arrayBufferToPem(publicKey, "PUBLIC KEY"),
        private_key: arrayBufferToPem(privateKey, "PRIVATE KEY"),
    };
}

/**
 * Converts a key to PEM format.
 * @param buffer
 * @param type
 * @returns {string}
 */
function arrayBufferToPem(buffer, type) {
    const binary = String.fromCharCode.apply(null, new Uint8Array(buffer));
    const base64 = window.btoa(binary);
    const pem = `-----BEGIN ${type}-----\n${formatBase64(base64)}\n-----END ${type}-----`;
    return pem;
}

/**
 * Formats the base64 string to add new lines every 64.
 * @param base64String
 * @returns {string}
 */
function formatBase64(base64String) {
    const lineLength = 64;
    let result = '';
    for (let i = 0; i < base64String.length; i += lineLength) {
        result += base64String.slice(i, i + lineLength) + '\n';
    }
    return result.trim();
}

/**
 * Converts a PEM-formatted key to a CryptoKey
 * @param {string} pem - The PEM-formatted key
 * @param {string} type - The type of the key ('public' or 'private')
 * @returns {Promise<CryptoKey>}
 */
async function pemToCryptoKey(pem, type) {
    // Remove the PEM header and footer
    const pemHeader = `-----BEGIN ${type.toUpperCase()} KEY-----`;
    const pemFooter = `-----END ${type.toUpperCase()} KEY-----`;
    const pemContents = pem
        .replace(pemHeader, '')
        .replace(pemFooter, '')
        .replace(/\s+/g, ''); // Remove all whitespace characters

    // Convert the base64 string to a binary string
    const binaryDerString = window.atob(pemContents);

    // Convert the binary string to an ArrayBuffer
    const binaryDer = new Uint8Array(binaryDerString.length);
    for (let i = 0; i < binaryDerString.length; i++) {
        binaryDer[i] = binaryDerString.charCodeAt(i);
    }

    // Determine the format and key usages based on the type
    let format;
    let keyUsages;
    if (type === 'public') {
        format = 'spki';
        keyUsages = ['encrypt']; // Public key used for encryption in RSA-OAEP
    } else if (type === 'private') {
        format = 'pkcs8';
        keyUsages = ['decrypt']; // Private key used for decryption in RSA-OAEP
    } else {
        throw new Error('Invalid key type');
    }

    // Import the key
    return await window.crypto.subtle.importKey(
        format,
        binaryDer.buffer,
        {
            name: "RSA-OAEP",
            hash: { name: "SHA-256" },
        },
        true,
        keyUsages
    );
}

/**
 * Encrypts a string using an RSA public key and converts the encrypted data to a Base64 string
 * @param {CryptoKey} publicKey - The RSA public key
 * @param {string} data - The string data to encrypt
 * @returns {Promise<string>} - The encrypted data in Base64 format
 */
async function encryptWithRSA(publicKey, data) {
    // Convert the string data to an ArrayBuffer
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);

    // Encrypt the ArrayBuffer
    const encryptedData = await window.crypto.subtle.encrypt(
        {
            name: "RSA-OAEP",
        },
        publicKey,
        dataBuffer
    );

    // Convert the encrypted ArrayBuffer to a Base64 string
    return arrayBufferToBase64(encryptedData);
}

/**
 * Converts an ArrayBuffer to a Base64 string
 * @param {ArrayBuffer} buffer - The ArrayBuffer to convert
 * @returns {string} - The Base64 encoded string
 */
function arrayBufferToBase64(buffer) {
    const binary = String.fromCharCode.apply(null, new Uint8Array(buffer));
    return window.btoa(binary);
}

/**
 * Returns the keys. Decrypts the stored key using the browser key, and decrypts the page key.
 * @param data the data containing the keys
 * @returns {Promise<{page_key: (CryptoKey|null), user_key: (CryptoKey|null), browser_key: (CryptoKey|null)}>}
 */
async function getKeys(data) {
    // Retrieve the browser key
    const browser_key = await stringToAesKey(data['browser_key']);

    // Retrieve the encrypted user key from storage and decrypt it using the browser key
    let user_key = stringToEncryptMessage(sessionStorage.getItem('key'));
    user_key = await decryptMessage(browser_key, user_key.iv, user_key.encrypted);
    user_key = await stringToAesKey(user_key);

    // Retrieve aes page key
    let page_key = data['page_key'];
    page_key = stringToEncryptMessage(page_key);
    page_key = await stringToAesKey(await decryptMessage(user_key, page_key.iv, page_key.encrypted));

    return {"browser_key": browser_key, "user_key": user_key, "page_key": page_key};
}