/*
  Test de dévelopement de l'extension BuyOrNot
  On utilise un script de fond (background script) qui au changement de tab
  vérifie si l'url est boycotté.

  Documentation :
    https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions

  User interface :
    https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/user_interface

  Plusieurs exemples d'extension :
    https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Examples

  Exemple utilisé pour la gestion des tabs:
    https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/tabs/Tab

  Pour accéder au DOM de la page en cours, il faut utiliser un "content-script".
  Un content script est lié à une page du navigateur et n'a pas accès à toute
  l'api. Pour communiquer du background script au content script il faut donc
  utiliser l'APi tabs et notamment sendMessage (une alternative peut etre
  d'utiliser l'api storage ou runtime.sendMessage selon le besoin):
    https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/tabs/sendMessage

  Pour améliorer l'environement de dévelopement:
    webpack: https://github.com/mdn/webextensions-examples/tree/master/webpack-modules
    linter: https://github.com/mdn/webextensions-examples/tree/master/eslint-example
*/

/* CONFIGURATION */
const URL_API = "https://jsonplaceholder.typicode.com/posts/1";
const SUPPORTED_PROTOCOLS = ["https:", "http:"];
let apiIsLoaded = false;

let currentTab;
let campaigns;

/* On utilise "var" car seul les variables déclarées avec "var" peuvent être
partagées avec la popup */
var campaign;

/*
  API FETCHING
  On simule un appel à l'api qui va être chercher qu'une seul fois par le script.
  Peut-être cela ne sera pas possible… Il faut aussi penser à mettre à jour la
  base. Il faudrait aussi sauvegarder dans le localStorage les infos
*/
/*
  Mock retour API
  Totalement inventé car on n'a aucune info sur le retour api pour l'instant…
*/
const fakeCampaigns = [
  {
    sites: [
      "https://www.coca-cola-france.fr",
      "http://www.coca-cola-france.fr",
    ],
    marques: ["coca cola", "coca-cola"],
    campaign: "https://www.i-boycott.org/campaigns/coca-cola-le-desastre-du-plastique-et-le-pillage-de-l-eau",
  },
  {
    sites: [
      "https://www.amazon.fr",
      "http://www.amazon.fr",
    ],
    campaign: "https://www.i-boycott.org/campaigns/amazon-non-a-l-optimisation-fiscale-oui-a-de-meilleurs-conditions-de-travail",
  },
  {
    sites: [
      "http://www.marineland.fr",
      "https://www.marineland.fr",
    ],
    campaign: "https://www.i-boycott.org/campaigns/marineland-ensemble-liberons-les-orques",
  },
  {
    sites: [
      "https://www.lu.fr",
    ],
    marques: ["lu"],
    campaign: "https://www.i-boycott.org/campaigns/lu-stop-a-l-huile-de-palme",
  },
];

function fetchData() {
  console.log("FETCHING API");
  fetch(URL_API)
    .then((response) => {
      if (response.status !== 200) { return }

      response.json().then(function (data) {
        // campaigns = data;
        campaigns = fakeCampaigns;
        apiIsLoaded = true;
      });
    })
    .catch((err) => console.log("Fetch Error :", err));
}

if (!apiIsLoaded) {
  fetchData();
}


/*
  GESTION DES TABS

  A chaque changement de tab on vérifie si le site est boycotté parmis les
  campagnes en cours, auquel cas l'icone change de couleur
*/
function updateTab(tabs) {
  if (tabs[0]) {
    currentTab = tabs[0];
  }

  const url = parseUrl(currentTab.url);

  if (!apiIsLoaded || !url) return;

  campaign = checkWebsite(url);
  const path = campaign ? "icons/toolbar_logo_red.svg" : "icons/toolbar_logo.svg";

  browser.browserAction.setIcon({
    tabId: currentTab.id,
    path
  });

  sendMessageToContent({
    campaign: campaign,
    campaigns: campaigns,
    url: url
  });
}

function updateActiveTab(tabs) {
  var gettingActiveTab = browser.tabs.query({ active: true, currentWindow: true });
  gettingActiveTab.then(updateTab);
}

/* Retourne la compagne associée au site web si elle existe  */
function checkWebsite(url) {
  if (!isSupportedProtocol(url)) return;

  const host = getHost(url);
  const campaign = campaigns.find(function (campaign) {
    return campaign.sites.indexOf(host) !== -1;
  });

  return campaign;
}

/* Helpers */
function parseUrl(urlString) {
  if (!urlString) return;

  const url = document.createElement('a');
  url.href = urlString;

  // Converti la partie requête en object
  let searchObject = {}, queries, split, i;
  queries = url.search.replace(/^\?/, '').split('&');
  for (i = 0; i < queries.length; i++) {
    split = queries[i].split('=');
    searchObject[split[0]] = split[1];
  }

  return {
    protocol: url.protocol,
    host: url.host,
    hostname: url.hostname,
    port: url.port,
    pathname: url.pathname,
    search: url.search,
    searchObject: searchObject,
    hash: url.hash
  };
}

function getHost(url) {
  return url.protocol + "//" + url.host;
}

function isSupportedProtocol(url) {
  return SUPPORTED_PROTOCOLS.indexOf(url.protocol) != -1;
}


// listen to tab URL changes
browser.tabs.onUpdated.addListener(updateActiveTab);
// // listen to tab switching
browser.tabs.onActivated.addListener(updateActiveTab);
// // listen for window switching
browser.windows.onFocusChanged.addListener(updateActiveTab);
// // update when the extension loads initially
updateActiveTab();


/*
  COMMUNICATION AVEC LE CONTENT SCRIPT

  Le background script doit communiquer avec le content script par
  l'intermediaire de l'api tabs.
*/
function sendMessageToContent(data) {
  browser.tabs.sendMessage(currentTab.id, data)
    .then(response => {
      console.log("Code retour content", response.code);
    }).catch(err => console.error(err));
}