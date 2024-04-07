// jest.config.js
module.exports = {
	verbose: true,
	testRegex: "tests/.*\\.test\\.ts$",
	transform: {
		"^.+\\.ts$": ["babel-jest", {
			presets: [
				['@babel/preset-env', { targets: { node: 'current' }} ],
				'@babel/preset-typescript'
			]
		}]
	},
	"reporters": [ "jest-progress-bar-reporter" ],
	testEnvironment: "jest-environment-jsdom-global",
	transformIgnorePatterns: [
		"\\.pnp\\.[^\\\/]+$"
	],
	//https://jestjs.io/docs/configuration#workeridlememorylimit-numberstring
	//The issue:  https://github.com/facebook/jest/issues/11956
	workerIdleMemoryLimit: "2GB"
};
