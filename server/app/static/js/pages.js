document.addEventListener('DOMContentLoaded', function() {
    fetch('/pages/init-get')
        .then(response => response.json())
        .then(updateScreen)
        .catch(error => console.error('Error:', error));
});

/**
 * Updates the screen
 * @param data the data given from the request
 * @returns {Promise<void>}
 */
async function updateScreen(data) {
    // Do not update the screen if request was unsuccessful
    if (!data["success"]) {
        return
    }

    // Check if sessionStorage contains the encrypted user key
    if (sessionStorage.getItem('key') == null) {
        // Log out user if not
        window.location.href = '/logout';
    }

    // If request has page data, update pages
    if ('pages' in data) {
        const browser_key = await stringToAesKey(data['browser_key']);

        // Retrieve the encrypted user key from storage and decrypt it using the browser key
        let user_key = stringToEncryptMessage(sessionStorage.getItem('key'));
        user_key = await decryptMessage(browser_key, user_key.iv, user_key.encrypted);
        user_key = await stringToAesKey(user_key);

        let tbody = document.getElementById('pages-tbody');
        tbody.innerHTML = ''; // Clear existing content

        // Go through each page and decrypt the titles and show it on screen
        for (let i = 0; i < data['pages'].length; i++) {
            let page = data['pages'][i];

            // Extract page key and decrypt it
            let encrypted_page_key = stringToEncryptMessage(page['key']);
            let page_key = await stringToAesKey(await decryptMessage(user_key, encrypted_page_key.iv, encrypted_page_key.encrypted));

            // Decrypt the title
            const encrypted_page_title = stringToEncryptMessage(page['title']);
            let page_title = await decryptMessage(page_key, encrypted_page_title.iv, encrypted_page_title.encrypted);

            // Add the data to the page
            addPage(tbody, page['id'], page_title);
        }

        // Clear the sensitive data from memory
        user_key = "";
        data = "";
    }
}

/**
 * Adds page to the screen
 * @param tbody the body the information is added to
 * @param page_id the id of the page
 * @param page_title the title of the page
 */
function addPage(tbody, page_id, page_title) {
    let tr = document.createElement('tr');

    // Add page id
    let tdId = document.createElement('td');
    tdId.textContent = page_id;
    tdId.name = "page_id"
    tr.appendChild(tdId);

    // Add page title
    let tdTitle = document.createElement('td');
    let titleLink = document.createElement('a');
    titleLink.textContent = page_title;
    tdTitle.appendChild(titleLink);
    tr.appendChild(tdTitle);

    let tdActions = document.createElement('td');

    // Add the view button
    let viewButton = document.createElement('a');
    viewButton.textContent = 'View';
    viewButton.className = 'btn btn-sm btn-info';
    viewButton.href = '/page/' + page_id;
    tdActions.appendChild(viewButton);

    // Add the delete button
    let deleteButton = document.createElement('a');
    deleteButton.textContent = 'Delete';
    deleteButton.onclick = deletePage;
    deleteButton.className = 'btn btn-sm btn-danger';
    tdActions.appendChild(deleteButton);

    tr.appendChild(tdActions);

    tbody.appendChild(tr);
}

/**
 * Handles page deletion.
 * @param event
 */
function deletePage(event) {
    const button = event.currentTarget;
    let tr = button.closest('tr');
    let page_id = tr.querySelector('td').textContent;

    let form = document.getElementById('delete-page-form');

    //Add the page id to the form
    let id = document.createElement('input');
    id.type = "hidden";
    id.name = "page_id";
    id.value = page_id;

    form.appendChild(id);

    // Submit the form
    const form_data = new FormData(form);

    fetch(`/pages/${page_id}/delete`, {
        method: 'POST',
        body: form_data
    })
    .then(response => response.json())
    .then(updateScreen)
    .catch(error => console.error('Error:', error));
}