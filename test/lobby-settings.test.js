// Testing whether Observer transmits the correct settings to Timer and Spotlight via Converter.

const foundation = require(PATH + '/src/content/foundation.js');
Object.assign(global, foundation)

const modules = require(PATH + '/src/content/modules.js');
Object.assign(global, modules)

const cellulart = require(PATH + '/src/content/cellulart.js');
Object.assign(global, cellulart)

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

test('defaults', () => {
    sequence([['xhr','lobbySettings',{ 
        "screen":1,
        "countDown":false,
        "user":{"id":1,"nick":"belamy","avatar":"39","viewer":false,"owner":true,"points":0,"change":0,"access":"01949a5790","alert":false},
        "users":[{"id":1,"nick":"belamy","avatar":"39","owner":true,"viewer":false,"points":0,"change":0,"alert":false}],
        "turnNum":0,
        "turnMax":0,
        "roundNum":0,
        "bookNum":0,
        "bookAutomatic":true,
        "bookVoice":false,
        "bookOrder":true,
        "configs":{"tab":1,"maxUsers":14,"mod":2,"mode":1,"visible":1,"speed":2,"turns":3,"first":1,"score":2,"animate":2,"keep":2},
        "animationConfigs":{"speed":3,"loop":1},
        "sentence":"",
        "timeStarted":false,
        "code":"01949a5790",
        "invite":"01970y8I4ppgEkHUaTA0luMc",
        "modCode":"019AGSfQNT8HEjD9leADFPap"
    }]])
    // expect(Timer.parameters.write).toBe(40)
    // expect(Timer.parameters.draw).toBe(150)    
    // expect(Spotlight.).toBe(150)
    expect(game.write).toBe(40)
    expect(game.draw).toBe(150)
    expect(game.user).toBe('belamy')



    sequence([['xhr','lobbySettings', {
        "screen":1,
        "countDown":false,
        "user":{"id":1,"nick":"stingy","avatar":"39","viewer":false,"owner":true,"points":0,"change":0,"access":"019462cff0","alert":false,"waiting":false},
        "users":[{"id":1,"nick":"stingy","avatar":"39","owner":true,"viewer":false,"points":0,"change":0,"alert":false},{"id":2,"nick":"CoolNickname5021","avatar":27,"owner":false,"viewer":false,"points":0,"change":0,"alert":false}],
        "turnNum":0,
        "turnMax":0,
        "roundNum":0,
        "bookNum":0,
        "bookAutomatic":true,
        "bookVoice":false,
        "bookOrder":true,
        "configs":{"tab":1,"maxUsers":14,"mod":2,"mode":3,"visible":2,"speed":3,"turns":3,"first":1,"score":2,"animate":2,"keep":2},
        "animationConfigs":{"speed":3,"loop":1},
        "sentence":"",
        "timeStarted":false,
        "code":"019462cff0",
        "invite":"019qfOKr8SR30EaRpMKT0Iaq",
        "modCode":"019TfjOEHLksHnSKMSWS369C"
    }]])

    expect(game.write).toBe(20)
    expect(game.draw).toBe(75)
    expect(game.user).toBe('stingy')
})