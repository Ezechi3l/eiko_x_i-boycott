/*
  Gestion de la popup affichée au click sur le bouton dans la toolbar.
  On communique avec celle-ci en récupérant les "var" du background script.
*/

/* Partie de l'interface dynamique */
const isNotBoycotted = document.getElementById("site-not-boycotted").classList;
const isBoycotted = document.getElementById("site-boycotted").classList;
const linkBoycott = document.getElementById("site-boycotted-link");

/*
  On récupère la variable "campaign" du background script et selon celle-ci
  on affichage la bonne partie de la popup
*/
var getting = browser.runtime.getBackgroundPage();
getting.then(onGot, onError);
function onGot(page) {
  if (page.campaign) {
    isNotBoycotted.add("hidden");
    isBoycotted.remove("hidden");
    linkBoycott.href = page.campaign.campaign;
    return;
  }

  isNotBoycotted.remove("hidden");
  isBoycotted.add("hidden");
  linkBoycott.href = "";
}

function onError(error) {
  console.log(`Error: ${error}`);
}


/* Gestion du lien dans la popup */
linkBoycott.addEventListener("click",  (ev) => {
  ev.preventDefault();

  // On veut juste fermer la popup au click sur le lien mais un bug ferme la
  // nouvelle tab au lieu de fermer la popup donc on est obligé de gérer
  // l'ouverture nous-mêmes.
  // https://stackoverflow.com/questions/4907843/open-a-url-in-a-new-tab-and-not-a-new-window
  var win = window.open(linkBoycott.href, '_blank');
  win.focus();
  //Ferme la popup
  window.close();
});
