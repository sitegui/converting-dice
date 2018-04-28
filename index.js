'use strict'

console.log(getExpectedValue(8, 6, 3))

function fair(n) {
	for (let k = 2; k <= 3; k++) {
		let n2k = getBestExpectedValue(n, k).expected,
			kFac = getFactorial(k),
			k2kFac = getExpectedForFairing(k),
			kFac2n = getBestExpectedValue(kFac, n).expected
		console.log('k=%d, E=%s * %s * %s=%s',
			k,
			n2k.toFixed(1),
			k2kFac.toFixed(1),
			kFac2n.toFixed(1),
			(n2k * k2kFac * kFac2n).toFixed(1))
	}
}

/**
 * @param {number} a
 * @param {number} b
 * @returns {{weight: number, expected: number, desc: string}}
 */
function getBestExpectedValue(a, b) {
	// Minimum weight
	let weight = 1,
		A = a
	while (A < b) {
		A *= a
		weight += 1
	}

	let bestExpected = {
		weight: 0,
		expected: Infinity,
		desc: ''
	}
	while (true) {
		let expected = getExpectedValue(A, b, weight)
		expected.weight = weight
		if (expected.expected < bestExpected.expected) {
			bestExpected = expected
		}

		// Minimum expected value is weight
		if (weight + 1 >= bestExpected.expected) {
			break
		}

		A *= a
		weight += 1
	}

	return bestExpected
}

/**
 * @param {number} a
 * @param {number} b - b <= a
 * @param {number} weight - number of throws to generate `a`
 * @returns {{expected: number, desc: string}}
 */
function getExpectedValue(a, b, weight) {
	if (b === 1) {
		return {
			expected: 0,
			desc: ''
		}
	}

	let partitions = getPartitions(a, b),
		z = 0,
		sizeB = 0,
		descSteps = []

	// Definition:
	// E(a, b) = SUM{size_i / a * (weight + E(a, b_i))} + size_b / a * (weight + E(a, b))
	// Making z = SUM{size_i / a * (weight + E(a, b_i))} and solving for E(a, b):
	// (a * z + size_b * weight) / (a - size_b)

	for (let partition of partitions) {
		if (partition.b === b) {
			sizeB = partition.size
		} else {
			z += partition.size / a * (weight + getBestExpectedValue(a, partition.b).expected)
		}

		// Prepare description cases
		// Example for {size: 15, k: 5, d: 3, b: 2}: '5 * 3'
		descSteps.push(partition.k + '*' + partition.d)
	}

	return {
		expected: (a * z + sizeB * weight) / (a - sizeB),
		desc: descSteps.join('+')
	}
}

/**
 * Partition `a` into multiple of divisors of `b`,
 * creating as most partitions of the biggest divisors as possible
 * Examples:
 * (101, 39) = 2 * 39 + 1 * 13 + 3 * 3 + 1
 * Properties:
 * b = SUM{size_i}
 * size_i = k_i * d_i, d_i divides b
 * @param {number} a
 * @param {number} b - b <= a
 * @returns {Array<{size: number, b: number, k: number, d: number}>}
 */
function getPartitions(a, b) {
	let partitions = []
	for (let divisor of getDivisors(b)) {
		let k = Math.floor(a / divisor)
		if (k) {
			partitions.push({
				size: divisor * k,
				b: b / divisor,
				k,
				d: divisor
			})
			a -= divisor * k
		}
	}
	return partitions
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

function getExpectedForFairing(k) {
	// Define a_ik = i/k * prod_{j=k+1-i}^{k-1} j/k
	// E_k = (k!/k^(k-1) + sum_{i=1}^{k-1} (a_i * (1+i))) / (1 - sum_{i=1}^{k-1} a_i)

	let a = []
	for (let i = 1; i <= k - 1; i++) {
		let prod = 1
		for (let j = k + 1 - i; j <= k - 1; j++) {
			prod *= j / k
		}
		a[i] = i / k * prod
	}

	// k!/k^(k-1)
	let num = 1,
		den = 1
	for (let i = 2; i <= k; i++) {
		num *= i / k
	}

	for (let i = 1; i <= k - 1; i++) {
		num += a[i] * (1 + i)
		den -= a[i]
	}

	return num / den
}

function getFactorial(k) {
	return k === 1 ? 1 : k * getFactorial(k - 1)
}