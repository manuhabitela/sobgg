chrome.contextMenus.create({
	title: 'See on BoardGameGeek',
	contexts: ['selection'],
	onclick: function(info, tab) {
		if (info.selectionText) {
			search(info.selectionText);
		}
	}
});

const gamePage = (id) =>
	'https://www.boardgamegeek.com/boardgame/' + id;

const searchPage = (terms) =>
	'https://boardgamegeek.com/geeksearch.php?action=search&objecttype=boardgame&q=' + encodeURIComponent(terms);

const searchApi = (terms) =>
	'https://www.boardgamegeek.com/xmlapi2/search?query='
	+ encodeURIComponent(terms)
	+ '&type=boardgame,boardgameexpansion&exact=1';

const xmlStringToDocument = (string) => {
	const parser = new DOMParser();
	return parser.parseFromString(string, 'text/xml');
};

const search = (terms) => {
	// directly create an empty tab to look like we are fast, but actually, we are not,
	// because we make a request to the bgg api. Not that the bgg api is that slow,
	// but it's enough waiting time to wonder why the UI has no feedback at all.
	let tabId = null;
	chrome.tabs.query({currentWindow: true, active: true}, (tabs) => {
		chrome.tabs.create({url: 'loading.html', active: false, index: tabs[0].index + 1}, (tab) => {
			tabId = tab.id;
		});
	});

	fetch(searchApi(terms)).then(response => response.text()).then(xmlString => {
		const xml = xmlStringToDocument(xmlString);
		const itemsNumber = xml.querySelector('items').getAttribute('total') * 1;

		let bggUrlToOpen = searchPage(terms)
		if (itemsNumber === 1) {
			bggUrlToOpen = gamePage(xml.querySelector('item[id]').getAttribute('id'));
		}

		chrome.tabs.update(tabId, {url: bggUrlToOpen});
	});
};
