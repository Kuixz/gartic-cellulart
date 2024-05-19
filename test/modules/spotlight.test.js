const foundation = require(PATH + '/src/content/foundation.js');
Object.assign(global, foundation)

const modules = require(PATH + '/src/content/modules.js');
Object.assign(global, modules)

function sequence(messages) {
    for (const message of messages) {
        switch (message[0]) {
            case 'socket': 
                Socket.handle(message[1], message[2])
                break
            case 'xhr': 
                Xhr.handle(message[1], message[2])
                break
        }
    }
}

document.body.innerHTML =
`
<div class="jsx-89969a832216b3af timeline">
    <div class="jsx-3526280386 scroll over bottom">
        <div class="jsx-3526280386 scrollElements">
            <div class="jsx-89969a832216b3af item">
                <div class="jsx-3852781a54d26fc4 drawBalloon drawing">
                    <div class="jsx-4238087906 avatar">
                        <span class="jsx-4238087906">
                        </span>
                    </div>
                    <div class="jsx-3852781a54d26fc4">
                        <span class="jsx-3852781a54d26fc4 nick">
                            harlem</span>
                        <div class="jsx-3852781a54d26fc4 balloon">
                            <div class="jsx-3852781a54d26fc4 content">
                                <div class="jsx-2238675864">
                                    <canvas width="758" height="424" class="jsx-1669353831 ">
                                    </canvas>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="jsx-89969a832216b3af item">
                <div class="jsx-3852781a54d26fc4 drawBalloon drawing">
                    <div class="jsx-4238087906 avatar">
                        <span class="jsx-4238087906">
                        </span>
                    </div>
                    <div class="jsx-3852781a54d26fc4">
                        <span class="jsx-3852781a54d26fc4 nick">
                            harlem</span>
                        <div class="jsx-3852781a54d26fc4 balloon">
                            <div class="jsx-3852781a54d26fc4 content">
                                <div class="jsx-2238675864">
                                    <canvas width="758" height="424" class="jsx-1669353831 ">
                                    </canvas>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="jsx-89969a832216b3af item">
                <div class="jsx-3852781a54d26fc4 drawBalloon drawing">
                    <div class="jsx-4238087906 avatar">
                        <span class="jsx-4238087906">
                        </span>
                    </div>
                    <div class="jsx-3852781a54d26fc4">
                        <span class="jsx-3852781a54d26fc4 nick">
                            harlem</span>
                        <div class="jsx-3852781a54d26fc4 balloon">
                            <div class="jsx-3852781a54d26fc4 content">
                                <div class="jsx-2238675864">
                                    <canvas width="758" height="424" class="jsx-1669353831 ">
                                    </canvas>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="jsx-89969a832216b3af item">
                <div class="jsx-3852781a54d26fc4 drawBalloon drawing">
                    <div class="jsx-4238087906 avatar">
                        <span class="jsx-4238087906">
                        </span>
                    </div>
                    <div class="jsx-3852781a54d26fc4">
                        <span class="jsx-3852781a54d26fc4 nick">
                            harlem</span>
                        <div class="jsx-3852781a54d26fc4 balloon">
                            <div class="jsx-3852781a54d26fc4 content">
                                <div class="jsx-2238675864">
                                    <canvas width="758" height="424" class="jsx-1669353831 ">
                                    </canvas>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="jsx-89969a832216b3af item">
                <div class="jsx-3852781a54d26fc4 drawBalloon drawing">
                    <div class="jsx-4238087906 avatar">
                        <span class="jsx-4238087906">
                        </span>
                    </div>
                    <div class="jsx-3852781a54d26fc4">
                        <span class="jsx-3852781a54d26fc4 nick">
                            harlem</span>
                        <div class="jsx-3852781a54d26fc4 balloon">
                            <div class="jsx-3852781a54d26fc4 content">
                                <div class="jsx-2238675864">
                                    <canvas width="758" height="424" class="jsx-1669353831 ">
                                    </canvas>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="jsx-89969a832216b3af item">
                <div class="jsx-3852781a54d26fc4 drawBalloon drawing">
                    <div class="jsx-4238087906 avatar">
                        <span class="jsx-4238087906">
                        </span>
                    </div>
                    <div class="jsx-3852781a54d26fc4">
                        <span class="jsx-3852781a54d26fc4 nick">
                            harlem</span>
                        <div class="jsx-3852781a54d26fc4 balloon">
                            <div class="jsx-3852781a54d26fc4 content">
                                <div class="jsx-2238675864">
                                    <canvas width="758" height="424" class="jsx-1669353831 ">
                                    </canvas>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="jsx-89969a832216b3af item">
                <div class="jsx-3852781a54d26fc4 drawBalloon drawing">
                    <div class="jsx-4238087906 avatar">
                        <span class="jsx-4238087906">
                        </span>
                    </div>
                    <div class="jsx-3852781a54d26fc4">
                        <span class="jsx-3852781a54d26fc4 nick">
                            harlem</span>
                        <div class="jsx-3852781a54d26fc4 balloon">
                            <div class="jsx-3852781a54d26fc4 content">
                                <div class="jsx-2238675864">
                                    <canvas width="758" height="424" class="jsx-1669353831 ">
                                    </canvas>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
` +
/* ```
<section class="jsx-89969a832216b3af ">
    <div class="jsx-faf94a4f1e32345c end">
        <p class="jsx-faf94a4f1e32345c">
            End of harlem's album</p>
    </div>
    <div class="jsx-89969a832216b3af buttons">
        <span class="jsx-89969a832216b3af">
            <button class="jsx-f4f42546491cab41 small">
                <i class="jsx-bf1d798ec2f16818 download">
                </i>
            </button>
        </span>
        <span class="jsx-89969a832216b3af">
            <button type="small" class="jsx-1e5748a2310b0bd small">
                <i class="jsx-bf1d798ec2f16818 playSmall">
                </i>
                <strong class="jsx-89969a832216b3af">
                    New turn</strong>
            </button>
        </span>
    </div>
</section>
``` + */
`
        </div>
        <div class="jsx-3526280386 scrollBar">
            <div class="jsx-3526280386 scrollTrack" style="top: 481px; height: 30px;">
            </div>
        </div>
    </div>
</div>
`;

// test('fire frame event', () => {
    
// })
test('get frame', () => {
    Spotlight.turns = 7
    Spotlight.fallback = 1
    Spotlight.mutation('draw', 'book')

    sequence([['socket','update42',[2,9,{}]]])
    expect(Spotlight.compositedFrameDatas).not.toBe([])
    // expect(Spotlight.).not.toBe(150)
    // expect(Timer.parameters.decay(10)).toBe(0)
    // expect(Spotlight.user).toBe('belamy')
})