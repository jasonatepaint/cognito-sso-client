import { ClientConfig } from "../../src/models/config";

describe('Unified Config', () => {
	test('constructor defaults', async () => {
		const config = new ClientConfig();
		expect(config.callbacks).toEqual({});
	});
});
