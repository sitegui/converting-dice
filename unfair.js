'use strict'

/**
 * A sequence of unique strings, each one representing one face
 * @typedef {Array<string>} Die
 */

/**
 * @typedef {Object} Toss
 * @prop {Array<string>} faces - sequence of faces
 * @prop {number} id - a numeric representation of faces
 */

/**
 * @typedef {Object} TossRange
 * @prop {Array<Array<string>>} faces
 * @prop {Array<number>} ids - ascending order
 */

/**
 * @typedef {Object} ConversionRule
 * @prop {Die} dieA
 * @prop {Die} dieB
 * @prop {boolean} makeFair - whether this rule guarantees dieB to be fair in the end
 * @prop {number} throws - how many times to toss dieA
 * @prop {Map<TossRange, string|ConversionRule>} conversions - how to convert a toss into an answer or a reduced problem
 * @prop {number} expectation - how many times in average dieA should be tossed, considering the whole process
 */

/**
 * Find the best way to transform dieA into dieB
 * If makeFair is true, we assume dieA isn't necessarily fair, but dieB will be fair
 * Otherwise, dieB will be as fair as dieA
 * @param {Die} dieA
 * @param {Die} dieB
 * @param {boolean} makeFair
 * @returns {ConversionRule}
 */
function getBestConversion(dieA, dieB, makeFair) {
	// Minimum number of toss
	let throws = 1,
		aFaces = dieA.length,
		bFaces = dieB.length,
		totalAFaces = aFaces
	while (totalAFaces < bFaces) {
		totalAFaces *= aFaces
		throws += 1
	}

	// Sometimes, more throws yield better results
	let best = null
	while (true) {
		let conversion = getConversion(dieA, dieB, makeFair, throws)
		if (!best || conversion.expectation < best.expectation) {
			best = conversion
		}

		// Minimum expected value is the number of throws in the first roll
		if (throws + 1 >= best.expectation) {
			break
		}

		throws += 1
	}

	return best
}

/**
 * Find the best way to transform dieA into dieB
 * If makeFair is true, we assume dieA isn't necessarily fair, but dieB will be fair
 * Otherwise, dieB will be as fair as dieA
 * @param {Die} dieA
 * @param {Die} dieB
 * @param {boolean} makeFair
 * @param {number} throws
 * @returns {ConversionRule}
 */
function getConversion(dieA, dieB, makeFair, throws) {
	let conversion = {
		dieA,
		dieB,
		makeFair,
		throws,
		conversions: partitionTosses(generateTosses(dieA, makeFair, throws), dieB),
		expectation: 0
	}

	// Definition:
	// E(a, b) = SUM{size_i / a * (throws + E(a, b_i))} + size_b / a * (throws + E(a, b))
	// Making z = SUM{size_i / a * (throws + E(a, b_i))} and solving for E(a, b):
	// (a * z + size_b * throws) / (a - size_b)

	let z = 0,
		sizeA = Math.pow(dieA.length, throws),
		sizeB = 0
	for (let [range, subDie] of conversion.conversions) {
		let subConversion
		if (subDie.length === dieB.length) {
			// Recursive
			sizeB = range.faces.length
			subConversion = conversion
		} else if (subDie.length === 1) {
			// Simple case
			subConversion = subDie
			z += range.faces.length / sizeA * throws
		} else {
			// Problem reduction
			subConversion = getBestConversion(dieA, subDie, makeFair)
			z += range.faces.length / sizeA * (throws + subConversion.expectation)
		}
		conversion.conversions.set(range, subConversion)
	}

	conversion.expectation = (sizeA * z + sizeB * throws) / (sizeA - sizeB)

	return conversion
}

/**
 * Generate all possible tosses and group them by probability
 * @param {Die} die
 * @param {boolean} assumeUnfair
 * @param {number} throws
 * @returns {Array<TossRange>}
 */
function generateTosses(faces, assumeUnfair, throws) {
	let byChance = new Map,
		n = faces.length,
		idDigits = new Array(throws).fill(0)

	// Find total number of tosses
	let total = 1
	for (let i = 0; i < throws; i++) {
		total *= n
	}

	// Generate all tosses
	for (let id = 0; id < total; id++) {
		let tossFacesArray = idDigits.map(d => faces[d])

		// The probability doesn't depend on the order in which the faces appear in each toss
		// For fair dice, it doesn't even depend on the faces
		let chanceKey = assumeUnfair ? JSON.stringify(tossFacesArray.slice().sort()) : ''

		// Add toss
		let tossRange = byChance.get(chanceKey)
		if (!tossRange) {
			byChance.set(chanceKey, tossRange = {
				faces: [],
				ids: []
			})
		}
		tossRange.faces.push(tossFacesArray)
		tossRange.ids.push(id)

		// Move to next toss
		idDigits[throws - 1] += 1
		for (let j = throws - 1; j >= 0; j--) {
			if (idDigits[j] < n) {
				break
			}

			// Carry digits
			idDigits[j] -= n
			idDigits[j - 1] += 1
		}
	}

	return Array.from(byChance.values())
}

