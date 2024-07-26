/**
 * Cancels the enter key press.
 * @param event
 */
function cancelEnter(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
    }
}
