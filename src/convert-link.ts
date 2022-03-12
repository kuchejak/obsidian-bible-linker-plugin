import { App, HeadingCache, Notice, TFile } from "obsidian";
import { bookAndChapterRegexForOBSK, multipleVersesRegEx, oneVerseRegEx } from "./link-regexes";
import { PluginSettings } from "./main";


/**
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
 * Converts biblical link to quotation of given verse 
 * @param app App instance
 * @param userInput User Input (link to verse)
 * @returns String with quote of linked verses. If converting was not successfull, returns empty string.
 */
export default async function getTextOfVerses(app: App, userInput: string, settings: PluginSettings): Promise<string> {
        let bookAndChapter: string;
        let fileName: string;
        let beginVerse: number; 
        let endVerse: number;

        // Parse user input
        switch (true) {
            case oneVerseRegEx.test(userInput): { // one verse
                const [_, matchedChapter, matchedVerse] = userInput.match(oneVerseRegEx) 
                bookAndChapter = matchedChapter;
                beginVerse = Number(matchedVerse);
                endVerse = Number(matchedVerse);
                break;
            }
            case multipleVersesRegEx.test(userInput): { // multiple verses, one chapter
                const [_, matchedChapter, matchedBeginVerse, matchedEndVerse] = userInput.match(multipleVersesRegEx)
                bookAndChapter = matchedChapter;
                beginVerse = Number(matchedBeginVerse);
                endVerse = Number(matchedEndVerse);
                break;
            }
            default: {
                new Notice(`Wrong format "${userInput}"`);
                return "";
            }
        }

        bookAndChapter = capitalize(bookAndChapter) // For output consistency
        fileName = bookAndChapter; 
        let tFile = app.metadataCache.getFirstLinkpathDest(fileName, "/")
        if (!tFile) { // handle "Bible study kit" file naming, eg. Gen-01 instead of Gen 1
            fileName = tryConvertToOBSKFileName(fileName);
            tFile = app.metadataCache.getFirstLinkpathDest(fileName, "/");
        }
        if (tFile) {
            return await createLinkOutput(app, tFile, bookAndChapter, fileName, beginVerse, endVerse, settings);
        }
        else {
            new Notice(`File ${bookAndChapter} not found`);
            return "";
        }
} 

/**
 * Returns text of given verse using given headings and lines.
 * @param verseNumber Number of desired verse.
 * @param headings List of headings that should be searched. Second heading must correspond to first verse, third heading to second verse and so on. 
 * @param lines Lines of file from which verse text should be taken.
 * @returns Text of given verse.
 */
function getVerseText(verseNumber: number, headings: HeadingCache[], lines: string[], settings: PluginSettings) {
        verseNumber = verseNumber + settings.verseOffset 
        if (verseNumber >= headings.length) return "" // out of range
        const headingLine = headings[verseNumber].position.start.line;
        if (headingLine + 1 >= lines.length) return "" // out of range
        return lines[headingLine + 1] 
}

/**
 * Tries to convert file name to Obsidian Study Kit file name
 * @param bookAndChapter File name that should be converted 
 * @returns file name in Obsidain Study Kit naming system 
 */
function tryConvertToOBSKFileName(bookAndChapter: string) {
    if (bookAndChapterRegexForOBSK.test(bookAndChapter)) { // Valid chapter name
        let [_, book, number] = bookAndChapter.match(bookAndChapterRegexForOBSK);
        if (number.length == 1) {
            number = `0${number}`
        }
        return `${book}-${number}`
    }
}

async function createLinkOutput(app: App, tFile: TFile, userChapterInput: string, fileName: string, beginVerse: number, endVerse: number, settings: PluginSettings) {
    const file = app.vault.read(tFile)
    const lines = (await file).split(/\r?\n/g)
    const headings = app.metadataCache.getFileCache(tFile).headings;

    if (beginVerse > endVerse) {
        new Notice("Begin verse is bigger than end verse")
        return ""
    }
    if (headings.length <= beginVerse) {
        new Notice("Begin verse out of range of chapter")
        return ""
    }

    // 1 - Link to verses
    let res = settings.prefix;
    if (beginVerse === endVerse) {
        res += `[[${fileName}#${headings[beginVerse].heading}|${userChapterInput}.${beginVerse}]] ` // [[Gen 1#1|Gen 1,1.1]]
    }
    else if (settings.linkEndVerse) {
        res += `[[${fileName}#${headings[beginVerse].heading}|${userChapterInput},${beginVerse}-]]` // [[Gen 1#1|Gen 1,1-]]
        res += `[[${fileName}#${headings[endVerse].heading}|${endVerse}]] `; // [[Gen 1#3|3]]
    }
    else {
        res += `[[${fileName}#${headings[beginVerse].heading}|${userChapterInput},${beginVerse}-${endVerse}]] ` // [[Gen 1#1|Gen 1,1-3]]
    }

    // 2 - Text of verses
    for (let i = beginVerse; i <= endVerse; i++) {
        const verseText = getVerseText(i, headings, lines, settings);
        if (verseText == "") {
            new Notice("Verse text not found - invalid link or wrong file format")
            return ""
        } 
        res += verseText + " ";
    }

    // 3 - Invisible links
    if (beginVerse == endVerse || !settings.useInvisibleLinks) return res; // No need to add another link, when only one verse is being linked
    for (let i = beginVerse; i <= endVerse; i++) {
        res += `[[${fileName}#${headings[i].heading}|]]`
    }
    return res;
}