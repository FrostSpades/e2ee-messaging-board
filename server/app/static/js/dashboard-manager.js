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
    // Update the user list
    if ('invite_users' in data) {
        let user_list = data['invite_users'];

        // Reset the user list
        let list = document.getElementById('add_user_list');
        list.innerHTML = "";

        // Add the given users to the user list
        for (let index in user_list) {
            const newItem = document.createElement('li');
            newItem.textContent = user_list[index];
            list.append(newItem);
        }
    }
}

/**
 * Method for handling page creation.
 */
function createPage() {
    const form = document.getElementById('create-page-form');

    // TODO: Encrypt the title and description
    //form.encrypted_title.value = performEncryption();
    //form.encrypted_description.value = performEncryption();

    form.submit();
}