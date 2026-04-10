const { readFileSync, writeFileSync, existsSync, mkdirSync } = require('fs');
const { join } = require('path');
const { optimize } = require('svgo');
const { execSync } = require('child_process');

const ISSUE_NUMBER = process.env.ISSUE_NUMBER;
const ISSUE_BODY = process.env.ISSUE_BODY;
const COMMENT_BODY = process.env.COMMENT_BODY;
const COMMENT_AUTHOR_ASSOCIATION = process.env.COMMENT_AUTHOR_ASSOCIATION;

const COMMUNITY_BRANCH = 'Community';
const ACTIONS_STORE_PATH = 'src/store/moveStore.ts';

function log(message) {
    console.log(`[Issue #${ISSUE_NUMBER}] ${message}`);
}

function setOutput(name, value) {
    if (process.env.GITHUB_OUTPUT) {
        require('fs').appendFileSync(process.env.GITHUB_OUTPUT, `${name}=${value}\n`);
    }
}

function runCommand(command) {
    log(`Executing: ${command}`);
    try {
        return execSync(command, { encoding: 'utf8', stdio: 'pipe' });
    } catch (error) {
        log(`Command failed: ${command}\nError: ${error.message}`);
        throw error;
    }
}

function isCollaborator(authorAssociation) {
    const collaboratorAssociations = ['COLLABORATOR', 'MEMBER', 'OWNER'];
    return collaboratorAssociations.includes(authorAssociation);
}

function extractJsonFromMarkdown(text) {
    const jsonRegex = /```json\n([\s\S]*?)\n```/;
    const match = text.match(jsonRegex);
    if (match && match[1]) {
        try {
            return JSON.parse(match[1]);
        } catch (e) {
            log('Failed to parse JSON.');
            return null;
        }
    }
    return null;
}

function validateActionData(data) {
    if (!data || typeof data !== 'object') return 'Invalid JSON.';
    const required = ['id', 'name', 'type', 'svgContent', 'sourceId', 'sourceNames'];
    for (const field of required) {
        if (!data[field]) return `Missing field: ${field}`;
    }
    return null;
}

function sanitizeSvg(svgContent) {
    const result = optimize(svgContent, {
        plugins: [
            'preset-default',
            'removeScriptElement',
            'removeXMLProcInst',
            { name: 'removeAttrs', params: { attrs: '(on.*|xlink:href|href)' } }
        ]
    });
    return result.data;
}

async function run() {
    let commentMessage = '';
    try {
        if (!isCollaborator(COMMENT_AUTHOR_ASSOCIATION)) {
            commentMessage = "🚫 Only collaborators can approve.";
            setOutput('comment_message', commentMessage);
            return;
        }

        const actionData = extractJsonFromMarkdown(ISSUE_BODY);
        const valError = validateActionData(actionData);
        if (valError) {
            setOutput('comment_message', `❌ Validation failed: ${valError}`);
            return;
        }

        const sanitizedSvg = sanitizeSvg(actionData.svgContent);

        runCommand('git config user.name "github-actions[bot]"');
        runCommand('git config user.email "github-actions[bot]@users.noreply.github.com"');

        // Branch management
        try {
            runCommand(`git fetch origin ${COMMUNITY_BRANCH}`);
            runCommand(`git checkout ${COMMUNITY_BRANCH}`);
            runCommand(`git rebase origin/main`);
        } catch (e) {
            runCommand(`git checkout -b ${COMMUNITY_BRANCH}`);
        }

        // Save SVG
        const typeDir = actionData.type === 'attack' ? 'atack' : 'parry';
        const svgPath = `public/actions/pov/${typeDir}/${actionData.id}.svg`;
        const dir = join(process.cwd(), `public/actions/pov/${typeDir}`);
        if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
        writeFileSync(svgPath, sanitizedSvg);

        // Update Store
        let storeContent = readFileSync(ACTIONS_STORE_PATH, 'utf8');
        if (storeContent.includes(`id: '${actionData.id}'`)) {
            commentMessage = `⚠️ Action \`${actionData.id}\` already exists.`;
        } else {
            const newEntry = `    {
        id: '${actionData.id}', sourceId: '${actionData.sourceId}',
        sourceNames: ${JSON.stringify(actionData.sourceNames)},
        type: '${actionData.type}', svgContent: \`${actionData.svgContent}\`,
        name: '${actionData.name}',
        description: '${actionData.description || ''}',
        povImage: '/actions/pov/${typeDir}/${actionData.id}.svg'
    }`;
            storeContent = storeContent.replace('];', `${newEntry},\n];`);
            writeFileSync(ACTIONS_STORE_PATH, storeContent);
            
            runCommand(`git add ${svgPath} ${ACTIONS_STORE_PATH}`);
            runCommand(`git commit -m "community: add ${actionData.id} (issue #${ISSUE_NUMBER})"`);
            runCommand(`git push origin ${COMMUNITY_BRANCH} --force`);
            commentMessage = `✅ Added \`${actionData.id}\` to \`${COMMUNITY_BRANCH}\` branch.`;
        }
    } catch (e) {
        commentMessage = `❌ Error: ${e.message}`;
    }
    setOutput('comment_message', commentMessage);
}

run();
