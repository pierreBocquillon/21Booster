
const fs = require("fs")
const path = require("path")

const FILES = {
	users: "23-01-2026_Users.csv",
	cards: "23-01-2026_Cards.csv",
	data: "23-01-2026_Data.csv",
}

// Robust CSV line parser: handles commas inside quotes
function parseCSVLine(line) {
	const result = [];
	let current = '';
	let inQuotes = false;
	for (let i = 0; i < line.length; i++) {
		const char = line[i];
		if (char === '"') {
			if (inQuotes && line[i + 1] === '"') {
				current += '"';
				i++;
			} else {
				inQuotes = !inQuotes;
			}
		} else if (char === ',' && !inQuotes) {
			result.push(current);
			current = '';
		} else {
			current += char;
		}
	}
	result.push(current);
	return result;
}

const OUTPUT_FILE = "output.json"

let parseCSV = () => {
	let result = {
		users: [],
		cards: [],
		data: [],
	}

	for (const [key, filename] of Object.entries(FILES)) {
		const filePath = path.join(__dirname, filename)
		if (fs.existsSync(filePath)) {
			const fileContent = fs.readFileSync(filePath, "utf-8")
			const lines = fileContent.trim().split(/\r?\n/)

			if (lines.length > 0) {
				const headers = parseCSVLine(lines[0]).map((h) => h.trim());

				for (let i = 1; i < lines.length; i++) {
					const line = lines[i];
					if (line.trim() === "") continue;

					const values = parseCSVLine(line);
					let obj = {};

					headers.forEach((header, index) => {
						obj[header] = values[index] ? values[index].trim() : "";
					});

					result[key].push(obj);
				}
			}
		} else {
			console.warn(`File not found: ${filename}`)
		}
	}

	return result
}

let getCollections = (data) => {
  let collections = {}

  // Setup empty collection for each user
  data.users.forEach((user) => {
    collections[user.UserID] = {}
  })

  // Process data to increment card counts
  data.data.forEach((row) => {
    const userId = row.UserID
    const cardId = row.CardID

    if (userId && cardId && collections[userId]) {
      if (!collections[userId][cardId]) {
        collections[userId][cardId] = 0
      }
      collections[userId][cardId] += 1
    }
  })

  return collections
}

let getStats = (data) => {
  let stats = {}
  let userOpens = {}

  // Setup empty stats for each user
  data.users.forEach((user) => {
    stats[user.UserID] = {
      open: 0
    }
    userOpens[user.UserID] = new Set()
  })

  // Process data to count opens
  data.data.forEach((row) => {
    const userId = row.UserID
    const openId = row.OpenID

    if (userId && openId) {
      if (!userOpens[userId]) {
        userOpens[userId] = new Set()
      }
      userOpens[userId].add(openId)
    }
  })
  
  // Calculate totals
  for (const [userId, opens] of Object.entries(userOpens)) {
    if (!stats[userId]) stats[userId] = { open: 0 }
    stats[userId].open = opens.size
  }

  return stats
}

let main = () => {
	let result = {
		users: [],
		cards: [],
		collections: {},
		stats: {},
	}

	let data = parseCSV()

	result.users = data.users
	result.cards = data.cards
	result.collections = getCollections(data)
	result.stats = getStats(data)

  const filePath = path.join(__dirname, OUTPUT_FILE)

	fs.writeFileSync(filePath, JSON.stringify(result, null, 2))
	console.log(`Data successfully written to ${OUTPUT_FILE}`)
}

main()
