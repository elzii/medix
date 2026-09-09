import type { ElectrobunConfig } from "electrobun";

export default {
	app: {
		name: "Medis",
		identifier: "dev.medis.electrobun",
		version: "1.0.3",
	},
	release: {
		baseUrl: "https://github.com/elzii/medix/releases/latest/download",
		generatePatch: true,
	},
	build: {
		mainProcess: "cottontail",
		cottontail: {
			entrypoint: "src/bun/index.ts",
		},
		views: {},
		copy: {
			"dist/renderer": "views/mainview",
		},
		mac: {
			bundleCEF: false,
			icons: "icon.iconset",
		},
		linux: {
			bundleCEF: false,
		},
		win: {
			bundleCEF: false,
		},
	},
} satisfies ElectrobunConfig;
