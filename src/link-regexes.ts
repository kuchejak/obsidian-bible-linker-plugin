/*
* Regexes for verse parsing
*/

// Link to one verse, for example "Gen 1.1" or "Gen 1:1"
export const oneVerseRegEx = new RegExp(/([a-zA-Z0-9]+\s*\d+)[,#.:;](\d+)$/);

// Link to multiple verses, for example "Gen 1,1-5"
export const multipleVersesRegEx = new RegExp(/([a-zA-Z0-9]+\s*\d+)[,#.:;](\d+)\s*[-.=]\s*(\d+)$/);

// Book and chapter string (used for converting to bible study kit file names)
export const bookAndChapterRegex = /([a-zA-Z0-9 ]+)\s(\d+)/