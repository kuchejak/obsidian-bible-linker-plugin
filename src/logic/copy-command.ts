import { App, HeadingCache, Notice, TFile } from "obsidian";
import { PluginSettings } from "../main";
import {bookAndChapterRegEx, escapeForRegex, isOBSKFileRegEx} from "../utils/regexes";
import { capitalize, getFileByFilename as getTFileByFilename, parseUserVerseInput } from "./common";

/**
 * Converts biblical reference to text of given verses
 * @param app App instance
 * @param userInput User Input (link to verse)
 * @param settings Plugin settings
 * @param translationPath Path to translation that should be used
 * @param linkOnly Whether to insert output only link or also include text
 * @param verbose Whether or not user should be notified if the link is incorrect
 * @returns String with quote of linked verses. If converting was not successful, returns empty string.
 * @verbose Determines if Notices will be shown or not
 */
export async function getTextOfVerses(app: App, userInput: string, settings: PluginSettings, translationPath: string, linkOnly: boolean, verbose = true): Promise<string> {

    // eslint-disable-next-line prefer-const
    let { bookAndChapter, beginVerse, endVerse } = parseUserVerseInput(userInput, verbose);
    bookAndChapter = capitalize(bookAndChapter) // For output consistency
    const { fileName, tFile } = getTFileByFilename(app, bookAndChapter, translationPath, settings);
    if (tFile) {
        return await createCopyOutput(app, tFile, fileName, beginVerse, endVerse, settings, translationPath, linkOnly, verbose);
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
        if (/^#/.test(line) || (!line && !isFirst)) {
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
 * Replaces the given book with its display value defined in the settings. If no mapping exists, the original value is returned.
 * @param book Book that should be replaced
 * @param settings Plugin's settings
 */
function getDisplayBookName(book: string, settings: PluginSettings) {
	return settings.outputBookMap[book.toLowerCase()] ?? book;
}

/**
 * Takes orginal filename and converts it to human-readable version if Bible study kit is used (removes "-" and leading zeros)
 */
function createBookAndChapterOutput(fileBasename: string, settings: PluginSettings) {
	const isOBSK = isOBSKFileRegEx.test(fileBasename);
	const regex = isOBSK ? isOBSKFileRegEx : bookAndChapterRegEx;

	// eslint-disable-next-line prefer-const
	let [, book, chapter] = fileBasename.match(regex);
	if (isOBSK && chapter.toString()[0] === "0") { // remove leading zeros in OBSK chapters (eg. Gen-01)
		chapter = chapter.substring(1);
	}
	return getDisplayBookName(book, settings) + " " + chapter;
}

/**
 * Returns path to folder in which given file is located for main translation
 */
function getFileFolderInTranslation(app: App, filename: string, translation: string, settings: PluginSettings) {
    const tFileInfo = getTFileByFilename(app, filename, translation, settings);
    return tFileInfo.tFile.parent.path;
}

async function createCopyOutput(app: App, tFile: TFile, fileName: string, beginVerse: number, endVerse: number, settings: PluginSettings, translationPath: string, linkOnly: boolean, verbose: boolean) {
	console.log(`118 b:${beginVerse} e:${endVerse}`)
    const bookAndChapterOutput = createBookAndChapterOutput(tFile.basename, settings);
	console.log(`119 b:${beginVerse} e:${endVerse}`)
    const file = app.vault.read(tFile)
	console.log(`120 b:${beginVerse} e:${endVerse}`)
    const lines = (await file).split(/\r?\n/)
	console.log(`121 b:${beginVerse} e:${endVerse}`)
    const verseHeadingLevel = settings.verseHeadingLevel
	console.log(`122 b:${beginVerse} e:${endVerse}`)
    const headings = app.metadataCache.getFileCache(tFile).headings.filter(heading => !verseHeadingLevel || heading.level === verseHeadingLevel)
	console.log(`123 b:${beginVerse} e:${endVerse}`)
    const beginVerseNoOffset = beginVerse
	console.log(`124 b:${beginVerse} e:${endVerse}`)
    beginVerse += settings.verseOffset
	console.log(`125 b:${beginVerse} e:${endVerse}`)
    endVerse += settings.verseOffset
	console.log(`126 b:${beginVerse} e:${endVerse}`)
	const nrOfVerses = headings.length - 1;
	console.log(`127 b:${beginVerse} e:${endVerse}`)
	const maxVerse = endVerse < nrOfVerses ? endVerse : nrOfVerses; // if endverse is bigger than chapter allows, it is lowered to maximum
	console.log(`128 b:${beginVerse} e:${endVerse}`)
    const maxVerseNoOffset = maxVerse - settings.verseOffset;
	console.log(`129 b:${beginVerse} e:${endVerse}`)


    if (beginVerse > maxVerse) {
        if (verbose) {
            new Notice("Begin verse is bigger than end verse or chapter maximum")
        }
        throw "Begin verse is bigger than end verse or chapter maximum"
    }



    // 1 - Link to verses
    let postfix = "", res = "", pathToUse = "";
    if (!linkOnly) {
        res = settings.prefix;
        postfix = settings.postfix ? replaceNewline(settings.postfix) : " ";
    }
    if (settings.enableMultipleTranslations) {
        if (settings.translationLinkingType !== "main") // link the translation that is currently being used
            pathToUse = getFileFolderInTranslation(app, fileName, translationPath, settings);
        else { // link main translation
            pathToUse = getFileFolderInTranslation(app, fileName, settings.parsedTranslationPaths.first(), settings);
        }
    }

	if (settings.newLines && !linkOnly) {
		res += `${settings.firstLinePrefix}`
	}

    if (beginVerse === maxVerse) {
        res += `[[${pathToUse ? pathToUse + "/" : ""}${fileName}#${headings[beginVerse].heading}|${bookAndChapterOutput}${settings.oneVerseNotation}${beginVerseNoOffset}]]${postfix}` // [[Gen 1#1|Gen 1,1.1]]
    } else if (settings.linkEndVerse) {
        res += `[[${pathToUse ? pathToUse + "/" : ""}${fileName}#${headings[beginVerse].heading}|${bookAndChapterOutput}${settings.multipleVersesNotation}${beginVerseNoOffset}-]]` // [[Gen 1#1|Gen 1,1-]]
        res += `[[${pathToUse ? pathToUse + "/" : ""}${fileName}#${headings[maxVerse].heading}|${maxVerseNoOffset}]]${postfix}`; // [[Gen 1#3|3]]
    } else {
        res += `[[${pathToUse ? pathToUse + "/" : ""}${fileName}#${headings[beginVerse].heading}|${bookAndChapterOutput}${settings.multipleVersesNotation}${beginVerseNoOffset}-${maxVerseNoOffset}]]${postfix}` // [[Gen 1#1|Gen 1,1-3]]
    }

    // 2 - Text of verses
    if (!linkOnly) {
        for (let i = beginVerse; i <= maxVerse; i++) {
            let versePrefix = "";
            const versePostfix = settings.insertSpace ? " " : "";
            if (settings.eachVersePrefix) {
                versePrefix += settings.eachVersePrefix.replace(/{n}/g, (i - settings.verseOffset).toString());
                versePrefix = versePrefix.replace(/{f}/g, `${fileName}`);
            }
            let verseText = getVerseText(i, headings, lines, settings.newLines, settings.prefix);

			if (settings.commentStart !== "" && settings.commentEnd !== "") {
				const escapedStart = escapeForRegex(settings.commentStart);
				const escapedEnd = escapeForRegex(settings.commentEnd);
				const replaceRegex = new RegExp(`${escapedStart}.*?${escapedEnd}`, 'gs');
				verseText = verseText.replace(replaceRegex, '');
			}
            if (settings.newLines) {
                res += "\n" + settings.prefix + versePrefix + verseText;
            } else {
                res += versePrefix + verseText + versePostfix;
            }
        }
    }

    // 3 - Invisible links
    if (!settings.useInvisibleLinks) return res;
    if ((beginVerse == maxVerse || (settings.linkEndVerse && beginVerse == maxVerse - 1)) // No need to add another link, when only one verse is being linked
        && (!settings.enableMultipleTranslations
            || settings.translationLinkingType === "main"
            || settings.translationLinkingType === "used")) // Only linking one translation - already linked 
        return res;

    if (settings.newLines && !linkOnly) {
        res += `\n${settings.prefix}`;
    }

    const lastVerseToLink = settings.linkEndVerse ? maxVerse - 1 : maxVerse;
    for (let i = beginVerse + 1; i <= lastVerseToLink; i++) { // beginVerse + 1 because link to first verse is already inserted before the text
        if (!settings.enableMultipleTranslations) {
            res += `[[${fileName}#${headings[i].heading}|]]`
        }
        else { // multiple translations 
            let translationPathsToUse: string[] = [];
            switch (settings.translationLinkingType) {
                case "all":
                    translationPathsToUse = settings.parsedTranslationPaths.map((tr) => getFileFolderInTranslation(app, fileName, tr, settings))
                    break;
                case "used":
                    translationPathsToUse = [getFileFolderInTranslation(app, fileName, translationPath, settings)]
                    break;
                case "usedAndMain":
                    if (translationPath !== settings.parsedTranslationPaths.first()) {
                        translationPathsToUse = [getFileFolderInTranslation(app, fileName, translationPath, settings),
                        getFileFolderInTranslation(app, fileName, settings.parsedTranslationPaths.first(), settings)];
                    }
                    else {
                        translationPathsToUse = [getFileFolderInTranslation(app, fileName, translationPath, settings)];
                    }
                    break;
                case "main":
                    translationPathsToUse = [getFileFolderInTranslation(app, fileName, settings.parsedTranslationPaths.first(), settings)];
                    break;
                default:
                    break;
            }
            translationPathsToUse.forEach((translationPath) => {
                res += `[[${translationPath}/${fileName}#${headings[i].heading}|]]`
            })
        }

    }
    return res;
}
