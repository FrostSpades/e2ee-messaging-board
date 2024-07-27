/**
 * Submits the Register form. Hashes the password value before sending
 * to the server.
 */
async function register_user() {
    // Get the form element
    const form = document.getElementById('submit_form');

    form.password.value = await hash(form.password.value);
    form.confirm_password.value = await hash(form.confirm_password.value);

    form.submit();
}