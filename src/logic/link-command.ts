import {App, Notice} from "obsidian";
import {LinkType} from "../modals/link-verse-modal";
import {PluginSettings} from "../main";
import {multipleChapters} from "../utils/regexes";
import {capitalize, getFileByFilename, parseUserBookInput, parseUserVerseInput} from "./common";

/**
 * Converts biblical reference to links to given verses or books
 * @param app App instance
 * @param userInput User Input (link to verse or chapter)
 * @param linkType Type of link that should be used
 * @param useNewLine Whether or not should each link be on new line
 * @returns String with quote of linked verses. If converting was not successful, returns empty string.
 */
export async function createLinks(app: App, userInput: string, linkType: LinkType, useNewLine: boolean, settings: PluginSettings) {
	if (multipleChapters.test(userInput)) {
		return getLinksForChapters(app, userInput, linkType, useNewLine, settings);
	} else {
		return getLinksForVerses(app, userInput, linkType, useNewLine, settings);
	}
}

/**
 * Creates copy command output when linking multiple verses
 */
async function getLinksForVerses(app: App, userInput: string, linkType: LinkType, useNewLine: boolean, settings: PluginSettings) {
	// eslint-disable-next-line prefer-const
	let {bookAndChapter, beginVerse, endVerse} = parseUserVerseInput(userInput);
	bookAndChapter = capitalize(bookAndChapter) // For output consistency
	if (settings.verifyFilesWhenLinking) {
		const {fileName, tFile} = getFileByFilename(app, bookAndChapter);
		if (!tFile) {
			new Notice(`File "${fileName}" does not exist and verify files is set to true`);
			throw `File ${fileName} does not exist, verify files = true`;
		}
	}

	if (beginVerse > endVerse) {
		new Notice("Begin verse is bigger than end verse")
		throw "Begin verse is bigger than end verse"
	}

	let res = "";
	const beginning = linkType === LinkType.Embedded ? "!" : "";
	const ending = linkType === LinkType.Invisible ? "|" : "";
	for (let i = beginVerse; i <= endVerse; i++) {
		res += `${beginning}[[${bookAndChapter}${settings.linkSeparator}${settings.versePrefix}${i}${ending}]]`
		if (useNewLine) {
			res += '\n'
		}
	}
	return res;
}

/**
 * Creates copy command output when linking multiple chapters
 */
async function getLinksForChapters(app: App, userInput: string, linkType: LinkType, useNewLine: boolean, settings: PluginSettings) {
	const {book, firstChapter, lastChapter} = parseUserBookInput(userInput);
	if (firstChapter > lastChapter) {
		new Notice("Begin chapter is bigger than end chapter")
		throw "Begin chapter is bigger than end chapter"
	}

	let res = "";
	for (let i = firstChapter; i <= lastChapter; i++) {
		res += `[[${book} ${i}]]`
		if (useNewLine) {
			res += '\n'
		}
	}
	return res;
}
