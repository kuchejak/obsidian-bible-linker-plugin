/*
 * Capitalizes given string (skips leading whitespaces and numbers)
 */
import {
	bookAndChapterRegexForOBSK,
	multipleChapters,
	multipleVersesRegEx,
	oneVerseRegEx,
} from "../utils/regexes";
import { App, Notice } from "obsidian";

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
		case multipleChapters.test(userInput): {
			// one verse
			const [, matchedBook, matchedFirstChapter, matchedLastChapter] =
				userInput.match(multipleChapters);
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
 */
export function getFileByFilename(app: App, filename: string, path = "/") {
	let filenameCopy = filename;
	let tFile = app.metadataCache.getFirstLinkpathDest(filenameCopy, path);
	if (!tFile) {
		// handle "Bible study kit" file naming, eg. Gen-01 instead of Gen 1
		filenameCopy = tryConvertToOBSKFileName(filenameCopy);
		tFile = app.metadataCache.getFirstLinkpathDest(filenameCopy, path);
	}
	return { fileName: filenameCopy, tFile };
}

/**
 * Tries to convert file name to Obsidian Study Kit file name
 * @param bookAndChapter File name that should be converted
 * @returns file name in Obsidain Study Kit naming system
 */
export function tryConvertToOBSKFileName(bookAndChapter: string) {
	if (bookAndChapterRegexForOBSK.test(bookAndChapter)) {
		// Valid chapter name
		// eslint-disable-next-line prefer-const
		let [, book, number] = bookAndChapter.match(bookAndChapterRegexForOBSK);
		if (number.length == 1) {
			number = `0${number}`;
		}
		return `${book}-${number}`;
	}
}
