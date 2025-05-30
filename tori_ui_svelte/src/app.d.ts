// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			user: {
				name: string;
				role: 'admin' | 'user';
			} | null;
		}
		// interface PageData {}
		// interface Platform {}
	}
}

export {};
