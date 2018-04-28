/* globals getConversionText, getBestConversion, createDie */
'use strict'

let dieAEl = document.getElementById('dieA'),
	dieBEl = document.getElementById('dieB'),
	makeFairEl = document.getElementById('makeFair'),
	outputEl = document.getElementById('output')

dieAEl.onchange = dieBEl.onchange = makeFairEl.onchange = update

if (location.hash) {
	let hash = location.hash.slice(1).split('-')
	if (hash.length === 3) {
		dieAEl.value = hash[0]
		dieBEl.value = hash[1]
		makeFairEl.checked = hash[2] === 'true'
	}
}

update()

function update() {
	let dieA = dieAEl.valueAsNumber,
		dieB = dieBEl.valueAsNumber,
		makeFair = makeFairEl.checked
	outputEl.textContent = getConversionText(getBestConversion(createDie(dieA),
		createDie(dieB),
		makeFair))

	location.hash = [dieA, dieB, makeFair].map(String).join('-')
}