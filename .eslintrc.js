module.exports = {
	"env": {
		"commonjs": true,
		"es6": true,
		"node": true,
		"jest": true,
		"browser": true,
	},
	"parser": "@babel/eslint-parser",
	"parserOptions": {
		"ecmaVersion": 2017,
		"sourceType": "module"
	},
	"extends": "strongloop",
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
