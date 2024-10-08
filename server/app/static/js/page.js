document.addEventListener('DOMContentLoaded', function() {
    fetch(`/page/${page_id}/init-get`)
        .then(response => response.json())
        .then(updateScreen)
        .catch(error => console.error('Error:', error));
});

/**
 * Method for starting adding a post to a page.
 */
function addPost() {
    fetch(`/page/${page_id}/init-get`)
    .then(response => response.json())
    .then(addPostSubmit)
    .catch(error => console.error('Error:', error));
}

/**
 * Finished submitting the form to add a post to a page
 * @param data
 */
async function addPostSubmit(data) {
    // Check if sessionStorage contains the encrypted user key
    if (sessionStorage.getItem('key') == null) {
        // Log out user if not
        window.location.href = '/logout';
    }

    // Retrieve the keys
    let keys = await getKeys(data['browser_key'], data['page_key'], "aes");
    let page_key = keys['decrypted_key'];

    const form = document.getElementById('post-add-form');
    form.encrypted_message.value = encryptMessageToString(await encryptMessage(page_key, form.encrypted_message.value));

    const form_data = new FormData(form);

    fetch(`/page/${page_id}/add-post`, {
        method: 'POST',
        body: form_data
    })
    .then(response => response.json())
    .then(updateScreen)
    .catch(error => console.error('Error:', error));
}

/**
 * Starts the invitation process. Sends a request for the invited user's public keys.
 */
function addUser() {
    const form = document.getElementById('invite-users-form');
    const form_data = new FormData(form);

    fetch(`/page/${page_id}/invite-user/request`, {
        method: 'POST',
        body: form_data
    })
    .then(response => response.json())
    .then(addUserSubmit)
    .catch(error => console.error('Error:', error));
}

/**
 * Sends an invitation with the encrypted page key, encrypted with the invited user's public key.
 * @param data
 */
async function addUserSubmit(data) {
    // If the request was not successful, exit method
    if (!data['success']) {
        if (data['flash']) {
        // Refresh
        window.location.href = `/page/${page_id}`;
        }
        else {
            return;
        }
    }

    // Check if sessionStorage contains the encrypted user key
    if (sessionStorage.getItem('key') == null) {
        // Log out user if not
        window.location.href = '/logout';
    }

    // Get the keys
    let keys = await getKeys(data['browser_key'], data['encrypted_page_key'], "aes");
    let public_key = await pemToCryptoKey(data['invite_public_key'], "public");

    // Encrypt the key
    let encrypted_page_key = await encryptWithRSA(public_key, await aesKeyToString(keys['decrypted_key']));

    // Add the data to the form
    const form = document.getElementById('invite-users-form');
    let encrypted_key = document.createElement('input');
    encrypted_key.name = 'encrypted_key';
    encrypted_key.type = 'hidden';
    encrypted_key.value = encrypted_page_key;
    form.appendChild(encrypted_key);

    // Submit the form
    const form_data = new FormData(form);

    fetch(`/page/${page_id}/invite-user`, {
        method: 'POST',
        body: form_data
    })
    .then(response => response.json())
    .then(updateScreen)
    .catch(error => console.error('Error:', error));

    //Clear the data
    data = "";
    keys = "";
    encrypted_page_key = "";
    form.new_user.value = "";
    form.encrypted_key.value = "";
}

async function deletePost(event) {
    const button = event.currentTarget;
    let post = button.closest('.post')
    const post_id = post.querySelector('.post-id').value;

    let form = document.getElementById('delete-post-form');
    const post_id_input = document.createElement('input');
    post_id_input.value = post_id;
    post_id_input.type = 'hidden';
    post_id_input.name = 'post_id';

    form.appendChild(post_id_input);

    // Submit the form
    const form_data = new FormData(form);

    fetch(`/page/${page_id}/delete-post/${post_id}`, {
        method: 'POST',
        body: form_data
    })
    .then(response => response.json())
    .then(updateScreen)
    .catch(error => console.error('Error:', error));
}

/**
 * Method for updating the screen
 * @param data new screen data
 */
