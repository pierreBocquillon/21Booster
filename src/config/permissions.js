let permissions = [
	{
		icon: "💵",
		name: "Vendeur",
		value: "seller",
	},
	{
		icon: "🎨",
		name: "Créateur",
		value: "creator",
	},
	{
		icon: "🛡️",
		name: "Modérateur",
		value: "moderator",
	},
	{
		icon: "💻",
		name: "Développeur",
		value: "dev",
	}
]

for (let perm of permissions) {
	perm.fullname = `${perm.icon} ${perm.name}`
}

export default permissions
