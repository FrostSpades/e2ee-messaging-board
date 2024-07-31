document.addEventListener('DOMContentLoaded', function() {
    fetch('/pages/invites/init-get')
        .then(response => response.json())
        .then(updateScreen)
        .catch(error => console.error('Error:', error));
});

/**
 * Handles accepting invites.
 * @param event
 */
function acceptInvite(event) {
    const button = event.currentTarget;
    const form = button.closest('form');
    const form_data = new FormData(form);
    const invite_id = form.querySelector('input[name="invite_id"]').value;

    fetch(`/pages/accept-invite/${invite_id}`, {
        method: 'POST',
        body: form_data
    })
    .then(response => response.json())
    .then(updateScreen)
    .catch(error => console.error('Error:', error));
}

/**
 * Handles declining invites.
 * @param event
 */
function declineInvite(event) {
    const button = event.currentTarget;
    const form = button.closest('form');
    const form_data = new FormData(form);
    const invite_id = form.querySelector('input[name="invite_id"]').value;

    fetch(`/pages/decline-invite/${invite_id}`, {
        method: 'POST',
        body: form_data
    })
    .then(response => response.json())
    .then(updateScreen)
    .catch(error => console.error('Error:', error));
}

/**
 * Updates the screen.
 * @param data json data
 * @returns {Promise<void>}
 */
async function updateScreen(data) {
    // Don't update screen if ajax was unsuccessful
    if (!data['success']) {
        return
    }

    // Update invites if contained in data
    if ('invites' in data) {
        // Check if sessionStorage contains the encrypted user key
        if (sessionStorage.getItem('key') == null) {
            // Log out user if not
            window.location.href = '/logout';
        }

        // Decrypt the private key
        let keys = await getKeys(data['browser_key'], data['encrypted_private_key'], "rsa");
        let private_key = keys['decrypted_key'];

        const tbody = document.getElementById('invites-tbody');
        tbody.innerHTML = ''; // Clear existing content

        // Add each invite to the page
        for (let i = 0; i < data['invites'].length; i++) {
            let invite = data['invites'][i];

            // Decrypt the page key
            const encrypted_key = invite['key'];
            const page_key = await stringToAesKey(await decryptWithRSA(private_key, encrypted_key));

            // Decrypt the title with the page key
            const encrypted_title = stringToEncryptMessage(invite['title']);
            const title = await decryptMessage(page_key, encrypted_title.iv, encrypted_title.encrypted);

            // Re-encrypt the page key
            const encrypted_page_key = encryptMessageToString(await encryptMessage(keys['user_key'], await aesKeyToString(page_key)));

            // Add the invite to the page
            addInviteToPage(tbody, invite, title, encrypted_page_key);
        }
    }
}

/**
 * Adds the invite to the screen.
 * @param tbody the dom element to add to
 * @param invite the invite json object
 * @param invite_title the title of the invite
 * @param encrypted_key the encrypted key of the invite page
 */
function addInviteToPage(tbody, invite, invite_title, encrypted_key) {
    let tr = document.createElement('tr');

    // Add the invite id
    let tdId = document.createElement('td');
    tdId.textContent = invite.id;
    tr.appendChild(tdId);

    // Add the title of the invited page
    let tdTitle = document.createElement('td');
    let titleLink = document.createElement('a');
    titleLink.textContent = invite_title;
    tdTitle.appendChild(titleLink);
    tr.appendChild(tdTitle);

    let tdActions = document.createElement('td');

    // Accept form
    let acceptForm = document.createElement('form');
    acceptForm.method = 'post';
    acceptForm.action = '/pages/accept-invite/' + invite.id;

    let acceptFormEncryptedKey = document.createElement('input');
    acceptFormEncryptedKey.type = 'hidden';
    acceptFormEncryptedKey.name = 'encrypted_key';
    acceptFormEncryptedKey.value = encrypted_key;
    acceptForm.appendChild(acceptFormEncryptedKey);

    let acceptCsrfToken = document.createElement('input');
    acceptCsrfToken.type = 'hidden';
    acceptCsrfToken.name = 'csrf_token';
    acceptCsrfToken.value = csrf_token;
    acceptForm.appendChild(acceptCsrfToken);

    let invite_id = document.createElement('input');
    invite_id.type = 'hidden';
    invite_id.name = 'invite_id';
    invite_id.value = invite.id;
    acceptForm.appendChild(invite_id)

    let acceptButton = document.createElement('button');
    acceptButton.type = 'button';
    acceptButton.textContent = 'Accept';
    acceptButton.className = 'btn btn-sm btn-success';
    acceptButton.onclick = acceptInvite;
    acceptForm.appendChild(acceptButton);

    tdActions.appendChild(acceptForm);

    // Decline form
    let declineForm = document.createElement('form');
    declineForm.method = 'post';
    declineForm.action = '/pages/decline-invite/' + invite.id;

    let declineCsrfToken = document.createElement('input');
    declineCsrfToken.type = 'hidden';
    declineCsrfToken.name = 'csrf_token';
    declineCsrfToken.value = csrf_token;
    declineForm.appendChild(declineCsrfToken);

    invite_id = document.createElement('input');
    invite_id.type = 'hidden';
    invite_id.name = 'invite_id';
    invite_id.value = invite.id;
    declineForm.appendChild(invite_id);

    let declineButton = document.createElement('button');
    declineButton.type = 'button';
    declineButton.textContent = 'Decline';
    declineButton.className = 'btn btn-sm btn-danger';
    declineButton.onclick = declineInvite;
    declineForm.appendChild(declineButton);

    tdActions.appendChild(declineForm);

    tr.appendChild(tdActions);

    tbody.appendChild(tr);
}