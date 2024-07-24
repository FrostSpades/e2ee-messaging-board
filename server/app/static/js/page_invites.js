document.addEventListener('DOMContentLoaded', function() {
    fetch('/pages/invites/init-get')
        .then(response => response.json())
        .then(updateScreen)
        .catch(error => console.error('Error:', error));
});


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


function updateScreen(data) {
    // Don't update screen if ajax was unsuccessful
    if (!data['success']) {
        return
    }

    // Update invites if contained in data
    if ('invites' in data) {
        const tbody = document.getElementById('invites-tbody');
        tbody.innerHTML = ''; // Clear existing content

        data['invites'].forEach(invite => {
            let tr = document.createElement('tr');

            let tdId = document.createElement('td');
            tdId.textContent = invite.id;
            tr.appendChild(tdId);

            let tdTitle = document.createElement('td');
            let titleLink = document.createElement('a');
            titleLink.textContent = invite.title;
            tdTitle.appendChild(titleLink);
            tr.appendChild(tdTitle);

            let tdActions = document.createElement('td');

            // Accept form
            let acceptForm = document.createElement('form');
            acceptForm.method = 'post';
            acceptForm.action = '/pages/accept-invite/' + invite.id;

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
        });
    }
}