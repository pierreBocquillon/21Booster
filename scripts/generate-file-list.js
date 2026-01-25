const fs = require("fs")
const path = require("path")

const publicDir = path.join(__dirname, "../public")
const outputFile = path.join(publicDir, "files.json")

const targetDirs = ["achievements", "boosters", "cards", "collections_card", "collections_cover", "collections_page"]

const getFiles = (dir, rootDir, fileList = []) => {
	if (!fs.existsSync(dir)) return []

	const files = fs.readdirSync(dir)
	files.forEach((file) => {
		const filePath = path.join(dir, file)
		if (fs.statSync(filePath).isDirectory()) {
			getFiles(filePath, rootDir, fileList)
		} else {
			// Get path relative to 'public' folder
			const relativePath = path.relative(rootDir, filePath).replace(/\\/g, "/")
			// Exclude the output file itself
			if (relativePath !== "files.json") {
				fileList.push(relativePath)
			}
		}
	})
	return fileList
}

try {
	if (!fs.existsSync(publicDir)) {
		console.error("Public directory not found!")
		process.exit(1)
	}

	const result = {}
	let totalFiles = 0

	targetDirs.forEach((target) => {
		const targetPath = path.join(publicDir, target)
		const files = getFiles(targetPath, targetPath, [])
		result[target] = files
		totalFiles += files.length
	})

	fs.writeFileSync(outputFile, JSON.stringify(result, null, 2))
	console.log(`Successfully generated public/files.json with ${totalFiles} files across categories: ${targetDirs.join(", ")}.`)
} catch (err) {
	console.error("Error generating file list:", err)
}
