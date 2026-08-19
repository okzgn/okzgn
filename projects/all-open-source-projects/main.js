document.addEventListener('DOMContentLoaded', function () {
  console.log('Blank Ready.');

  var
    currentDate = Date.now(),
    projectsContainer = document.querySelector('.projects-container'),
    projectsResponseContainer = document.querySelector('.projects-response'),
    alreadyRequestedProjects = localStorage.getItem('all-oss-projects'),
    alreadyRequestedProjectsDate = localStorage.getItem('all-oss-projects-date'),
    projectsDiffDate = alreadyRequestedProjectsDate ? Math.round((currentDate - Number(alreadyRequestedProjectsDate)) / 1000) : 0,
    projectsContent = alreadyRequestedProjects || '{"loading":"Updating"}';

  if (projectsContainer && projectsResponseContainer && (!alreadyRequestedProjects || !alreadyRequestedProjectsDate || projectsDiffDate > 86400)) {
    var projectsRequest = _http({
      url: 'https://api.github.com/users/okzgn/repos?sort=pushed&per_page=30',
      onSuccess: function (r) {
        console.info('New Github request.');
        projectsContent = r;
        localStorage.setItem('all-oss-projects', projectsContent);
        localStorage.setItem('all-oss-projects-date', Date.now());
        showProjects(projectsContainer, projectsResponseContainer, projectsContent);
      },
      onError: function (e) {
        projectsContent = '{"error":"' + e.message + '"}';
        localStorage.setItem('all-oss-projects', projectsContent);
        localStorage.setItem('all-oss-projects-date', Date.now() + 85800000);
        showProjects(projectsContainer, projectsResponseContainer, projectsContent);
      }
    });
  }

  showProjects(projectsContainer, projectsResponseContainer, projectsContent);

  var descriptions = document.querySelectorAll('.projects-container .description');
  descriptions.forEach(function (description) {
    description.addEventListener('click', toggleDescription);
  });
});

function toggleDescription (e) {
  e.preventDefault();
  this.classList.toggle('collapsed');
}

function showProjects(container, responseContainer, projects){
  try {
    projects = JSON.parse(projects);
  }
  catch (e) {
    projects = { error: 'Cannot read the projects (JSON).' };
  }

  if (projects.loading) {
    responseContainer.classList.add('loading');
    responseContainer.textContent = projects.loading;
    return;
  }

  if (projects.error || !projects.length) {
    if (!projects.length) { projects.error = 'Cannot update projects list (empty).'; }
    responseContainer.classList.add('error');
    responseContainer.textContent = projects.error;
    return;
  }

  responseContainer.classList.add('hidden');
  container.textContent = '';

  createProjectsLinks('Modern projects', container, projects, [], ['website', 'software-preservation']);
  createProjectsLinks('Old projects', container, projects, ['software-preservation'], ['website'], true);

  if (typeof window['_TOC_OBSERVER_RESET'] === 'function'){
    window['_TOC_OBSERVER_RESET']();
  }
}

function createProjectsLinks(title, projectsContainer, projects, included, excluded, hr) {
  var
    container = document.createElement('ul'),
    sectionItem = document.createElement('h2');

  sectionItem.className = 'auto-font-size-2';
  sectionItem.textContent = title;

  container.className = 'projects-list';

  if (hr) {
    hr = document.createElement('hr');
    projectsContainer.appendChild(hr);
  }

  projectsContainer.appendChild(sectionItem);
  projectsContainer.appendChild(container);

  var total = 0;
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

    total++;

    var
      listItem = document.createElement('li'),
      titleBoxItem = document.createElement('h3'),
      titleItem = document.createElement('a'),
      detailsItem = document.createElement('div'),
      languageItem = document.createElement('code'),
      descriptionItem = document.createElement('span');

    titleBoxItem.id = projects[i].name;

    titleItem.className = 'link';
    titleItem.textContent = projects[i].name;
    titleItem.href = projects[i].html_url;
    titleItem.target = "_blank";
    titleItem.rel = "noopener noreferrer";

    languageItem.className = 'language';
    languageItem.textContent = projects[i].language;

    detailsItem.className = 'details rounded-box';
    if (projects[i].language) { detailsItem.appendChild(languageItem); }

    var
      filteredTopics = (topics ? projects[i].topics.filter(function (topic) { return (topic !== (projects[i].language || '').toLowerCase() ? topic : ''); }) : []),
      k = filteredTopics.length;

    while(k--){
      var topicItem = document.createElement('code');
      topicItem.className = 'topic';
      topicItem.textContent = filteredTopics[k];
      detailsItem.appendChild(topicItem);
    }

    descriptionItem.className = 'description collapsed';
    descriptionItem.textContent = projects[i].description;
    descriptionItem.addEventListener('click', toggleDescription);

    titleBoxItem.className = 'title';
    titleBoxItem.appendChild(titleItem);
    listItem.appendChild(titleBoxItem);
    listItem.appendChild(descriptionItem);
    listItem.appendChild(detailsItem);

    container.appendChild(listItem);
  }

  var totalItem = document.createElement('strong');
  totalItem.className = 'total';
  totalItem.textContent = 'Total:';
  sectionItem.insertAdjacentElement('afterend', totalItem);

  var totalValue = document.createElement('b');
  totalValue.textContent = total;
  totalItem.appendChild(totalValue);

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
