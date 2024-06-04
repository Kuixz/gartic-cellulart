export default function (source) {
    const manifest = JSON.stringify(source)
    
    delete manifest['content_scripts']

    return `export default ${JSON.stringify(manifest)}`;
}