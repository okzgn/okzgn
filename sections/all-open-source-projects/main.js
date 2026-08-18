document.addEventListener('DOMContentLoaded', function () {
  console.log('Blank Ready.');

  /*var
    projectsContainer = document.querySelector('.projects-container'),
    projectsResponseContainer = document.querySelector('.projects-response'),
    alreadyRequestedProjects = localStorage.getItem('all-oss-projects'),
    projectsContent = alreadyRequestedProjects || '{"error":"Loading..."}';

  if (projectsContainer && projectsResponseContainer && !alreadyRequestedProjects) {
    var projectsRequest = _http({
      url: 'https://api.github.com/users/okzgn/repos?sort=pushed&per_page=50',
      onSuccess: function (r) {
        projectsContent = r;
        localStorage.setItem('all-oss-projects', projectsContent);
        showProjects(projectsContainer, projectsResponseContainer, projectsContent);
      },
      onError: function (e) {
        projectsContent = '{"error":"' + e.message + '"}';
        localStorage.setItem('all-oss-projects', projectsContent);
        showProjects(projectsContainer, projectsResponseContainer, projectsContent);
      }
    });
  }

  showProjects(projectsContainer, projectsResponseContainer, projectsContent);*/
});

function showProjects(container, responseContainer, projects){
  try {
    projects = JSON.parse(projects);
  }
  catch (e) {
    projects = { error: 'Cannot read the projects (JSON).' };
  }

  if (projects.error) {
    responseContainer.textContent = projects.error;
    return;
  }

  if (!projects.length) {
    responseContainer.textContent = 'No projects found, try again later.';
    return;
  }

  responseContainer.classList.add('hidden');

  createProjectsLinks('Modern projects', container, projects, [], ['website', 'software-preservation']);
  createProjectsLinks('Old projects / Software Preservation', container, projects, ['software-preservation'], ['website'], true);
}

function createProjectsLinks(title, projectsContainer, projects, included, excluded, hr) {
  var
    container = document.createElement('ul'),
    titleItem = document.createElement('h3');

  titleItem.className = 'auto-font-size-2';
  titleItem.textContent = title;

  container.className = 'projects-list';

  if (hr) {
    hr = document.createElement('hr');
    projectsContainer.appendChild(hr);
  }

  projectsContainer.appendChild(titleItem);
  projectsContainer.appendChild(container);

  var toggle = function (e) {
    e.preventDefault();
    this.classList.toggle('collapsed');
  };

  for (var i = 0; i < projects.length; i++) {

    var
      topics = projects[i].topics && projects[i].topics.length,
      _topics = new Set(topics ? projects[i].topics : []);

    if (topics) {
      if ((included && included.length && !haveTopic(_topics, included, true))
        || (excluded && excluded.length && haveTopic(_topics, excluded, false))) {
        continue;
      }
    }

    var
      listItem = document.createElement('li'),
      titleBoxItem = document.createElement('h4'),
      titleItem = document.createElement('a'),
      detailsItem = document.createElement('div'),
      languageItem = document.createElement('code'),
      descriptionItem = document.createElement('span');

    titleItem.className = 'link';
    titleItem.textContent = projects[i].name;
    titleItem.href = projects[i].html_url;
    titleItem.target = "_blank";
    titleItem.ref = "noopener noreferrer";

    languageItem.className = 'language';
    languageItem.textContent = projects[i].language;

    detailsItem.className = 'details rounded-box';
    detailsItem.appendChild(languageItem);

    var
      filteredTopics = (topics ? projects[i].topics.filter(function (topic) { return (topic !== projects[i].language.toLowerCase() ? topic : ''); }) : []),
      k = filteredTopics.length;

    while(k--){
      var topicItem = document.createElement('code');
      topicItem.className = 'topic';
      topicItem.textContent = filteredTopics[k];
      detailsItem.appendChild(topicItem);
    }

    descriptionItem.className = 'description collapsed';
    descriptionItem.textContent = projects[i].description;
    descriptionItem.addEventListener('click', toggle);

    titleBoxItem.className = 'title';
    titleBoxItem.appendChild(titleItem);
    listItem.appendChild(titleBoxItem);
    listItem.appendChild(descriptionItem);
    listItem.appendChild(detailsItem);

    container.appendChild(listItem);
  }
}

function haveTopic(_topics, list, condition) {
  var j = list.length, condition = (!condition ? false : 0);
  while (j--) {
    if (_topics.has(list[j])){
      if (!condition) {
        return true;
      }
      condition++;
    }
  }

  return (condition === list.length ? true : false)
}
