const { GameObject } = require('./GameObject');

class World extends GameObject{
    constructor() {
        super(null, false, 'world', 'world');
        this.stats = {
        }
        this.xMin = 0;
        this.yMin = 0;
        this.xMax = 700;
        this.yMax = 400;
    }

    // receiveMsg(sender, str, data) {
    //     super.receiveMsg(sender, str, data);
    // }
}

module.exports = { World };