
import CellulartModule from "./CellulartModule";
import { 
    SettingsBelt,
    Keybind,
    preventDefaults
} from "../foundation.js"

/* ----------------------------------------------------------------------
 *                               Scry (WIP)
 * ---------------------------------------------------------------------- */
/** Scry helps keep the game moving by telling you who has and hasn't
  * hit the "Done" button.
  * ---------------------------------------------------------------------- */
const Scry = {
    name: "Scry", // All modules have a name property
    hasMenuButton: true, // Some modules aren't directly controllable
    setting: new SettingsBelt(['off', 'windowed', 'sleek'], 2), // All modules have a SettingsBelt
    keybinds: [
        // This keybind turns off when Scry does, because maybe people use tab as part of their drawing workflow.
        new Keybind((e) => Scry.setting.current() != 'off' && e.code == "Tab", (e) => { console.log("tab"); preventDefaults(e); })
    ],

    activeIndices: new Set(),
    playerDict: {},
    // Initialization. 
    // To be overridden by each module.
    init(modules) { },

    // This function is called whenever the game transitions to a new phase.
    // To be overridden by each module.
    mutation(oldPhase, newPhase) {
        if (oldPhase != 'lobby') { return; }
        Scry.prune();
    },

    // This function "cleans the slate" when a game ends. 
    // To be overridden by each module.
    backToLobby(oldPhase) {
        Scry.prune();
    },

    // This function makes required changes when switching between settings. 
    // To be overridden by each (controllable) module.
    adjustSettings(previous, current) { },

    // This function should set internal states based on the game config
    // depending on the needs of the module.
    // To be overridden by each module that requires more than marginal state knowledge.
    update42(type, data) {
        switch (type) {
            case 2: { // new player joins            42[2,2,{"id":3,"nick":"CoolNickname4534","avatar":21,"owner":false,"viewer":false,"points":0,"change":0,"alert":false},false]
                // const d = Scry.trim(data)
                Scry.playerDict[data.id] = Scry.trim(data);
                Scry.activeIndices.add(data.id);
                break;
            }
            case 3: { // player leaves               42[2,3,{"userLeft":2,"newOwner":null},false]
                Scry.activeIndices.remove(data.userLeft);
                break;
            }
            case 15: {
                console.log(data);
                console.log(Scry.playerDict[data.user]);
                console.log(data.ready);
                break;
            }
            case 21: { // player leaves               42[2,21,{"userLeft":3,"newOwner":null}]
                Scry.activeIndices.remove(data.userLeft);
                break;
            }
            case 22: { // player rejoins / reconnects 42[2,22,3] 
                Scry.activeIndices.add(data);
                break;
            }
            // (TODO: study the way the ids are shuffled/reassigned at start of new turn. It seems like they completely aren't. Memory leak possible?)
            // (i think) there is a memory leak in gartic involving the lack of reassignment of user IDs when people leave, meaning that if you start a lobby and a total of 9 quadrillion people join and leave, things might start going wrong
        }
    },

    trim(dict) {
        const d = {};
        // d.id = dict.id
        d.nick = dict.nick;
        d.avatar = dict.avatar;
    },
    prune() {
        for (const key of Object.keys(Scry.playerDict)) {
            if (!Scry.activeIndices.includes(key)) {
                delete Scry.playerDict.key;
            }
        }
    },
};
Object.setPrototypeOf(Scry, CellulartModule)

export default Scry

