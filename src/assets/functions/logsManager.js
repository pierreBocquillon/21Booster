import Log from "@/classes/Log.js"

let logsManager = {
	async log(user, type, description) {
		let date = new Date().getTime()

		let new_log = Log.initOne(user)
		new_log.date = date
		new_log.type = type
		new_log.description = description

		await new_log.save()
		return true
	},
}

export default logsManager
