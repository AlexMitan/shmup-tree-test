const utils = require('../lib/cmutils');

class GameObject {
    constructor(parent=null, addToParent=true, type='gameObject', name=null) {
        this.children = [];
        this.parent = parent;
        this.dead = false;
        if (parent && addToParent) {
            parent.addChild(this);
        }
        this.type = type;
        this.id = GameObject.id;
        this.name = name || `${this.type}-${this.id}`;
        this.setRoot();
        GameObject.id += 1;
    }
    setRoot() {
        let obj = this;
        while (obj.parent != null) {
            obj = obj.parent;
        }
        this.root = obj;
    }
    rootPath() {
        let obj = this;
        let path = [this];
        while (obj.parent != null) {
            obj = obj.parent;
            path.push(obj);
        }
        return path;
    }
    receiveMsg(sender, str, data) {
        GameObject.messagesReceived += 1;
        // handle a message, and by default pass it to children and log it
        let passToChildren = true;
        let log = false;
        if (log) {
            console.log(`${this.name} received ${str} from ${sender.name}`)
        }
        if (str === "cleanup" && this.dead === true) {
            console.log(`${this.name} is being cleaned up.`);
            this.removeFromParent();
            this.remove();
        }
        if (passToChildren) {
            for (let i=this.children.length - 1; i>=0; i--){
                let child = this.children[i];
                child.receiveMsg(sender, str, data);
            }
        }
    }
    sendMsg(str, data) {
        // relay a message directly to the root, to be passed down
        this.root.receiveMsg(this, str, data);
    }
    addChild(gameObj) {
        let childIdx = this.children.indexOf(gameObj);
        if (childIdx == -1){
            this.children.push(gameObj);
            gameObj.parent = this;
        }
    }

    // REMOVAL
    removeChild(gameObj){
        // remove a child from the children array
        let idx = this.children.indexOf(gameObj);
        if (idx > -1){
            this.children.splice(idx, 1);
        }
    }
    removeFromParent() {
        // TODO: figure out if this should always be called in remove()
        if (this.parent !== null) {
            this.parent.removeChild(this);
            this.parent = null;
        }
    }
    remove() {
        // node-specific operations to avoid memory leaks
        // this.removeFromParent();
        this.recurse('remove', false);
    }
    logID() {
        console.log(this.id);
    }
    recurse(fnName, applyToSelf=true) {
        for (let child of this.children) {
            child.recurse(fnName);
        }
        if (applyToSelf && this[fnName]) {
            this[fnName]();
        }
    }
}
GameObject.id = 0;
GameObject.messagesReceived = 0;
if (false) {
    let world = new GameObject(null, false, "world");
    let redFleet = new GameObject(world, true, "redFleet");
    let blueFleet = new GameObject(world, true, "blueFleet");
    
    let redFighter = new GameObject(redFleet, true, "redFighter");
    let blueFighter = new GameObject(blueFleet, true, "blueFighter");
    
    // let redFighterCannon1 = new GameObject(redFighter, true, "redFighterCannon1");
    // let redFighterCannon2 = new GameObject(redFighter, true, "redFighterCannon2");
    // let blueFighterCannon1 = new GameObject(blueFighter, true, "blueFighterCannon1");
    // let blueFighterCannon2 = new GameObject(blueFighter, true, "blueFighterCannon2");
    
    // blueFighter.remove();
    redFleet.recurse('logID');
    // console.log(redFleet);
    blueFighter.sendMsg('PEW PEW REDS!');
    // for (let obj of [redFighter, blueFighterCannon1, redFleet]) {
    //     console.log(obj.getRoot().id);
    // }
}
module.exports = { GameObject };