const fs = require('fs');
const html = fs.readFileSync('ports_routes_config.html', 'utf8');

function cleanCode(htmlStr) {
    return htmlStr
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/&nbsp;/g, ' ')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/<[^>]+>/g, '')
        .trim();
}

const blockRegex = /<div class="(?:file-label|section-label)">(.*?)<\/div>\s*<div class="code-block[^>]*>([\s\S]*?)<\/div>/gi;
let match;
while ((match = blockRegex.exec(html)) !== null) {
    let rawLabel = match[1].replace(/—.*/, '').trim();
    if (rawLabel.includes('Start here')) continue;
    
    // Sometimes it's like 'auth-service/app.js'
    const finalPath = 'cloud_project-/' + rawLabel;
    
    const dir = finalPath.substring(0, finalPath.lastIndexOf('/'));
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    
    fs.writeFileSync(finalPath, cleanCode(match[2]), 'utf8');
    console.log('Wrote ' + finalPath);
}
