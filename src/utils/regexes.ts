/*
* Regexes for verse parsing
*/

// Link to one verse, for example "Gen 1.1" or "Gen 1:1"
export const oneVerseRegEx = new RegExp(/([^,:#]+)[,#.:;]\s*(\d+)\s*$/);

// Link to multiple verses, for example "Gen 1,1-5"
export const multipleVersesRegEx = new RegExp(/([^,:#]+)[,#.:;]\s*(\d+)\s*[-.=]\s*(\d+)\s*$/);

// Book and chapter string (used for converting to bible study kit file names)
export const bookAndChapterRegexForOBSK = /([^,:#]+)\s(\d+)/

// Multiple chapters, for example "Gen 1-3"
export const multipleChapters = /(\d*[^\d,:#]+)\s*(\d+)\s*-\s*(\d+)\s*$/