/**
 * Partition tosses grouped by chance in a way to minimize total throws expectation
 * @param {Array<TossRange>} tosses 
 * @param {Die} die
 * @returns {Map<TossRange, Die>} - map from input tosses to new sub-problem
 */
function partitionTosses(tosses, die) {
	let result = new Map

	// Try to allocate as much tosses as possible, starting from bigger divisors
	for (let divisor of getDivisors(die.length)) {
		// Divide original problem (partition into $die) into $divisor new problems of partitioning
		// into $subDie, each one with subLength faces
		let subLength = die.length / divisor,
			subDice = [],
			subRanges = []
		for (let i = 0; i < divisor; i++) {
			subDice.push(die.slice(i * subLength, (i + 1) * subLength))
			subRanges.push({
				faces: [],
				ids: []
			})
		}

		for (let i = 0; i < tosses.length; i++) {
			let uniformRange = tosses[i]

			// How many full sets can be allocated in this group
			let k = Math.floor(uniformRange.faces.length / divisor)
			if (!k) {
				continue
			}

			// Allocate them
			for (let i = 0; i < divisor; i++) {
				for (let j = 0; j < k; j++) {
					subRanges[i].faces.push(uniformRange.faces[i * k + j])
					subRanges[i].ids.push(uniformRange.ids[i * k + j])
				}
			}

			// Remove mapped tosses
			let n = divisor * k
			if (uniformRange.faces.length === n) {
				tosses.splice(i, 1)
				i -= 1
			} else {
				uniformRange.faces.splice(0, n)
				uniformRange.ids.splice(0, n)
			}
		}

		// Add to result
		for (let i = 0; i < subRanges.length; i++) {
			let subRange = subRanges[i]
			if (subRange.faces.length) {
				// Sort by id
				let toss = subRange.faces.map((face, i) => ({
					face,
					id: subRange.ids[i]
				})).sort((a, b) => a.id - b.id)

				result.set({
					faces: toss.map(t => t.face),
					ids: toss.map(t => t.id)
				}, subDice[i])
			}
		}
	}

	return result
}

/**
 * Return the divisors of a number in descending order
 * @param {number} n
 * @returns {Array<number>}
 */
function getDivisors(n) {
	let divisors = []
	for (let i = n; i >= 1; i--) {
		if (n % i === 0) {
			divisors.push(i)
		}
	}
	return divisors
}

function getConversionText(conversion) {
	let lines = [],
		step = 1

	lines.push('Convert ' + conversion.dieA.join(' ') + ' to ' + conversion.dieB.join(' ') +
		(conversion.makeFair ? '' : ' without') + ' guaranteeing the result to be equally likely')
	lines.push('You will have to throw it ' + conversion.expectation.toFixed(1) + ' times on average')

	prepareText(conversion, '')

	return lines.join('\n')

	function prepareText(conversion, prefix) {
		let firstStep = step
		lines.push(prefix + (step++) + '. Throw it ' +
			(conversion.throws === 1 ? 'once' : conversion.throws + ' times'))
		lines.push(prefix + (step++) + '. Find the result in the following table:')

		for (let [range, subConversion] of conversion.conversions) {
			if (Array.isArray(subConversion)) {
				lines.push(prefix + '  ' + getTossRangeText(range) + ' => return ' + subConversion)
			} else if (subConversion === conversion) {
				lines.push(prefix + '  ' + getTossRangeText(range) + ' => repeat from step ' + firstStep)
			} else {
				lines.push(prefix + '  ' + getTossRangeText(range) + ' => execute the following')
				prepareText(subConversion, prefix + '    ')
			}
		}
	}
}

function getTossRangeText(range) {
	let seq = []

	let iStart = -Infinity,
		lastId = -Infinity
	for (let i = 0; i < range.ids.length; i++) {
		let id = range.ids[i]
		if (id > lastId + 1) {
			// New sequence
			if (iStart !== -Infinity) {
				pushSeq(iStart, i - 1)
			}
			iStart = i
		}
		lastId = id
	}

	// Last sequence
	pushSeq(iStart, range.ids.length - 1)

	function pushSeq(iStart, iEnd) {
		let start = range.faces[iStart].join(' ')
		if (iEnd === iStart) {
			seq.push(start)
		} else if (iEnd === iStart + 1) {
			seq.push(start, range.faces[iEnd].join(' '))
		} else {
			seq.push(start + ' - ' + range.faces[iEnd].join(' '))
		}
	}

	return seq.join(', ')
}

function createDie(n) {
	if (n === 2) {
		return ['H', 'T']
	}

	let die = []
	for (let i = 1; i <= n; i++) {
		die.push(String(i))
	}
	return die
}

let Ns = [4, 6, 8, 10, 12, 20],
	row = ['a/b']
for (let b of Ns) {
	row.push(String(b))
}
console.log(row.join(' '))
for (let a of Ns) {
	let row = [String(a)]
	for (let b of Ns) {
		row.push(getBestConversion(createDie(a), createDie(b), true).expectation.toFixed(1))
	}
	console.log(row.join(' '))
}