function getInvestigationPrompt(
	stepDescription: string,
	substepDescription: string,
	requirements: Array<{ id: string; description: string; category: string }>,
	chatHistory: string,
): string {
	return `Investigate the implementation to understand how to test these requirements.

## PARENT STEP:
${stepDescription}

## SUBSTEP:
${substepDescription}

## REQUIREMENTS TO TEST (${requirements.length}):
${requirements
		.map(
			(r, i) => `${i + 1}. [${r.id}] ${r.description}
   Category: ${r.category}
   Test method: test_${r.id.replace(/-/g, "_")}_<descriptive_name>`,
		)
		.join("\n\n")}

## CHAT HISTORY:
${chatHistory}

## YOUR TASK:
Use tools to investigate the code and understand:
- Where each requirement is implemented
- What files contain the relevant code
- How the implementation works
- What needs to be tested

Read implementation files, search for relevant code, and gather information about how to test each requirement.`
}

export function getTestSubstepRequirementsPrompt(
	stepDescription: string,
	substepDescription: string,
	requirements: Array<{ id: string; description: string; category: string }>,
	workspaceDir: string,
	testFilePath: string,
	chatHistory: string,
	existingTestFile?: string,
): string {
	// Returns ONLY the investigation prompt for Phase 1
	return getInvestigationPrompt(stepDescription, substepDescription, requirements, chatHistory)
}

export function getTestWritingInstructions(
	requirements: Array<{ id: string; description: string; category: string }>,
	workspaceDir: string,
	testFilePath: string,
	existingTestFile?: string,
): string {
	// Returns detailed formatting instructions for Phase 2
	const mode = existingTestFile ? "UPDATE" : "CREATE"

	let instructions = `Now write the test file to: ${testFilePath}

`

	if (existingTestFile) {
		instructions += `## Existing Test File

\`\`\`python
${existingTestFile}
\`\`\`

## Instructions for UPDATING Test File

⚠️ **CRITICAL - Preserve Existing Structure**:

1. **Keep ALL existing code**:
   - Import statements
   - Helper functions (especially print_test_result)
   - Class definition and setUp/tearDown
   - Test methods for OTHER requirements (not in the list above)

2. **For EACH requirement in the list**:
   - Check if test method for that requirement exists (e.g., \`test_req_1_*\`)
   - If EXISTS → **REPLACE** the method with updated implementation
   - If NOT EXISTS → **ADD** new test method

3. **Test method format**:
   \`\`\`python
   def test_req_1_descriptive_name(self):
       """Requirement req-1: Description here"""
       try:
           # Test implementation
           self.assertEqual(actual, expected)
           
           # REQUIRED: Print on success
           print_test_result(
               name="test_req_1_descriptive_name",
               requirement_id="req-1",  # ← CRITICAL!
               status="pass",
               description="What was verified",
               category="${requirements[0]?.category || "feature"}"
           )
       except AssertionError as e:
           # REQUIRED: Print on failure
           print_test_result(
               name="test_req_1_descriptive_name",
               requirement_id="req-1",
               status="fail",
               description=str(e),
               category="${requirements[0]?.category || "feature"}"
           )
           raise
   \`\`\`

4. **Write the complete updated file** using write_to_file tool.

`
	} else {
		instructions += `## Instructions for CREATING New Test File

**You must write a complete test file with this structure**:

\`\`\`python
import sys
import os
import json
import unittest

# Add workspace root to path
sys.path.insert(0, '${workspaceDir}')
# Add other paths if needed (analyze implementation files first!)
# sys.path.insert(0, '${workspaceDir}/backend')
# sys.path.insert(0, '${workspaceDir}/src')

# Helper function to print structured test results
def print_test_result(name, status, description, category="general",
                      requirement_id=None, rule_description=None, feature_name=None):
    """Print test result in format that Zoro can parse"""
    result = {
        "name": name,
        "status": status,  # Must be 'pass', 'fail', or 'error'
        "description": description,
        "category": category,
        "output": "",
        "test_code": ""
    }
    if requirement_id:
        result["requirement_id"] = requirement_id
    if rule_description:
        result["rule_description"] = rule_description
    if feature_name:
        result["feature_name"] = feature_name
    print(f"TEST_RESULT: {json.dumps(result)}")

# Import from workspace (analyze implementation first!)
# from backend.api.routes import ...
# from src.components import ...

class TestSubstep(unittest.TestCase):
    """Tests for substep requirements"""
    
    def test_req_1_example(self):
        """Requirement req-1: Description"""
        try:
            # Test code here
            self.assertEqual(actual, expected)
            
            print_test_result(
                name="test_req_1_example",
                requirement_id="req-1",  # ← CRITICAL!
                status="pass",
                description="What was verified",
                category="feature"
            )
        except AssertionError as e:
            print_test_result(
                name="test_req_1_example",
                requirement_id="req-1",
                status="fail",
                description=str(e),
                category="feature"
            )
            raise

if __name__ == '__main__':
    unittest.main()
\`\`\`

**Generate test methods for ALL ${requirements.length} requirements.**

`
	}

	instructions += `
## Key Points:

- Use **write_to_file** to ${mode === "UPDATE" ? "update" : "create"}: \`${testFilePath}\`
- Each test must include requirement_id in print_test_result()
- Use clear test names: test_req_{id}_<descriptive_name>
- **Maximum 3 test methods per requirement** (prefer just 1)
- Each requirement should have exactly ONE test method unless multiple scenarios are genuinely needed

Use the write_to_file tool now to create the test file.`

	return instructions
}