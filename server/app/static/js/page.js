document.addEventListener('DOMContentLoaded', function() {
    fetch(`/page/${page_id}/init-get`)
        .then(response => response.json())
        .then(updateScreen)
        .catch(error => console.error('Error:', error));
});

/**
 * Method for adding a post to a page.
 */
function addPost() {
    const form = document.getElementById('post-add-form');
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
 * Method for inviting a user to a page
 */
function addUser() {
    const form = document.getElementById('invite-users-form');
    const form_data = new FormData(form);

    fetch(`/page/${page_id}/invite-user`, {
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
    // If failed, do not update screen
    if (!data['success']) {
        return;
    }

    // Check if sessionStorage contains the encrypted user key
    if (sessionStorage.getItem('key') == null) {
        // Log out user if not
        window.location.href = '/logout';
    }

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

    // If there is new post data, update post data in screen
    if ('posts' in data) {
        // Get the posts container
        const postsContainer = document.getElementById('posts');

        // Clear the current posts
        postsContainer.innerHTML = "";

        // Loop through the post_content and post_user arrays to create and append new posts
        data['posts'].forEach(post =>{
            // Create a new div element for each post
            const postDiv = document.createElement('div');
            postDiv.classList.add('post');

            // Create a p element for the post content
            const postContent = document.createElement('p');
            postContent.classList.add('post-content');
            postContent.textContent = post.message;

            // Create a p element for the post user
            const postUser = document.createElement('p');
            postUser.classList.add('post-user');
            postUser.textContent = `Posted by: ${post.user}`;

            // Append the post content and user to the post div
            postDiv.appendChild(postContent);
            postDiv.appendChild(postUser);

            // Append the post div to the posts container
            postsContainer.appendChild(postDiv);
        });
    }
}

function updateTitle(title, description) {
    console.log(title);
    console.log(description);

    // Get the page header element
    const pageHeader = document.getElementById('page_header');

    // Get the h1 and p elements within the page header
    const h1 = pageHeader.querySelector('h1');
    const p = pageHeader.querySelector('p');

    // Update their content
    h1.textContent = title;
    p.textContent = description;
}