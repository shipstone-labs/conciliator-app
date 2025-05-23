# SafeIdea Synthetic Idea Generation Process

## Overview

This document outlines the precise process for generating synthetic ideas for testing the SafeIdea platform.

## ⚠️ IMPORTANT: Follow These Instructions Exactly ⚠️

The idea generation process must be followed precisely to maintain consistency and ensure proper testing of the SafeIdea platform. Do not deviate from these steps or formats for any reason.

## Generation Steps

1. **Random Selection**
   - Randomly select exactly one item from each of these categories:
     - A profession (e.g., Librarian, Surgeon, Archaeologist, Chef)
     - A scientific field (e.g., Biomimetics, Quantum Physics, Neuroplasticity)
     - A technology domain (e.g., Information Retrieval, Nanorobotics, VR)

2. **JSON Creation**
   - Generate a synthetic idea that meaningfully combines all three selected elements
   - Format the idea in this exact JSON structure:
   ```json
   {
     "title": "A clear, descriptive title that combines elements from a profession, a scientific field, and a technology",
     "description": "A one-paragraph summary that explains the core concept and key benefits",
     "content": "A detailed three-paragraph explanation that covers: (1) what the innovation is and why it's needed, (2) how it technically works in detail, and (3) what makes it transformative or revolutionary compared to existing approaches",
     "businessModel": "The primary business model (e.g., SaaS, Hardware+Service, Licensing, etc.)",
     "evaluationPeriod": "Standard or Premium",
     "tags": ["3-5 relevant keywords", "that categorize", "the idea"],
     "ndaRequired": true or false,
     "category": "The main technology or industry category"
   }
   ```
   - Save this JSON to `synthetic-idea.json` in the project root directory

3. **Markdown Creation**
   - Create a markdown file with a filename derived from the idea title:
     - Convert the title to lowercase
     - Replace spaces with hyphens
     - Save in the `synthetic-ideas/` directory (create if it doesn't exist)
   - Format using this exact template:
   ```markdown
   # CONFIDENTIAL TRADE SECRET
   ## [Idea Title]
   ### SafeIdea Research Institute

   **PUBLIC TITLE:** [Idea Title]

   **PUBLIC DESCRIPTION:** [Idea Description]

   ---

   ## RESTRICTED INFORMATION - TRADE SECRET
   *Access Level: Alpha-1*
   *Document ID: TS-[Random 3-digit number]-[Current Year]-[Random 3-digit number]*

   ### Fundamental Innovation

   [Content from the JSON file, formatted as paragraphs]

   ### Intellectual Property

   **Category:** [Category]
   **Business Model:** [Business Model]
   **Evaluation Period:** [Evaluation Period]
   **Tags:** [Tags separated by commas]
   **NDA Required:** [Yes/No]

   ---

   *This document contains SafeIdea Research Institute confidential and proprietary information. Unauthorized disclosure or reproduction is strictly prohibited and may result in severe civil and criminal penalties.*

   *Created: [Current Date in MM/DD/YYYY format]*

   **Generated With:** [The specific profession, scientific field, and technology domain you randomly selected]
   ```

## Documentation of Process Run Order

All steps should be executed in order without requesting confirmation at each step. The entire process should be run as a single automated workflow.

## How to Access This Functionality

There are two recommended ways to provide these instructions:

1. **Custom Claude Command (Recommended)**
   - The `.claude/commands/generate_idea.md` file already contains this workflow
   - This can be triggered by typing `Generate Idea` or `make idea` in conversation with Claude
   - This is the preferred method as it ensures consistent execution

2. **Via claude.md**
   - Adding a section in claude.md that references this document
   - Add the following to claude.md:
   ```markdown
   ## Idea Generation
   
   To generate new synthetic ideas for testing, follow the complete process in IDEA_GENERATION_PROCESS.md.
   This can be done by running the command "Generate Idea" or typing "make idea" in the conversation.
   
   Always follow the process exactly as specified without modification.
   ```

3. **Direct Instructions**
   - Reference this document directly when requesting an idea generation
   - Example: "Please generate a new synthetic idea following the exact process in IDEA_GENERATION_PROCESS.md"

## Verification

After generating an idea, verify:
1. `synthetic-idea.json` contains the complete JSON structure
2. A new markdown file exists in `synthetic-ideas/` with the proper filename
3. The markdown file follows the exact template format
4. Both files contain consistent information
5. The generation source is documented with the specific profession, scientific field, and technology domain that were randomly selected

## Examples

See existing files in the `synthetic-ideas/` directory for examples of correctly formatted output.