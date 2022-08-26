import { App, HeadingCache, Notice, TFile } from "obsidian";
import { bookAndChapterRegexForOBSK, multipleChapters, multipleVersesRegEx, oneVerseRegEx } from "./regexes";
import { PluginSettings } from "../main";
import { LinkType } from "src/modals/link-verse-modal";





/**
 * Converts biblical reference to links to given verses or books 
 * @param app App instance
 * @param userInput User Input (link to verse)
 * @param linkType Type of link that should be used
 * @param useNewLine Whether or not should each link be on new line
 * @returns String with quote of linked verses. If converting was not successful, returns empty string.
 */
export async function getLinks(app: App, userInput: string, linkType: LinkType, useNewLine: boolean, settings: PluginSettings) {
    if (multipleChapters.test(userInput)) {
        return getLinksForBooks(app, userInput, linkType, useNewLine, settings);
    }
    else {
        return getLinksForVerses(app, userInput, linkType, useNewLine, settings);
    }


}

async function getLinksForVerses(app: App, userInput: string, linkType: LinkType, useNewLine: boolean, settings: PluginSettings) {
    // eslint-disable-next-line prefer-const
    let { bookAndChapter, beginVerse, endVerse } = parseUserVerseInput(userInput);
    bookAndChapter = capitalize(bookAndChapter) // For output consistency
    if (settings.verifyFilesWhenLinking) {
        const {fileName, tFile} = getFileFromBookAndChapter(app, bookAndChapter);
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

async function getLinksForBooks(app: App, userInput: string, linkType: LinkType, useNewLine: boolean, settings: PluginSettings) {
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



/**
 * Converts biblical reference to text of given verses
 * @param app App instance
 * @param userInput User Input (link to verse)
 * @returns String with quote of linked verses. If converting was not successful, returns empty string.
 */
export async function getTextOfVerses(app: App, userInput: string, settings: PluginSettings): Promise<string> {

        // eslint-disable-next-line prefer-const
        let {bookAndChapter, beginVerse, endVerse} = parseUserVerseInput(userInput);
        bookAndChapter = capitalize(bookAndChapter) // For output consistency
        const {fileName, tFile} = getFileFromBookAndChapter(app, bookAndChapter);
        if (tFile) {
            return await createCopyOutput(app, tFile, bookAndChapter, fileName, beginVerse, endVerse, settings);
        }
        else {
            new Notice(`File ${bookAndChapter} not found`);
            throw "File not found"
        }
} 

function getFileFromBookAndChapter(app: App, bookAndChapter: string){
        let fileName = bookAndChapter; 
        let tFile = app.metadataCache.getFirstLinkpathDest(fileName, "/")
        if (!tFile) { // handle "Bible study kit" file naming, eg. Gen-01 instead of Gen 1
            fileName = tryConvertToOBSKFileName(fileName);
            tFile = app.metadataCache.getFirstLinkpathDest(fileName, "/");
        }
        return {fileName, tFile};
}

/**
 * Parses input from user, expecting chapter and verses
 * @param userInput 
 */
function parseUserVerseInput(userInput: string) {
        let bookAndChapter;
        let beginVerse;
        let endVerse;

        switch (true) {
            case oneVerseRegEx.test(userInput): { // one verse
                const [, matchedChapter, matchedVerse] = userInput.match(oneVerseRegEx) 
                bookAndChapter = matchedChapter;
                beginVerse = Number(matchedVerse);
                endVerse = Number(matchedVerse);
                break;
            }
            case multipleVersesRegEx.test(userInput): { // multiple verses, one chapter
                const [, matchedChapter, matchedBeginVerse, matchedEndVerse] = userInput.match(multipleVersesRegEx)
                bookAndChapter = matchedChapter;
                beginVerse = Number(matchedBeginVerse);
                endVerse = Number(matchedEndVerse);
                break;
            }
            default: {
                new Notice(`Wrong format "${userInput}"`);
                throw "Could not parse user input"
            }
        }

        return {bookAndChapter, beginVerse, endVerse}
}

/**
 * Parses input from user, expecting multiple chapters 
 * @param userInput 
 */
function parseUserBookInput(userInput: string) {
        let book;
        let firstChapter;
        let lastChapter;

        switch (true) {
            case multipleChapters.test(userInput): { // one verse
                const [, matchedBook, matchedFirstChapter, matchedLastChapter] = userInput.match(multipleChapters) 
                book = matchedBook.trim();
                firstChapter = Number(matchedFirstChapter);
                lastChapter = Number(matchedLastChapter);
                break;
            }
            default: {
                new Notice(`Wrong format "${userInput}"`);
                throw "Could not parse user input"
            }
        }

        return {book, firstChapter, lastChapter}
}

/*
 * Capitalizes given string (skips leading whitespaces and numbers)
 */
function capitalize(str: string) {
    str = str.toLocaleLowerCase();
    for (let i = 0; i < str.length; i++) {
        if (/[^\s\d.,#-]/.test(str.charAt(i))) {
            return str.slice(0, i) + str.charAt(i).toUpperCase() + str.slice(i + 1);
        }
    }
    return str;
}

/**
 * Returns text of given verse using given headings and lines.
 * @param verseNumber Number of desired verse.
 * @param headings List of headings that should be searched. Second heading must correspond to first verse, third heading to second verse and so on. 
 * @param lines Lines of file from which verse text should be taken.
 * @param keepNewlines If set to true, text will contain newlines if present in source, if set to false, newlines will be changed to spaces
 * @param newLinePrefix Prefix for each line of verse, if verse is multiline and keepNewLines = true
 * @returns Text of given verse.
 */
function getVerseText(verseNumber: number, headings: HeadingCache[], lines: string[], keepNewlines: boolean, newLinePrefix: string) {
    if (verseNumber >= headings.length) { // out of range
        new Notice("Verse out of range for given file")
        throw `VerseNumber ${verseNumber} is out of range of headings with length ${headings.length}`
    } 

    const headingLine = headings[verseNumber].position.start.line;
    if (headingLine + 1 >= lines.length) { // out of range
        new Notice("Logical error - please create issue on plugin's GitHub with your input and the file you were referencing. Thank you!")
        throw `HeadingLine ${headingLine + 1} is out of range of lines with length ${lines}`
    }

    // This part is necessary for verses that span over multiple lines
    let output = "";
    let line = "";
    let i = 1; 
    let isFirst = true;

    // eslint-disable-next-line no-constant-condition
    while(true) {
        line = lines[headingLine + i]; // get next line
        if (/#/.test(line) || (!line && !isFirst)) {
            break; // heading line (next verse) or empty line after verse => do not continue
        }
        i++;
        if (line) { // if line has content (is not empty string)
            if (!isFirst) { // If it is not first line of the verse, add divider
                output += keepNewlines ? `\n${newLinePrefix}` : " ";
            }
            isFirst = false;
            output += line;
        }
    } 
    return output;
}

/**
 * Tries to convert file name to Obsidian Study Kit file name
 * @param bookAndChapter File name that should be converted 
 * @returns file name in Obsidain Study Kit naming system 
 */
function tryConvertToOBSKFileName(bookAndChapter: string) {
    if (bookAndChapterRegexForOBSK.test(bookAndChapter)) { // Valid chapter name
        // eslint-disable-next-line prefer-const
        let [, book, number] = bookAndChapter.match(bookAndChapterRegexForOBSK);
        if (number.length == 1) {
            number = `0${number}`
        }
        return `${book}-${number}`
    }
}

/**
 * Replaces "\n" with newline character in given string (when user inputs "\n" in the settings it is automatically converted to "\\n" and does not work as newline)
 */
function replaceNewline(input: string) {
    return input.replace(/\\n/g, "\n", );
}

async function createCopyOutput(app: App, tFile: TFile, userChapterInput: string, fileName: string, beginVerse: number, endVerse: number, settings: PluginSettings) {
    const file = app.vault.read(tFile)
    const lines = (await file).split(/\r?\n/)
	const verseHeadingLevel = settings.verseHeadingLevel
    const headings = app.metadataCache.getFileCache(tFile).headings.filter(heading => !verseHeadingLevel || heading.level === verseHeadingLevel)
    const beginVerseNoOffset = beginVerse
    const endVerseNoOffset = endVerse
    beginVerse += settings.verseOffset
    endVerse += settings.verseOffset


    if (beginVerse > endVerse) {
        new Notice("Begin verse is bigger than end verse")
        throw "Begin verse is bigger than end verse"
    }
    if (headings.length <= beginVerse) {
        new Notice("Begin verse out of range of chapter")
        throw "Begin verse out of range of chapter"
    }

    // 1 - Link to verses
    let res = settings.prefix;
	const postfix = settings.postfix ? replaceNewline(settings.postfix) : " ";

    if (beginVerse === endVerse) {
        res += `[[${fileName}#${headings[beginVerse].heading}|${userChapterInput}${settings.oneVerseNotation}${beginVerseNoOffset}]]${postfix}` // [[Gen 1#1|Gen 1,1.1]]
    }
    else if (settings.linkEndVerse) {
        res += `[[${fileName}#${headings[beginVerse].heading}|${userChapterInput}${settings.multipleVersesNotation}${beginVerseNoOffset}-]]` // [[Gen 1#1|Gen 1,1-]]
        res += `[[${fileName}#${headings[endVerse].heading}|${endVerseNoOffset}]]${postfix}`; // [[Gen 1#3|3]]
    }
    else {
        res += `[[${fileName}#${headings[beginVerse].heading}|${userChapterInput}${settings.multipleVersesNotation}${beginVerseNoOffset}-${endVerseNoOffset}]]${postfix}` // [[Gen 1#1|Gen 1,1-3]]
    }

    // 2 - Text of verses
    for (let i = beginVerse; i <= endVerse; i++) {
        let versePrefix = "";
        if (settings.eachVersePrefix) {
            versePrefix += settings.eachVersePrefix.replace("{n}", (i - settings.verseOffset).toString());
            versePrefix = versePrefix.replace("{f}", `${fileName}`);
        }
        const verseText = getVerseText(i, headings, lines, settings.newLines, settings.prefix);
		if (settings.newLines) {
			res += "\n" + settings.prefix + versePrefix + verseText;
		} 
        else {
			res += versePrefix + verseText + " ";
		}
    }

    // 3 - Invisible links
    if (beginVerse == endVerse || !settings.useInvisibleLinks) return res; // No need to add another link, when only one verse is being linked
    if (settings.newLines) {
        res += `\n${settings.prefix}`;
    }
    for (let i = beginVerse; i <= endVerse; i++) {
        res += `[[${fileName}#${headings[i].heading}|]]`
    }
    return res;
}
