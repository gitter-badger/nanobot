
function wait(seconds) {
	return new Promise((resolve, reject) => {
		setTimeout(() => {
			resolve()
		}, 1000 * seconds)
	})
}

async function main() {
	console.log('Hello World!')
	await wait(1)

	console.log('The process will exit in 10 seconds... (with code 7)')
	await wait(10)
	process.exit(7)
}

main().catch(err => { throw err })
