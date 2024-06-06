/*
* Regexes for verse parsing
*/

// Link to one verse, for example "Gen 1.1" or "Gen 1:1"
export const oneVerseRegEx = new RegExp(/([^,:#]+)[,#.:;]\s*(\d+)\s*$/);

// Link to multiple verses, for example "Gen 1,1-5"
export const multipleVersesRegEx = new RegExp(/([^,:#]+)[,#.:;]\s*(\d+)\s*[-.=]\s*(\d+)\s*$/);

// Book and chapter string
export const bookAndChapterRegEx = /([^,:#]*\S)[-|\s]+(\d+)/

// Multiple chapters, for example "Gen 1-3"
export const multipleChaptersRegEx = /(\d*[^\d,:#]+)\s*(\d+)\s*-\s*(\d+)\s*$/

// Can be used to determine whether given name of file is from OBSK (for example Gen-01)
export const isOBSKFileRegEx = /([A-zÀ-ž0-9 ]+)-(\d{2,3})/

// Escapes given string so that it can be safely used in regular expression
export function escapeForRegex(string: string) {
	return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}
