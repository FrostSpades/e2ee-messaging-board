/**
 * Submits the login form. Hashes the password value before sending
 * to the server.
 */
async function login_user() {
    // Get the form element
    const form = document.getElementById('submit_form');

    // Hash the password
    const hashed_password = document.createElement('input');
    hashed_password.type = "hidden";
    hashed_password.name = 'hashed_password';
    hashed_password.value = await hash(form.password.value);
    form.append(hashed_password);

    // Clear the password value as to not send it to the server
    form.password.value = "";

    // Submit the form
    form.submit();
}