async function updateScreen(data) {
    // If unsuccessful, either refresh the page with the flash message, or do nothing if no flash messages were provided
    if (data['flash']) {
        window.location.href = `/page/${page_id}`;
    }

    if (!data['success']) {
        return;
    }

    // Log out the user if the client does not have the correct user's key
    if ('current_username' in data) {
        if (sessionStorage.getItem('key') == null || sessionStorage.getItem('current_username') == null ||
            sessionStorage.getItem('current_username') !== data['current_username']) {
            window.location.href = '/logout';
        }
    }

    // If there is new post data, update post data in screen
    if ('posts' in data) {
        // Retrieve the keys
        let keys = await getKeys(data['browser_key'], data['page_key'], "aes");
        let page_key = keys['decrypted_key'];

        // Decrypt title
        let encrypted_title = stringToEncryptMessage(encrypted_title_string);
        let title = await decryptMessage(page_key, encrypted_title.iv, encrypted_title.encrypted);

        // Decrypt description
        let encrypted_description = stringToEncryptMessage(encrypted_description_string);
        let description = await decryptMessage(page_key, encrypted_description.iv, encrypted_description.encrypted);

        updateTitle(title, description);

        // Clear the containers
        document.getElementById('post-add-form').encrypted_message.value = "";
        document.getElementById('invite-users-form').new_user.value = "";

        // Get the posts container
        const postsContainer = document.getElementById('posts');

        // Clear the current posts
        postsContainer.innerHTML = "";

        // Loop through the post_content and post_user arrays to create and append new posts
        for (let i = 0; i < data['posts'].length; i++) {
            let post = data['posts'][i]

            await addPostToContainer(page_key, postsContainer, post);
        }
    }
    // Add 'show' class to posts after they are appended
    const posts = document.querySelectorAll('.post');
    posts.forEach(post => post.classList.add('show'));

    document.getElementById('posts').scrollIntoView({ behavior: 'smooth' });

    // Clear sensitive data
    data = "";
    keys = "";
    page_key = "";
}

/**
 * Adds a post to the posts container
 * @param page_key decryption key to access post content
 * @param postsContainer the container
 * @param post the post
 * @returns {Promise<void>}
 */
async function addPostToContainer(page_key, postsContainer, post) {
    // Create a new div element for each post
    const postDiv = document.createElement('div');
    postDiv.classList.add('post');

    // Create a p element for the post content
    const postContent = document.createElement('p');
    postContent.classList.add('post-content');

    // Decrypt post message
    let encrypted_post = post['message'];
    encrypted_post = stringToEncryptMessage(encrypted_post);
    postContent.textContent = await decryptMessage(page_key, encrypted_post.iv, encrypted_post.encrypted);

    // Create a post header to hold the user, date, and time
    const post_header = document.createElement('div');
    post_header.classList.add('post-header');

    // Create a p element for the post user
    const postUser = document.createElement('div');
    postUser.classList.add('post-user');
    postUser.textContent = `Posted by: ${post.user}`;

    // Create a p element for the post time
    const postDateTime = document.createElement('div');
    postDateTime.classList.add('post-date-time');
    postDateTime.textContent = `On ${post.date} at ${post.time}`;

    // Add delete button
    const deleteButton = document.createElement('a');
    deleteButton.textContent = 'Remove';
    deleteButton.onclick = deletePost;
    deleteButton.className = 'btn btn-sm btn-danger';

    // Add the post id
    const post_id = document.createElement('input');
    post_id.name = "post_id";
    post_id.classList.add('post-id');
    post_id.value = post.id;
    post_id.type = 'hidden';

    post_header.appendChild(postUser);
    post_header.appendChild(postDateTime);

    // Only add delete button if user created the post
    if (username === post.user) {
        post_header.appendChild(deleteButton);
    }

    // Append the post content and user to the post div
    postDiv.appendChild(postContent);
    postDiv.appendChild(post_header);
    postDiv.appendChild(post_id);

    // Append the post div to the posts container
    postsContainer.appendChild(postDiv);
}

function updateTitle(title, description) {
    // Get the page header element
    const pageHeader = document.getElementById('page_header');

    // Get the h1 and p elements within the page header
    const h1 = pageHeader.querySelector('h1');
    const p = pageHeader.querySelector('p');

    // Update their content
    h1.textContent = title;
    p.textContent = description;
}