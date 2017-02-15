var preview = document.getElementById("project-view");

var allProjects = document.getElementById("all-projects");

while (allProjects.childNodes.length) {
    preview.appendChild(allProjects.firstChild);
}
