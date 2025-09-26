const superscriptMap: Record<string, string> = {
	"0": "⁰",
	"1": "¹",
	"2": "²",
	"3": "³",
	"4": "⁴",
	"5": "⁵",
	"6": "⁶",
	"7": "⁷",
	"8": "⁸",
	"9": "⁹",
};

/**
 * Replaces all numbers in the given string with their corresponding unicode superscript version
 */
export function numbersToSuperscript(value: string): string {
	let result = "";
	for (const char of value) {
		result += superscriptMap[char] ?? char;
	}
	return result;
}

