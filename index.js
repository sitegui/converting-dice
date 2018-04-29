/* globals getConversionText, getBestConversion, createDie, getConversionTables */
'use strict'

let dieAEl = document.getElementById('dieA'),
	dieBEl = document.getElementById('dieB'),
	makeFairEl = document.getElementById('makeFair'),
	outputTextEl = document.getElementById('outputText'),
	outputTablesEl = document.getElementById('outputTables'),
	showTextEl = document.getElementById('showText'),
	showTablesEl = document.getElementById('showTables')

dieAEl.onchange = dieBEl.onchange = makeFairEl.onchange = update

showTextEl.onclick = () => setTextDisplay(true)
showTablesEl.onclick = () => setTextDisplay(false)

function setTextDisplay(bool) {
	showTablesEl.style.display = bool ? '' : 'none'
	outputTextEl.style.display = bool ? '' : 'none'
	showTextEl.style.display = bool ? 'none' : ''
	outputTablesEl.style.display = bool ? 'none' : ''
}

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
		dieBFaces = createDie(dieB),
		makeFair = makeFairEl.checked,
		conversion = getBestConversion(createDie(dieA), dieBFaces, makeFair)

	// Fill text
	outputTextEl.textContent = getConversionText(conversion)

	// Gen colors
	let colors = new Array(dieB),
		HUE_WIDTH = 120
	for (let i = 0; i < colors.length; i++) {
		// h from 120-HUE_WIDTH to 120+HUE_WIDTH
		let h = (120 - HUE_WIDTH) + 2 * HUE_WIDTH * i / (colors.length - 1)
		colors[i] = 'hsl(' + h + ', 100%, 75%)'
	}

	// Fill tables
	outputTablesEl.innerHTML = ''

	let ruleEls = []
	for (let [i, table] of getConversionTables(conversion).entries()) {
		let h2El = document.createElement('h2')
		h2El.textContent = 'Rule ' + (i + 1)
		outputTablesEl.appendChild(h2El)
		ruleEls.push(h2El)

		let tableEl = document.createElement('table')
		outputTablesEl.appendChild(tableEl)

		for (let [j, row] of table.entries()) {
			let rowEl = tableEl.insertRow(-1)
			for (let [k, cell] of row.entries()) {
				let cellEl = rowEl.insertCell(-1),
					faceI = dieBFaces.indexOf(cell)
				cellEl.textContent = cell
				if (j && k && faceI !== -1) {
					cellEl.style.backgroundColor = colors[faceI]
				}
				if (cell.startsWith('Rule ')) {
					cellEl.onclick = scrollToRule
					cellEl.className = 'clickable'
				}
			}
		}
	}

	location.hash = [dieA, dieB, makeFair].map(String).join('-')

	function scrollToRule(ev) {
		let id = Number(ev.currentTarget.textContent.slice('Rule '.length)) - 1
		ruleEls[id].scrollIntoView()
	}
}