/**
 * Submits the Register form. Hashes the password value before sending
 * to the server.
 */
async function register_user() {
    // Get the form element
    const form = document.getElementById('submit_form');

    // Hash the passwords
    const original_password = form.password.value;
    form.password.value = await hash(original_password);
    form.confirm_password.value = await hash(form.confirm_password.value);

    // Generate the keys
    const rsa_keys = await generateRSAKeyPair();
    const aes_key = await deriveAESKey(original_password, salt);

    // Add public key to form
    const public_key = document.createElement('input');
    public_key.type = "hidden";
    public_key.name = 'public_key';
    public_key.value = rsa_keys.public_key;
    form.append(public_key);

    // Add encrypted private key to form
    const encrypted_private_key = document.createElement('input');
    encrypted_private_key.type = "hidden";
    encrypted_private_key.name = 'encrypted_private_key';
    encrypted_private_key.value = encryptMessageToString(await encryptMessage(aes_key, rsa_keys.private_key));
    form.append(encrypted_private_key);

    // Add aes salt to form
    const aes_salt = document.createElement('input');
    aes_salt.type = "hidden";
    aes_salt.name = 'aes_salt';
    aes_salt.value = salt;
    form.append(aes_salt);

    form.submit();
}