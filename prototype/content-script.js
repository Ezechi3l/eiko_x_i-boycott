/*
  Gestion de la communication entre le background et le content script
*/
const CODE_CONTENT_UPDATED = 1;
const CODE_CONTENT_NOT_UPDATED = 2;

browser.runtime.onMessage.addListener(request => {
  handleRequest(request);
  return Promise.resolve({ code: CODE_CONTENT_UPDATED  });
});

function handleRequest(request) {
  // Si tout le site est boycotté
  if (request.campaign) return;

  const brands = request.campaigns.filter(campaign => campaign.marques).map(campaign => campaign.marques).flat();
  const regex = new RegExp(brands.join("|"), "im")

  /* Test sur le site Auchan.fr */
  const lst = [...document.querySelectorAll(".product-thumbnail__description:not([data-buy-or-not])")];
  lst.map(node => checkForBoycott(node, regex));
}

function checkForBoycott(node, regex) {
  /* On ajoute un dataset pour éviter de vérifier deux fois le meme produit */
  node.dataset.buyOrNot = "";

  if (-1 === node.innerHTML.search(regex)) return;

  addInformation(node);
}


function addInformation(node) {
  node.style.color = "red";
  node.style.position = "relative";
  node.parentElement.insertBefore(getContent(), node);
}


function getContent() {
  const div = document.createElement("div");
  div.classList.add("buyornot");

  /* Ajouter le svg */
  div.innerHTML = `<p style="color: red; font-weight: bold;">Ce produit fait l'object d'une campagne buy or not</p>`;
  return div;
}