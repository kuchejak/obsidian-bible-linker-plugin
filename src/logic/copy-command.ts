import { App, HeadingCache, Notice, TFile } from "obsidian";
import { PluginSettings } from "../main";
import { isOBSKFile } from "../utils/regexes";
import { capitalize, getFileByFilename, parseUserVerseInput } from "./common";

/**
 * Converts biblical reference to text of given verses
 * @param app App instance
 * @param userInput User Input (link to verse)
 * @returns String with quote of linked verses. If converting was not successful, returns empty string.
 * @verbose Determines if Notices will be shown or not
 */
export async function getTextOfVerses(app: App, userInput: string, settings: PluginSettings, translationPath: string, verbose = true,): Promise<string> {

    // eslint-disable-next-line prefer-const
    let { bookAndChapter, beginVerse, endVerse } = parseUserVerseInput(userInput, verbose);
    bookAndChapter = capitalize(bookAndChapter) // For output consistency
    const { fileName, tFile } = getFileByFilename(app, bookAndChapter, translationPath);
    if (tFile) {
        return await createCopyOutput(app, tFile, fileName, beginVerse, endVerse, settings, tFile.parent.path + "/", verbose);
    } else {
        if (verbose) {
            new Notice(`File ${bookAndChapter} not found`);
        }
        throw "File not found"
    }
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
    while (true) {
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
 * Replaces "\n" with newline character in given string (when user inputs "\n" in the settings it is automatically converted to "\\n" and does not work as newline)
 */
function replaceNewline(input: string) {
    return input.replace(/\\n/g, "\n",);
}

/**
 * Takes orginal filename and converts it to human-readable version if Bible study kit is used (removes "-" and leading zeros)
 */
function createBookAndChapterOutput(fileBasename: string) {
    if (isOBSKFile.test(fileBasename)) {
        // eslint-disable-next-line prefer-const
        let [, filename, chapter] = fileBasename.match(isOBSKFile);
        if (chapter.toString()[0] === "0") {
            chapter = chapter.substring(1);
        }
        return filename + " " + chapter;
    }
    return fileBasename;
}


async function createCopyOutput(app: App, tFile: TFile, fileName: string, beginVerse: number, endVerse: number, settings: PluginSettings, translationPath: string, verbose: boolean) {
    const bookAndChapterOutput = createBookAndChapterOutput(tFile.basename);
    const file = app.vault.read(tFile)
    const lines = (await file).split(/\r?\n/)
    const verseHeadingLevel = settings.verseHeadingLevel
    const headings = app.metadataCache.getFileCache(tFile).headings.filter(heading => !verseHeadingLevel || heading.level === verseHeadingLevel)
    const beginVerseNoOffset = beginVerse
    const endVerseNoOffset = endVerse
    beginVerse += settings.verseOffset
    endVerse += settings.verseOffset


    if (beginVerse > endVerse) {
        if (verbose) {
            new Notice("Begin verse is bigger than end verse")
        }
        throw "Begin verse is bigger than end verse"
    }
    if (headings.length <= beginVerse) {
        if (verbose) {
            new Notice("Begin verse out of range of chapter")
        }
        throw "Begin verse out of range of chapter"
    }

    // 1 - Link to verses
    let res = settings.prefix;
    const postfix = settings.postfix ? replaceNewline(settings.postfix) : " ";
    const pathToUse = settings.enableMultipleTranslations ? translationPath : "";

    if (beginVerse === endVerse) {
        res += `[[${pathToUse}${fileName}#${headings[beginVerse].heading}|${bookAndChapterOutput}${settings.oneVerseNotation}${beginVerseNoOffset}]]${postfix}` // [[Gen 1#1|Gen 1,1.1]]
    } else if (settings.linkEndVerse) {
        res += `[[${pathToUse}${fileName}#${headings[beginVerse].heading}|${bookAndChapterOutput}${settings.multipleVersesNotation}${beginVerseNoOffset}-]]` // [[Gen 1#1|Gen 1,1-]]
        res += `[[${pathToUse}${fileName}#${headings[endVerse].heading}|${endVerseNoOffset}]]${postfix}`; // [[Gen 1#3|3]]
    } else {
        res += `[[${pathToUse}${fileName}#${headings[beginVerse].heading}|${bookAndChapterOutput}${settings.multipleVersesNotation}${beginVerseNoOffset}-${endVerseNoOffset}]]${postfix}` // [[Gen 1#1|Gen 1,1-3]]
    }

    // 2 - Text of verses
    for (let i = beginVerse; i <= endVerse; i++) {
        let versePrefix = "";
        const versePostfix = settings.insertSpace ? " " : "";
        if (settings.eachVersePrefix) {
            versePrefix += settings.eachVersePrefix.replace(/{n}/g, (i - settings.verseOffset).toString());
            versePrefix = versePrefix.replace(/{f}/g, `${fileName}`);
        }
        const verseText = getVerseText(i, headings, lines, settings.newLines, settings.prefix);
        if (settings.newLines) {
            res += "\n" + settings.prefix + versePrefix + verseText;
        } else {
            res += versePrefix + verseText + versePostfix;
        }
    }

    // 3 - Invisible links
    if (beginVerse == endVerse || !settings.useInvisibleLinks) return res; // No need to add another link, when only one verse is being linked
    if (settings.newLines) {
        res += `\n${settings.prefix}`;
    }
    for (let i = beginVerse; i <= endVerse; i++) {
        res += `[[${pathToUse}${fileName}#${headings[i].heading}|]]`
    }
    return res;
}
