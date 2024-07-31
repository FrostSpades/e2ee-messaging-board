// List of invited users including their username and public key
let invited_user_list = [];

document.addEventListener('DOMContentLoaded', function() {
    fetch('/create-page/init-get')
        .then(response => response.json())
        .then(updateScreen)
        .catch(error => console.error('Error:', error));
});

/**
 * Method for handling inviting users to page.
 */
function addUser() {
    const form = document.getElementById('add-user-form');
    const form_data = new FormData(form);

    fetch('/create-page/add-user', {
        method: 'POST',
        body: form_data
    })
    .then(response => response.json())
    .then(updateScreen)
    .catch(error => console.error('Error:', error));
}

/**
 * Method for handling removing users to the page.
 */
function removeUser() {
    const form = document.getElementById('remove-user-form');
    const form_data = new FormData(form);

    fetch('/create-page/remove-user', {
        method: 'POST',
        body: form_data
    })
    .then(response => response.json())
    .then(updateScreen)
    .catch(error => console.error('Error:', error));
}

/**
 * Method for updating the create_page screen.
 * @param data - The json object returned from the AJAX request
 */
function updateScreen(data) {
    // Check if sessionStorage contains the encrypted user key
    if (sessionStorage.getItem('key') == null) {
        // Log out user if not
        window.location.href = '/logout';
    }

    // Update the user list
    if ('users' in data) {
        invited_user_list = data['users'];

        // Reset the user list
        let list = document.getElementById('add_user_list');
        list.innerHTML = "";

        // Add the given users to the user list
        for (let index in invited_user_list) {
            const newItem = document.createElement('li');
            newItem.textContent = invited_user_list[index]['username'];
            list.append(newItem);
        }
    }
}

/**
 * Start process of page creation.
 */
async function createPage() {
    // Begin by retrieving the essential keys
    fetch('/create-page/get-keys', {
        method: 'GET'
    })
    .then(response => response.json())
    .then(createPageSubmit)
    .catch(error => {
        console.error('Error:', error); // Handle any errors
    });
}

/**
 * Handles the submission of the create page form data.
 * @param data data returned by the ajax request
 * @returns {Promise<void>}
 */
async function createPageSubmit(data) {
    const form = document.getElementById('create-page-form');
    const page_key = await generateAESKey();
    const page_key_string = await aesKeyToString(page_key);
    const browser_key = await stringToAesKey(data['browser_key']);

    // Retrieve the encrypted user key from storage and decrypt it using the browser key
    let user_key = stringToEncryptMessage(sessionStorage.getItem('key'));
    user_key = await decryptMessage(browser_key, user_key.iv, user_key.encrypted);
    user_key = await stringToAesKey(user_key);

    // Encrypt the title and description
    form.encrypted_title.value = encryptMessageToString(await encryptMessage(page_key, form.encrypted_title.value));
    form.encrypted_description.value = encryptMessageToString(await encryptMessage(page_key, form.encrypted_description.value));

    // Encrypt the page key using the user's AES key
    const user_encrypted_page_key = encryptMessageToString(await encryptMessage(user_key, page_key_string));
    const creator_encrypted_key = document.createElement('input');
    creator_encrypted_key.type = "hidden";
    creator_encrypted_key.name = 'creator_encrypted_key';
    creator_encrypted_key.value = user_encrypted_page_key;
    console.log(creator_encrypted_key.value.length);
    form.append(creator_encrypted_key);

    // Encrypt the page key using each of the invited users' public keys and add to the form
    await addInviteUsersToForm(form, page_key_string);
    form.submit();
}

/**
 * Encrypts the page key using each of the invited users' public keys and adds to the form.
 * @param form the form
 * @param page_key the page key in string format
 * @returns {Promise<void>}
 */
async function addInviteUsersToForm(form, page_key) {
    for (let i = 0; i < invited_user_list.length; i++) {
        console.log(invited_user_list[i]['key']);
    }
    for (let i = 0; i < invited_user_list.length; i++) {
        let user = invited_user_list[i];
        let user_public_key = await pemToCryptoKey(user['key'], 'public');

        const encrypted_keys_username = document.createElement('input');
        encrypted_keys_username.type = "hidden";
        encrypted_keys_username.name = `encrypted_keys-${i}-username`;
        encrypted_keys_username.value = user['username'];
        form.append(encrypted_keys_username);

        const encrypted_keys_key = document.createElement('input');
        encrypted_keys_key.type = "hidden";
        encrypted_keys_key.name = `encrypted_keys-${i}-key`;
        encrypted_keys_key.value = await encryptWithRSA(user_public_key, page_key);
        form.append(encrypted_keys_key);
    }
}