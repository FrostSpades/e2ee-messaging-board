/**
 * Submits the login form. Hashes the password value before sending
 * to the server.
 */
async function login_user() {
    // Get the form element
    const form = document.getElementById('submit_form');

    const password = form.password.value;

    // Hash the password
    const hashed_password = document.createElement('input');
    hashed_password.type = "hidden";
    hashed_password.name = 'hashed_password';
    hashed_password.value = await hash(form.password.value);
    form.append(hashed_password);

    // Clear the password value as to not send it to the server
    form.password.value = "";

    // Submit the form
    const form_data = new FormData(form);

    fetch(`/login/submit`, {
        method: 'POST',
        body: form_data
    })
    .then(response => response.json())
    .then(data => login_complete(data, password))
    .catch(error => console.error('Error:', error));
}

async function login_complete(data, password) {
    if (!data['success']) {
        return;
    }

    let aes_key = await aesKeyToString(await deriveAESKey(password, data['aes_salt']));
    let browser_key = await stringToAesKey(data['aes_key']);

    // Encrypt the user's aes key with the browser key and convert it to string format
    let encrypted_aes_key_string = encryptMessageToString(await encryptMessage(browser_key, aes_key));
    // Store the encrypted aes key in session storage
    sessionStorage.setItem('key', encrypted_aes_key_string);

    // Clear sensitive data from memory
    aes_key = "";
    browser_key = "";
    password = "";
    encrypted_aes_key_string = "";
    data = "";

    // Redirect to pages
    window.location.href = '/pages';
}