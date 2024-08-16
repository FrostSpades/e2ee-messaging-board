# End-to-End Encrypted Messaging Board Website
A website that serves as a messaging board that utilizes end-to-end encryption. For the explanation of how the end-to-end encryption works, please read [explanation](#explanation).

# Installation and Demonstration Video
[![Video Installation and Demonstration](https://img.youtube.com/vi/yqDLsxhCQhM/maxresdefault.jpg)](https://youtu.be/yqDLsxhCQhM)

Contents
---
- [Requirements](#requirements)
- [Installation](#installation-instructions)
- [Explanation](#explanation)
- [Limitations](#limitations)

## Requirements
- Python3 installed
- Modules specified in `requirements.txt`
- Access to a __MySQL__ database server

## Installation Instructions
To install, first download the zip file `e2ee-messaging-boardV2024.8.12.zip`.
Extract the zip file and navigate to the zip file in the terminal/command prompt:
```
cd /path/to/directory/
```

Install the dependencies with:
```
pip install -r requirements.txt
```
For first time use, run the initialization file. This sets up the database and encrypts/stores credentials:
```
python initialize.py
```
To run the application, utilize a WSGI and run `run:app`. Here are example WSGI's in Windows and Linux:
- __Windows__: using waitress:
```
pip install waitress
waitress-serve --port=80 run:app
```
- __Linux/Mac__: using Gunicorn
```
pip install gunicorn
gunicorn -b 0.0.0.0:80 run:app
```

## Explanation
This website utilizes end-to-end encrypted principles by leveraging asymmetric and symmetric encryption with the server facilitating interactions between clients.

### Registration Explanation
Users begin the registration process by creating a password. The server sends the user random salt of length 16 bytes. The client combines their password with the salt to derive an AES key. The client also creates a random public and private RSA key pair, and encrypts the private key with their AES key. To prevent the server from having access to the user's aes key, the client sends the hashed password, instead of the plaintext password, which was hashed 10,000 times to prevent brute force attacks. In total, the client sends the hashed password, the aes salt, their public key, and their encrypted private key to the server for storage. The server saves each of these and also generates a browser encryption AES key for the user.

### Login Explanation
When a user logs in to the server, the login attempt is first verified by the server. If successful, the server sends the client their aes salt and their browser encryption key. The client then generates their aes key with their password and the salt, and then encrypts it with the browser encryption AES key. The encrypted aes key is placed in the user's browser's session storage. Every time the user accesses a page, a check is done to see if the encrypted aes key is still in the browser's session storage. If it is not, the user is logged out, and forced to log in again as to re-obtain the encrypted aes key.

### Page Creation Explanation
When a user creates a page with invited users, they generate a random AES key for the page and encrypt the title and description using this page key. The server sends the client the public keys of all the invited users. The client then encrypts the page key for each of the invited users using their respective public keys. The client also encrypts a copy of the page key using the user's aes key. Since the user's aes key is needed, the server sends the browser encryption key as part of the request, so that the client can decrypt and use their aes key stored in their browser's session storage. In total, the client sends the server the encrypted title, encrypted description, list of page keys encrypted with the invited users' public keys, and the page key encrypted with the user's aes key.

### Invitation Explanation
When a user accepts an invite to a page, the server sends the client the page key that was encrypted using the user's public key and also the user's encrypted private key. The client then decrypts their private key with their aes key stored in the browser (again, since the aes key needs to be decrypted, the server sends the client the browser encryption key). The client uses this private key to decrypt the page key. The client then re-encrypts the page key using their aes key and sends the server the encrypted page key. (The reason the page key is re-encrypted using the AES key rather than staying encrypted with the user's public key is to minimize the use of asymmetric key algorithms for performance. However, it would be completely viable if the client just sent back the untouched public-key encrypted page key).

### Page Interaction Explanation
When a user wants to view a page, the server sends the client the encrypted data and the encrypted page key. The encrypted page key is decrypted using the aes key stored in the browser (once again, since the aes key needs to be decrypted, the server also sends the browser encryption key). The decrypted page key is then used to decrypt the page data. Similarly, if a user wants to add a post to a page, the post content is encrypted with the decrypted page key and sent to the server. If a user wants to invite another user to an existing page, the server sends the client the public key of the invited user. The client then encrypts the page key with the public key and sends the encrypted page key to the server.

### Summary
The main obstacle surrounding this end-to-end encrypted website was the seeming lack of persistent storage that is available in other end-to-end encrypted applications. Traditionally, the end-to-end encrypted application stores the private keys in the application itself. This is obviously not available for a website. However, by utlizing aes key derivation and encrypted browser session storage, the persistent storage seen in end-to-end encrypted applications can be mimicked.

## Limitations
- Currently only supports MySQL databases
- Utilizes session storage to store sensitive (but encrypted) data. Necessary for end-to-end encrypted functionality without requiring the user to re-enter their password to access each page.
- Weaker than traditional e2ee applications that leverage their ability to permanently store keys inside their application.
- Stores sensitive data in an encrypted file `env.json.enc` for ease of access rather than requiring the user to input sensitive data as environment variables each time the server is restarted.
