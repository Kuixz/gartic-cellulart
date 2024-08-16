global.chrome = {
    runtime: {
        getURL: (x) => { return "../../" + x },
        onMessage: {
            addListener: function() { }
        }
    },
    // storage: {
    //     local:
    //         {
    //             set
    //         }
    // }
};

global.PATH = '/Users/zacharytsang/dev/HTML:CSS:JS/cellulart megafolder/cellulart'

// import { TextEncoder, TextDecoder } from 'util';
// global.TextEncoder = TextEncoder;
// global.TextDecoder = TextDecoder;

// document.body = document.createElement('body')