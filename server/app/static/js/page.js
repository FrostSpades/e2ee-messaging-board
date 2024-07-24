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
 * Method for updating the screen
 * @param data new screen data
 */
function updateScreen(data) {
    // If failed, do not update screen
    if (!data['success']) {
        return
    }

    const form = document.getElementById('post-add-form');
    form.encrypted_message.value = "";

        // Get the posts container
    const postsContainer = document.getElementById('posts');

    // Clear the current posts
    postsContainer.innerHTML = "";

    // Loop through the post_content and post_user arrays to create and append new posts
    for (let i = 0; i < data.post_content.length; i++) {
        // Create a new div element for each post
        const postDiv = document.createElement('div');
        postDiv.classList.add('post');

        // Create a p element for the post content
        const postContent = document.createElement('p');
        postContent.classList.add('post-content');
        postContent.textContent = data.post_content[i];

        // Create a p element for the post user
        const postUser = document.createElement('p');
        postUser.classList.add('post-user');
        postUser.textContent = `Posted by: ${data.post_user[i]}`;

        // Append the post content and user to the post div
        postDiv.appendChild(postContent);
        postDiv.appendChild(postUser);

        // Append the post div to the posts container
        postsContainer.appendChild(postDiv);
    }
}