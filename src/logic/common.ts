/*
 * Capitalizes given string (skips leading whitespaces and numbers)
 */
import {
	bookAndChapterRegEx,
	multipleChaptersRegEx,
	multipleVersesRegEx,
	oneVerseRegEx,
} from "../utils/regexes";
import { App, Notice } from "obsidian";
import {PluginSettings} from "../main";

/**
 * Capitalizes given string, taking leading numbers into account
 * @param str String that should be capitalized
 */
export function capitalize(str: string) {
	str = str.toLocaleLowerCase();
	for (let i = 0; i < str.length; i++) {
		if (/[^\s\d.,#-]/.test(str.charAt(i))) {
			return (
				str.slice(0, i) + str.charAt(i).toUpperCase() + str.slice(i + 1)
			);
		}
	}
	return str;
}

/**
 * Parses input from user, expecting chapter and verses
 * @param userInput
 * @param verbose Whether or not user should be notified if the link is incorrect
 */
export function parseUserVerseInput(userInput: string, verbose = true) {
	let bookAndChapter;
	let beginVerse;
	let endVerse;

	switch (true) {
		case oneVerseRegEx.test(userInput): {
			// one verse
			const [, matchedChapter, matchedVerse] =
				userInput.match(oneVerseRegEx);
			bookAndChapter = matchedChapter;
			beginVerse = Number(matchedVerse);
			endVerse = Number(matchedVerse);
			break;
		}
		case multipleVersesRegEx.test(userInput): {
			// multiple verses, one chapter
			const [, matchedChapter, matchedBeginVerse, matchedEndVerse] =
				userInput.match(multipleVersesRegEx);
			bookAndChapter = matchedChapter;
			beginVerse = Number(matchedBeginVerse);
			endVerse = Number(matchedEndVerse);
			break;
		}
		default: {
			if (verbose) {
				new Notice(`Wrong format "${userInput}"`);
			}
			throw "Could not parse user input";
		}
	}

	return { bookAndChapter, beginVerse, endVerse };
}

/**
 * Parses input from user, expecting multiple chapters
 * @param userInput
 */
export function parseUserBookInput(userInput: string) {
	let book;
	let firstChapter;
	let lastChapter;

	switch (true) {
		case multipleChaptersRegEx.test(userInput): {
			// one verse
			const [, matchedBook, matchedFirstChapter, matchedLastChapter] =
				userInput.match(multipleChaptersRegEx);
			book = matchedBook.trim();
			firstChapter = Number(matchedFirstChapter);
			lastChapter = Number(matchedLastChapter);
			break;
		}
		default: {
			new Notice(`Wrong format "${userInput}"`);
			throw "Could not parse user input";
		}
	}

	return { book, firstChapter, lastChapter };
}

/**
 * Tries to get tFile corresponding to given filename. If the file is not found, filename is converted to match Obsidian
 * Bible Study Kit naming convention and the operation is repeated.
 * @param app
 * @param filename Name of file that should be searched
 * @param path Path where the search should occure
 * @param settings Plugin settings
 */
export function getFileByFilename(app: App, filename: string, path: string, settings: PluginSettings) {
	path = path ?? "/";
	let filenameCopy = filename;
	filenameCopy = tryUsingInputBookMap(filenameCopy, settings);
	let tFile = app.metadataCache.getFirstLinkpathDest(filenameCopy, path);
	if (!tFile) {
		// handle "Bible study kit" file naming, eg. Gen-01 instead of Gen 1
		filenameCopy = tryConvertToOBSKFileName(filenameCopy, settings);
		tFile = app.metadataCache.getFirstLinkpathDest(filenameCopy, path);
	}
	return { fileName: filenameCopy, tFile };
}

/**
 * Tries to convert file name to Obsidian Study Kit file name
 * @param bookAndChapter File name that should be converted
 * @param settings Plugin's settings
 * @returns file name in Obsidain Study Kit naming system
 */
export function tryConvertToOBSKFileName(bookAndChapter: string, settings: PluginSettings) {
	if (bookAndChapterRegEx.test(bookAndChapter)) {
		// Valid chapter name
		// eslint-disable-next-line prefer-const
		let [, book, chapter] = bookAndChapter.match(bookAndChapterRegEx);
		if (chapter.length == 1) {
			chapter = `0${chapter}`;
		}
		const convertedBook = settings.inputBookMap[book.toLowerCase()] ?? book;
		return `${convertedBook}-${chapter}`;
	}
	return bookAndChapter;
}
/**
 * Tries to convert file name using Input map
 * @param bookAndChapter File name that should be converted
 * @param settings Plugin's settings
 * @returns file name in Obsidain Study Kit naming system
 */
export function tryUsingInputBookMap(bookAndChapter: string, settings: PluginSettings) {
	if (bookAndChapterRegEx.test(bookAndChapter)) {
		// Valid chapter name
		// eslint-disable-next-line prefer-const
		let [, book, chapter] = bookAndChapter.match(bookAndChapterRegEx);
		const convertedBook = settings.inputBookMap[book.toLowerCase()] ?? book;
		return `${convertedBook} ${chapter}`;
	}
	return bookAndChapter;
}
