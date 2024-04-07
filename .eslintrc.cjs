module.exports = {
	env: { browser: true, es2020: true },
	parser: '@typescript-eslint/parser',
	"rules": {
		"eol-last": "off",
		"brace-style": "off",
		"comma-dangle": "off",
		"comma-spacing": "off",
		"eqeqeq": "off",
		"indent": "off",
		"key-spacing": "off",
		"keyword-spacing": "off",
		"max-len": "off",
		"no-ex-assign": "off",
		"no-extra-boolean-cast": "off",
		"no-multi-spaces": "off",
		"no-throw-literal": "off",
		"no-unreachable": "off",
		"radix": "off",
		"quote-props": "off",
		"quotes": "off",
		"space-before-function-paren": "off",
		"space-in-parens": "off",
		"space-infix-ops": "off",
		"space-unary-ops": "off",
		"spaced-comment": "off"
	},
	"overrides": [
		{
			"extends": ["plugin:@typescript-eslint/recommended"],
			"files": ["**/*.ts"],
			"parser": "@typescript-eslint/parser",
			"rules": {
				"@typescript-eslint/no-extra-semi": "off",
				"@typescript-eslint/no-explicit-any": "off"
			}
		},
		{
			"files": ["**/*.test.ts"],
			"env": { "jest": true },
			"rules": {
				"@typescript-eslint/ban-ts-comment": "off"
			}
		}
	]
};
