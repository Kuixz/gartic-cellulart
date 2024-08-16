// const path = require('path');

// module.exports = {
//   process(sourceText, sourcePath, options) {
//     return {
//         code: `module.exports = ${JSON.stringify(path.basename(sourcePath))};`,
//     };
//   },
// };
module.exports = {
    process(sourceText, sourcePath, options) {
        return {
            // code: `module.exports = ${JSON.stringify(path.basename(sourcePath))};`
            // code: `${sourceText};\nmodule.exports = { svgNS }`
            // code: `${sourceText}; module.exports = ${JSON.stringify(window)};`,
            // code: "adr[23]"
            // code: `${sourceText}; module.exports = { svgNS }`
            // code: "ardrs[7]"
        }
    }
}