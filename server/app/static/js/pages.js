document.addEventListener('DOMContentLoaded', function() {
    fetch('/pages/init-get')
        .then(response => response.json())
        .then(updateScreen)
        .catch(error => console.error('Error:', error));
});


function updateScreen(data) {
    pages = [];

    // Add the page data
    for (let i = 0; i < data['page_ids'].length; i++) {
        let page = {"id":data['page_ids'][i], "title":data['page_titles'][i]};
        pages.push(page);
    }

    updateTable(pages);
}

function updateTable(pages) {
    let tbody = document.getElementById('pages-tbody');
    tbody.innerHTML = ''; // Clear existing content

    pages.forEach(function(page) {
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
        tdActions.appendChild(viewButton);
        tr.appendChild(tdActions);

        tbody.appendChild(tr);
    });
}