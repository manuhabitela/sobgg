const BGG_BASENAME = 'https://www.boardgamegeek.com';
const API_ENDPOINT = 'https://www.boardgamegeek.com/xmlapi2';

export const gamePage = (id) =>
	`${BGG_BASENAME}/boardgame/${id}`;

export const searchPage = (terms) =>
	`${BGG_BASENAME}/geeksearch.php?action=search&objecttype=boardgame&q=${encodeURIComponent(terms)}`;

const searchEndpoint = (terms) =>
	`${API_ENDPOINT}/search?query=${encodeURIComponent(terms)}&type=boardgame&exact=1`;

const xmlStringToDocument = (string) => {
	const parser = new DOMParser();
	return parser.parseFromString(string, 'text/xml');
};

export const searchApi = (terms) => {
	return fetch(searchEndpoint(terms)).then(response => response.text()).then(xmlString => {
		return xmlStringToDocument(xmlString);
	});
};
