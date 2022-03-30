import { App, HeadingCache, Notice, TFile } from "obsidian";
import { bookAndChapterRegexForOBSK, multipleVersesRegEx, oneVerseRegEx } from "./regexes";
import { PluginSettings } from "../main";
import { LinkType } from "src/modals/link-verse-modal";





/**
 * Converts biblical reference to links to given verses 
 * @param app App instance
 * @param userInput User Input (link to verse)
 * @param linkType Type of link that should be used
 * @param useNewLine Whether or not should each link be on new line
 * @returns String with quote of linked verses. If converting was not successful, returns empty string.
 */
export async function getLinksToVerses(app: App, userInput: string, linkType: LinkType, useNewLine: boolean, settings: PluginSettings) {
    // eslint-disable-next-line prefer-const
    let { bookAndChapter, beginVerse, endVerse } = parseUserInput(userInput);
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

/**
 * Converts biblical reference to text of given verses
 * @param app App instance
 * @param userInput User Input (link to verse)
 * @returns String with quote of linked verses. If converting was not successful, returns empty string.
 */
export async function getTextOfVerses(app: App, userInput: string, settings: PluginSettings): Promise<string> {

        // eslint-disable-next-line prefer-const
        let {bookAndChapter, beginVerse, endVerse} = parseUserInput(userInput);
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

function parseUserInput(userInput: string) {
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
 * @returns Text of given verse.
 */
function getVerseText(verseNumber: number, headings: HeadingCache[], lines: string[]) {
        if (verseNumber >= headings.length) { // out of range
            new Notice("Verse out of range for given file")
            throw `VerseNumber ${verseNumber} is out of range of headings with length ${headings.length}`
        } 
        const headingLine = headings[verseNumber].position.start.line;
        if (headingLine + 1 >= lines.length) { // out of range
            new Notice("Logical error - please create issue on plugin's GitHub with your input and the file you were referencing. Thank you!")
            throw `HeadingLine ${headingLine + 1} is out of range of lines with length ${lines}`
        }
        return lines[headingLine + 1] 
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

async function createCopyOutput(app: App, tFile: TFile, userChapterInput: string, fileName: string, beginVerse: number, endVerse: number, settings: PluginSettings) {
    const file = app.vault.read(tFile)
    const lines = (await file).split(/\r?\n/)
    const headings = app.metadataCache.getFileCache(tFile).headings;
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
    if (beginVerse === endVerse) {
        res += `[[${fileName}#${headings[beginVerse].heading}|${userChapterInput}.${beginVerseNoOffset}]] ` // [[Gen 1#1|Gen 1,1.1]]
    }
    else if (settings.linkEndVerse) {
        res += `[[${fileName}#${headings[beginVerse].heading}|${userChapterInput},${beginVerseNoOffset}-]]` // [[Gen 1#1|Gen 1,1-]]
        res += `[[${fileName}#${headings[endVerse].heading}|${endVerseNoOffset}]] `; // [[Gen 1#3|3]]
    }
    else {
        res += `[[${fileName}#${headings[beginVerse].heading}|${userChapterInput},${beginVerseNoOffset}-${endVerseNoOffset}]] ` // [[Gen 1#1|Gen 1,1-3]]
    }

    // 2 - Text of verses
    for (let i = beginVerse; i <= endVerse; i++) {
        const verseText = getVerseText(i, headings, lines);
		if (settings.newLines) {
			res += "\n" + settings.prefix + verseText + " ";
		} 
        else {
			res += verseText + " ";
		}
    }

    // 3 - Invisible links
    if (beginVerse == endVerse || !settings.useInvisibleLinks) return res; // No need to add another link, when only one verse is being linked
    for (let i = beginVerse; i <= endVerse; i++) {
        res += `[[${fileName}#${headings[i].heading}|]]`
    }
    return res;
}
