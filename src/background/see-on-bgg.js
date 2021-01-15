import browser from "webextension-polyfill";
import {gamePage, searchPage, searchApi} from '../api/bgg';

// thanks https://stackoverflow.com/a/63964511/257559
const IS_FIREFOX = browser.runtime.getURL('').startsWith('moz-extension://');

browser.contextMenus.create({
	title: 'See on BoardGameGeek',
	contexts: ['selection'],
	onclick: function(info, tab) {
		if (info.selectionText) {
			seeOnBgg(info.selectionText.trim());
		}
	}
});

const getCurrentTab = () => browser.tabs.query({currentWindow: true, active: true})
	.then((tabs) => {
		return tabs[0];
	});

const seeOnBgg = (terms) => {
	// directly create an empty tab to look like we are fast, but actually, we are not,
	// because we make a request to the bgg api. Not that the bgg api is that slow,
	// but it's enough waiting time to wonder why the UI has no feedback at all.
	const newTabCreation = getCurrentTab()
			.then(currentTab => {
				return browser.tabs.create({
					url: '/loading.html',
					active: false,
					index: currentTab.index + 1
				});
			})
			.then(newTab => {
				// on firefox, we wait for the new tab to be fully loaded before continuing
				// because at least on my machine there is a bug:
				//  when the "loading" tab gets the browser.tabs.update call (with the bgg page),
				//  if the tab is still loading the "/loading.html" page, it doesn't update the url correctly
				//  and it stays on the "loading" page.
				// so, we get around that by waiting for the "tab creation" to be "fully complete" before
				// we call browser.tabs.update later
				if (IS_FIREFOX) {
					return new Promise(resolve => {
						const buggyFirefoxListener = (tabId, changeInfo, tabInfo) => {
							if (changeInfo.status === "complete") {
								browser.tabs.onUpdated.removeListener(buggyFirefoxListener);
								resolve(newTab.id);
							}
						};
						browser.tabs.onUpdated.addListener(
							buggyFirefoxListener,
							{tabId: newTab.id, properties: ["status"]}
						);
						// just in case…
						setTimeout(() => resolve(newTab.id), 800);
					});
				}
				return newTab.id;
			})
		;

	const bggSearch = searchApi(terms).then(xml => {
		const itemsNumber = xml.querySelector('items').getAttribute('total') * 1;

		return itemsNumber === 1
			? gamePage(xml.querySelector('item[id]').getAttribute('id'))
			: searchPage(terms);
	});

	Promise.all([newTabCreation, bggSearch]).then(([newTabId, url]) => {
		const updateOptions = {url};
		if (IS_FIREFOX) {
			updateOptions.loadReplace = true;
		}
		browser.tabs.update(newTabId, updateOptions);
	});
};
