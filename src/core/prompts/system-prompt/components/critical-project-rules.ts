import * as fs from "fs"
import * as path from "path"
import type { PromptVariant, SystemPromptContext } from "../types"

/**
 * Generate critical project rules section for Zoro integration
 * This appears at the TOP of the system prompt when zoro_integration.md exists
 */
export async function generateCriticalProjectRules(
	variant: PromptVariant,
	context: SystemPromptContext,
): Promise<string> {
	console.log("[Critical Project Rules] Checking for zoro project...")
	
	// Exit early if no cwd
	if (!context.cwd) {
		console.log("[Critical Project Rules] ❌ No cwd, skipping")
		return ""
	}

	console.log("  - cwd:", context.cwd)

	const zoroIntegrationPath = path.join(context.cwd, ".clinerules", "zoro_integration.md")
	const zoroPlanPath = path.join(context.cwd, ".clinerules", "zoro_plan.md")

	console.log("  - zoroIntegrationPath:", zoroIntegrationPath)
	console.log("  - integration file exists:", fs.existsSync(zoroIntegrationPath))
	console.log("  - plan file exists:", fs.existsSync(zoroPlanPath))

	// Check if this is a Zoro project
	if (!fs.existsSync(zoroIntegrationPath)) {
		console.log("[Critical Project Rules] ❌ No zoro_integration.md found, skipping")
		return ""
	}

	console.log("[Critical Project Rules] ✅ Generating critical rules section")

	let rulesContent = `====

🚨 CRITICAL PROJECT RULES - READ THIS FIRST 🚨

This is a ZORO project with MANDATORY integration requirements that MUST be followed.

`

	// Read zoro_integration.md
	try {
		const integrationContent = fs.readFileSync(zoroIntegrationPath, "utf-8")
		console.log(`  - Read ${integrationContent.length} chars from zoro_integration.md`)
		rulesContent += `## Zoro Integration Requirements\n\n${integrationContent}\n\n`
	} catch (error) {
		console.log("  - ❌ Error reading zoro_integration.md:", error)
		rulesContent += `## Zoro Integration Requirements\n\n[Error reading zoro_integration.md]\n\n`
	}

	// Read zoro_plan.md if it exists
	if (fs.existsSync(zoroPlanPath)) {
		try {
			const planContent = fs.readFileSync(zoroPlanPath, "utf-8")
			console.log(`  - Read ${planContent.length} chars from zoro_plan.md`)
			rulesContent += `## Current Zoro Plan\n\n${planContent}\n\n`
		} catch (error) {
			console.log("  - ❌ Error reading zoro_plan.md:", error)
			rulesContent += `## Current Zoro Plan\n\n[Error reading zoro_plan.md]\n\n`
		}
	} else {
		console.log("  - No zoro_plan.md file found (optional)")
	}

	rulesContent += `🚨 IMPORTANT: All 'zoro' commands will automatically execute in the 'zoro' conda environment. You do NOT need to manually activate it for zoro commands.

====

`

	console.log(`[Critical Project Rules] ✅ Generated ${rulesContent.length} chars total`)
	return rulesContent
}