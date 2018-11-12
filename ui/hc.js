var currentAmount = 0

async function refreshAmount() {
	const response = await fetch('/fn/bacon/currentBalance',{method:'POST'})
	if (!response.ok) {
		console.error('error fetching current amount')
		return
	}
	const data = await response.text()
	currentAmount = Number(data)
	document.getElementById('current').innerText = data
}
async function transfer() {
	const to = prompt('insert peer hash')
	if (!to) {
		return
	}
	const amount = prompt('insert number of coins to transfer (integer only)')
	if (amount > currentAmount) {
		alert('you\'ll need more money to do such a transaction')
		return
	}
	const concept = prompt('insert the transaction subject')
	const response = await fetch('/fn/bacon/transact',{
		method:'POST',
		body:JSON.stringify({
			to:to,
			amount:amount,
			concept:concept
		})
	})
	if (!response.ok) {
		console.error('error in transfer')
		return
	}
	consultBalance()
}
async function consultBalance() {
	const response = await fetch('/fn/bacon/currentBalance',{
		method:'POST',
		body:prompt('insert peer hash')
	})
	if (!response.ok) {
		console.error('error fetching current balance')
		return
	}
	const data = await response.text()
	document.getElementById('current').innerText = data
}
async function getAddress() {
	const response = await fetch('/fn/bacon/getAddress',{method:'POST'})
	if (!response.ok) {
		console.error('error fetching address')
		return
	}
	const data = await response.text()
	document.getElementById('my-address').innerText = data
}
// setTimeout(()=>location.reload(),10000)
getAddress()
refreshAmount()