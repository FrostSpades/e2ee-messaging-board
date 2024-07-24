document.addEventListener('DOMContentLoaded', function() {
    fetch('/pages/init-get')
        .then(response => response.json())
        .then(updateScreen)
        .catch(error => console.error('Error:', error));
});


function updateScreen(data) {
    // Do not update the screen if request was unsuccessful
    if (!data["success"]) {
        return
    }

    // If request has page data, update pages
    if ('pages' in data) {
        let tbody = document.getElementById('pages-tbody');
        tbody.innerHTML = ''; // Clear existing content

        data['pages'].forEach(page => {
            let tr = document.createElement('tr');

            let tdId = document.createElement('td');
            tdId.textContent = page.id;
            tr.appendChild(tdId);

            let tdTitle = document.createElement('td');
            let titleLink = document.createElement('a');
            titleLink.textContent = page.title;
            tdTitle.appendChild(titleLink);
            tr.appendChild(tdTitle);

            let tdActions = document.createElement('td');
            let viewButton = document.createElement('a');
            viewButton.textContent = 'View';
            viewButton.className = 'btn btn-sm btn-info';
            viewButton.href = '/page/' + page.id;
            tdActions.appendChild(viewButton);
            tr.appendChild(tdActions);

            tbody.appendChild(tr);
        });
    }
}