import "@mdi/font/css/materialdesignicons.css"
import "vuetify/styles"

import { createVuetify } from "vuetify"

import defaultTheme from "@/themes/defaultTheme.js"

export default createVuetify({
	theme: {
		defaultTheme: "default",
		themes: {
			default: defaultTheme,
		},
	},
})
