import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";
import { execSync } from "child_process";

const commitHash = execSync("git rev-parse --short HEAD").toString().trim();

export default defineConfig({
	plugins: [sveltekit()],
	define: {
		"import.meta.env.COMMIT_HASH": JSON.stringify(commitHash)
	}
});
