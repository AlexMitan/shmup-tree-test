(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
const { GameObject } = require('./GameObject');
const { SvgGraphics } = require('./Graphics');

const KEY_W = 87,
    KEY_S = 83,
    KEY_A = 65,
    KEY_D = 68,
    KEY_Q = 81,
    KEY_E = 69,
    KEY_SPACE = 32;


function rangeIntersect(min0, max0, min1, max1) {
    return Math.max(min0, max0) >= Math.min(min1, max1) && Math.min(min0, max0) <= Math.max(min1, max1);
};

function boxIntersect(r0, r1) {
    return rangeIntersect(r0.x, r0.x + r0.w, r1.x, r1.x + r1.w) && rangeIntersect(r0.y, r0.y + r0.h, r1.y, r1.y + r1.h);
};
const rand = (min, max) => Math.random() * (max - min) + min; 

class Box extends GameObject {
    constructor(parent, x, y, w, h, fill='white', type='box') {
        super(parent, true, type);
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.vx = 0;
        this.vy = 0;
        this.friction = 0.1;
        this.addChild(new SvgGraphics(this, w, h, fill));
    }
    isOOB() {
        let { x, y, w, h } = this;
        let { xMin, xMax, yMin, yMax } = this.root;
        return (x - w < xMin)
            || (y < yMin)
            || (x + w > xMax)
            || (y + h > yMax)
    }
    
    receiveMsg(sender, str, data) {
        super.receiveMsg(sender, str, data);
        if (str === 'pos') {
            if (sender !== this && sender instanceof Box && boxIntersect(this, sender)) {
                // console.log(`${this.name} colliding with ${sender.name}`);
                this.sendMsg('collide', {bodyA: sender, bodyB: this});
            }
        }
    }
    update() {
        this.vx *= 1 - this.friction;
        this.vy *= 1 - this.friction;
        this.x += this.vx;
        this.y += this.vy;
        this.sendMsg('pos', {});
    }
}
class Player extends Box {
    constructor(parent, x, y) {
        super(parent, x, y, 30, 20, 'yellow', 'player')
        this.shotCooldown = 0;
        this.baseShotCooldown = 10;
        this.hp = 20;
        this.baseHp = 20;
    }
    // receiveMsg(sender, str, data) {
    //     super.receiveMsg(sender, str, data);
    // }
    handleKeyboard(keysDown) {
        // thrust
        if (keysDown[KEY_W] && this.vy > -10) {
            this.vy -= 2;
        }
        if (keysDown[KEY_S] && this.vy < 10) {
            this.vy += 2;
        }
        if (keysDown[KEY_A] && this.vx > -10) {
            this.vx -= 2;
        }
        if (keysDown[KEY_D] && this.vx < 10) {
            this.vx += 2;
        }
        if (keysDown[KEY_SPACE] && this.shotCooldown === 0) {
            this.shotCooldown = this.baseShotCooldown;
            let { x, y, w, h } = this;
            for (let i=0; i<2; i++) {
                let bullet = new Bullet(this, x + w, y + h/2, rand(30, 50), rand(-3, 3), 2, 'player', 'cyan');
                bullet.friction = 0;
                this.addChild(bullet);
            }
        }
    }
    receiveMsg(sender, str, data) {
        super.receiveMsg(sender, str, data);
        if (str === 'collide' && (data.bodyA === this || data.bodyB === this)) {
            
            let other = data.bodyA === this ? data.bodyB : data.bodyA;
            if (other.type === 'bullet' && other.owner !== this) {
                // take damage from bullet
            }
            if (other.type === 'enemy') {
                // take damage from enemy
                this.hp -= other.damage;
                if (this.hp <= 0) {
                    this.sendMsg('death', {});
                    this.remove();
                    this.removeFromParent();
                }
            }
        }
    }
    update() {
        super.update();
        this.shotCooldown = Math.max(this.shotCooldown-1, 0);
        // bounce back
        let { xMin, xMax, yMin, yMax } = this.root;
        let { x, y, w, h } = this;
        if (x < xMin) this.vx = 5;
        if (x + w > xMax) this.vx = -5;
        if (y < yMin) this.vy = 5;
        if (y + h > yMax) this.vy = -5;
    }
}
class Enemy extends Box {
    constructor(parent, x, y, w, h, vx, vy) {
        super(parent, x, y, w, h, 'grey', 'enemy');
        this.vx = vx;
        this.vy = vy;
        this.damage = 5;
        this.shotCooldown = 0;
        this.hp = 8;
        this.baseHp = 8;
        this.baseShotCooldown = 30;
    }
    receiveMsg(sender, str, data) {
        super.receiveMsg(sender, str, data);
        if (str === 'collide' && (data.bodyA === this || data.bodyB === this)) {
            let other = data.bodyA === this ? data.bodyB : data.bodyA;
            if (other.type === 'bullet' && other.owner !== this) {
                // take damage from bullet
                this.hp -= other.damage;
                if (this.hp <= 0) {
                    this.die();
                }
                this.sendMsg('hit', {damage: other.damage});
                other.sendMsg('death', {});
                other.remove();
                other.removeFromParent();
            }
            if (other.type === 'player') {
                this.die();
            }
        }
    }
    die() {
        this.sendMsg('death', {});
        this.remove();
        this.removeFromParent();
    }
    update() {
        super.update();
        let { x, y, w, h } = this;
        if (y < this.root.yMin) this.vy = 5;
        if (y + h > this.root.yMax) this.vy = -5;
        if (this.x < this.root.xMin) {
            this.remove();
            this.removeFromParent();
        }
    }
}
class Star extends Box {
    constructor(parent, x, y, vx, vy, w, h) {
        super(parent, x, y, w, h, 'white', 'star');
        this.vx = vx;
        this.vy = vy;
        this.friction = 0;
    }
    update() {
        super.update();
        if (this.isOOB()) {
            this.remove();
            this.removeFromParent();
        }
    }
}
class Bullet extends Box {
    constructor(parent, x, y, vx, vy, damage, owner='', fill='red') {
        super(parent, x, y, 5, 5, fill, 'bullet');
        this.vx = vx;
        this.vy = vy;
        this.owner = owner;
        this.damage = damage;
    }
    update() {
        super.update();
        if (this.isOOB()) {
            this.remove();
            this.removeFromParent();
        }
    }
}
module.exports = { Player, Bullet, Box, Enemy, Star };
},{"./GameObject":2,"./Graphics":3}],2:[function(require,module,exports){
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
},{"../lib/cmutils":6}],3:[function(require,module,exports){
const { GameObject } = require('./GameObject');
class SvgGraphics extends GameObject {
    constructor(parent, w, h, fill="blue") {
        // parent is a unit
        super(parent, false, 'svgGraphics');
        this.svg = this.root.svg;
        
        this.fill = fill;
        this.name += `-${this.id}`;
        if (!this.svg) {
            console.warn(`Svg for ${this.name} is ${this.svg}`);
        }
    }
    remove() {
        super.remove();
        this.graphic && this.graphic.remove();
        this.dot && this.dot.remove();
        this.healthBar && this.healthBar.remove();
    }
    update() {
        // first time init
        let { x, y, w, h } = this.parent;
        if (!this.graphic) {
            let { fill } = this;
            this.graphic = svgRect(this.svg, x, y, w, h, fill);
            // this.dot = svgRect(this.svg, x, y, 2, 2, 'red');
            if (this.parent.hp) {
                let { hp, baseHp } = this.parent;
                this.healthBar = svgRect(this.svg, x, y + h + 5, 30 * hp / baseHp, 5, 'green');
            }
        }
        this.graphic && this.graphic.attr('transform', getTransform(x, y));
        this.dot && this.dot.attr('transform', getTransform(x, y));
        if (this.healthBar) {
            let { hp, baseHp } = this.parent;
            this.healthBar.attr('width', 30 * hp / baseHp);
            this.healthBar.attr('transform', getTransform(x, y + h + 5));
        }
    }
    receiveMsg(sender, str, data) {
        super.receiveMsg(sender, str, data);
        if (str === "update") {
            this.update();
        }
        if (str === "death" && sender === this.parent) {
            let { x, y, w, h } = this.parent;
            let fill = this.parent.type === 'bullet' ? 'cyan' : 'orange';
            let size = this.parent.type === 'bullet' ? 15 : w + h;
            let duration = this.parent.type === 'bullet' ? 250 : 500;
            boom(this.svg, x + w/2, y + h/2, size, duration, fill);
        }
    }

}
class Score extends GameObject {
    constructor(parent, x, y) {
        super(parent, true, 'score');
        this.x = x;
        this.y = y;
        this.svg = this.root.svg;
        this.score = 0;
    }
    update() {
        let { x, y } = this;
        if (!this.graphic) {
            this.graphic = this.svg.append('svg:text').attrs({'x': x, 'y': y})
                .attr("font-family", "sans-serif")
                .attr("font-size", "20px")
                .attr("fill", "white");
        } else {
            this.graphic.text(this.score);
        }
    }
    receiveMsg(sender, str, data) {
        super.receiveMsg(sender, str, data);
        if (str === 'hit' && sender.type === 'enemy') {
            this.score += 10;
        }
        if (str === 'death' && sender.type === 'enemy') {
            this.score += 100;
        }
    }
}
const getTransform = (x, y, ang=0, scale=1) => `translate(${x} ${y})` + `rotate(${ang})` + `scale(${scale})`;

function beam(svg, x0, y0, x1, y1, duration) {
    svg.append('path')
        .attr('d', `M${x0} ${y0} L${x1} ${y1} L${x1} ${y1+2} Z`)
        .attr('fill', 'orange')
        .transition()
            .duration(duration)
            .style('opacity', 0)
            .remove();
}

function shoot(svg, x0, y0, x1, y1, duration, fill='orange') {
    for (let i=0; i<1; i++) {
        svg.append('circle')
            .attrs({'cx':x0, 'cy':y0, 'r':5, 'fill':fill})
            .transition(d3.easeLinear)
                .delay(i * 10)
                .duration(duration)
                .attrs({'cx':x1, 'cy':y1})
                .remove()
                .on('end', () => boom(svg, x1, y1, 40, 200, fill));
    }
}

function boom(svg, x, y, size, duration, fill='orange') {
    svg.append('ellipse')
        .attrs({'cx': x, 'cy': y, 'rx': 0.1 * size, 'ry': 0.05 * size, 'fill': fill})
        .transition()
            .duration(duration)
            .attrs({'rx': size, 'ry': size})
            .style('opacity', 0)
            .remove();
}

function svgRect(svg, x, y, w, h, fill='blue') {
    return svg.append(`rect`)
        .attrs({'width':w, 'height':h, 'fill':fill})
        .attr('transform', getTransform(x-w/2, y-h/2))
    // return svg.append('circle')
    //         .attrs({'cx':x, 'cy':y, 'r':10, 'fill':fill})
}

module.exports = { SvgGraphics, svgRect, Score };

},{"./GameObject":2}],4:[function(require,module,exports){
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

    receiveMsg(sender, str, data) {
        super.receiveMsg(sender, str, data);
        if (str === 'death' && sender.type === 'player') {
            this.gameOver = true;
        }
    }
}

module.exports = { World };
},{"./GameObject":2}],5:[function(require,module,exports){
window.onload = function() {
    const { GameObject } = require('./classes/GameObject');
    const { World } = require('./classes/World');
    const { Player, Bullet, Enemy, Star } = require('./classes/Entities');
    const { SvgGraphics, svgRect, Score } = require('./classes/Graphics');
    const utils = require('./lib/cmutils');
    // const d3 = require('./lib/d3.v5');
    let fps = 30,
        tick = 1;

    let width = window.innerWidth - 40,
        height = window.innerHeight - 40;

    // input
    let keysDown = {};
    document.body.addEventListener('keydown', function(e) {
        keysDown[e.which] = true;
        // console.log(e.which);
    });
    document.body.addEventListener('keyup', function(e) {
        keysDown[e.which] = false;
    });

    let world = new World();
    // add an svg
    let svg = d3.select("body")
        .append("svg")
        .attr("width", width)
        .attr("height", height);
    world.svg = svg;
    // background
    svg.append('rect')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', width)
        .attr('height', height)
        .attr('fill', 'black');
    let { xMin, yMin, xMax, yMax } = world;
    let gameW = xMax - xMin;
    let gameH = yMax - yMin;
    // draw borders
    // top
    svg.append('rect').attrs({'x': xMin, 'y': yMin, 'width': gameW, 'height': 5, 'fill' :'white'});
    // bottom
    svg.append('rect').attrs({'x': xMin, 'y': yMax, 'width': gameW, 'height': 5, 'fill' :'white'});
    // left
    svg.append('rect').attrs({'x': xMin, 'y': yMin, 'width': 5, 'height': gameH, 'fill' :'white'});
    // right
    svg.append('rect').attrs({'x': xMax, 'y': yMin, 'width': 5, 'height': gameH, 'fill' :'white'});
    
    // instructions
    svg.append('svg:text').attrs({'x': 50, 'y': yMax + 50})
                .attr("font-family", "sans-serif")
                .attr("font-size", "20px")
                .attr("fill", "white")
                .text("WASD to move, Space to shoot");

    // svgRect(svg, 200, 200, 40, 40, 'red');
    world.addChild(new Score(world, 30, 30));
    let player = new Player(world, 100, 100);
    player.addChild(new SvgGraphics(player, 20, 40, 'yellow'));
    const rand = (min, max) => Math.random() * (max - min) + min;
    let turn = 0;
    let enemyCooldown = 50;
    let starCooldown = 10;
    world.gameOver = false;
    function update() {
        // rerender
        world.recurse("update", true);
        world.sendMsg("cleanup");
        if (turn % starCooldown == 0) {
            starCooldown = ~~rand(2, 20);
            let closeness = rand(0.1, 1);
            world.addChild(new Star(world, gameW, rand(0, gameH), -closeness*20, 0, closeness*5, closeness*5));
        }
        if (turn % enemyCooldown == 0) {
            enemyCooldown = ~~rand(10, 70);
            let enemy = new Enemy(world, gameW, rand(0, gameH-40), rand(40, 80), rand(50, 70), rand(-5, -10), rand(-5, 5));
            enemy.friction = 0;
            // world.addChild(enemy);
        }
        turn += 1;
        player.handleKeyboard(keysDown);
        player.update();
        if (!world.gameOver) {
            setTimeout(update, 30);
        } else {
            svg.append('svg:text').attrs({'x': xMax / 2 + xMin, 'y': yMax / 2 + yMin})
                .attr("font-family", "sans-serif")
                .attr("font-size", "50px")
                .attr("fill", "white")
                .text("Game over!");
        }
    }
    update();
}



},{"./classes/Entities":1,"./classes/GameObject":2,"./classes/Graphics":3,"./classes/World":4,"./lib/cmutils":6}],6:[function(require,module,exports){
const cmutils = {};


// utility function for printing objects using their `toString` methods
cmutils.log = (...any) => console.log(...any.map(String));

// Array ops

cmutils.pickFrom = function(arr) {
    var i = Math.floor(Math.random() * arr.length);
    return arr[i];
}

cmutils.shuffle = function(array) {
    var currentIndex = array.length, temporaryValue, randomIndex;
  
    // While there remain elements to shuffle...
    while (0 !== currentIndex) {
  
        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;
    
        // And swap it with the current element.
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }
  
    return array;
}

cmutils.makeFromArr = function(arr, len) {
    var elem = "";
    for (var i = 0; i < len; i++) {
        elem += pickFrom(arr);
    }
    return elem;
}

cmutils.removeFromArr = function(arr, elem) {
    let idx = arr.indexOf(elem);
    if (idx > -1){
        arr.splice(idx, 1);
    }
}

cmutils.addToArrUnique = function(arr, elem) {
    let idx = arr.indexOf(elem);
    if (idx === -1){
        arr.push(elem);
    }
}

// Angle conversions

cmutils.degToRad = function(deg) {
    return deg / 180 * Math.PI;
}
cmutils.radToDeg = function(rad) {
    return rad * 180 / Math.PI;
}

cmutils.getVal = function(ctx, x, y) {
    var ext = ctx.getImageData(x, y, 1, 1).data;
    if (ext[3] == 0) {
        return 0;
    } else {
        return (ext[0] + ext[1] + ext[2]) / 3 / 2.56;
    }
}

cmutils.genMat = function(w, h, init, explicit) {
    var mat = [];
    for (var x = 0; x < w; x++) {
        mat.push([]);
        for (var y = 0; y < h; y++) {
            mat[x].push(init || 0);
        }
    }
    if (explicit) {
        console.log("made matrix:", mat);
    }
    return mat;
}

cmutils.logMat = function(mat) {
    for (var y = mat[0].length - 1; y >= 0; y--) {
        var str = ""
        for (var x = 0; x < mat.length; x++) {
            str += (mat[x][y] ? mat[x][y] : "#") + ",";
        }
        console.log(str);
        console.log("");
    }
}


cmutils.randomWithin = function(rMin, rMax, seed) {
    if (seed === undefined) {
        var max = rMax || 1;
        var min = rMin || 0;
        return min + Math.random() * (max - min);
    } else {
        //Seeded random algorithm from http://indiegamr.com/generate-repeatable-random-numbers-in-js/
        var max = rMax || 1;
        var min = rMin || 0;
        seed = (seed * 9301 + 49297) % 233280;
        var rnd = seed / 233280.0;
        return min + rnd * (max - min);
    }
}

cmutils.norm = function(value, min, max) {
    return (value - min) / (max - min);
};

cmutils.lerp = function(norm, min, max) {
    return (max - min) * norm + min;
};

cmutils.map = function(value, sourceMin, sourceMax, destMin, destMax) {
    return lerp(norm(value, sourceMin, sourceMax), destMin, destMax);
};

cmutils.clamp = function(value, min, max) {
    return Math.min(Math.max(value, Math.min(min, max)), Math.max(min, max));
};

cmutils.distP = function(p0, p1) {
    var dx = p0.x - p1.x,
        dy = p0.y - p1.y;
    return Math.sqrt(dx * dx + dy * dy);
};

cmutils.dist = function(x0, y0, x1, y1) {
    var dx = x1 - x0,
        dy = y1 - y0;
    return Math.sqrt(dx * dx + dy * dy);
};

cmutils.randomFloat = function(min, max) {
    return min + Math.random() * (max - min);
};

cmutils.randomInt = function(min, max) {
    return Math.floor(min + Math.random() * (max - min + 1));
};

cmutils.inRange = function(value, min, max) {
    return value >= Math.min(min, max) && value <= Math.max(min, max);
};

cmutils.angleQuad = function(angle) {
    if (angle >= 0)
        if (angle <= Math.PI / 2)
            return 1;
        else return 2;
    else return 0;
};

cmutils.circleCollision = function(c0, c1) {
    return utils.distance(c0, c1) <= c0.radius + c1.radius;
};

cmutils.circlePointCollision = function(x, y, circle) {
    return utils.distanceXY(x, y, circle.x, circle.y) < circle.radius;
};

cmutils.pointInRect = function(x, y, rect) {
    return utils.inRange(x, rect.x, rect.x + rect.width) && utils.inRange(y, rect.y, rect.y + rect.height);
};

cmutils.rangeIntersect = function(min0, max0, min1, max1) {
    return Math.max(min0, max0) >= Math.min(min1, max1) && Math.min(min0, max0) <= Math.max(min1, max1);
};
cmutils.boxIntersect = function(r0, r1) {
    return cmutils.rangeIntersect(r0.x, r0.x + r0.w, r1.x, r1.x + r1.w) && rangeIntersect(r0.y, r0.y + r0.h, r1.y, r1.y + r1.h);
};

cmutils.segmentIntersect = function(p0, p1, p2, p3) {
    var A1 = p1.y - p0.y,
        B1 = p0.x - p1.x,
        C1 = A1 * p0.x + B1 * p0.y,
        A2 = p3.y - p2.y,
        B2 = p2.x - p3.x,
        C2 = A2 * p2.x + B2 * p2.y,
        denominator = A1 * B2 - A2 * B1;

    if (denominator === 0) {
        return null;
    }

    var intersectX = (B2 * C1 - B1 * C2) / denominator,
        intersectY = (A1 * C2 - A2 * C1) / denominator,
        rx0 = (intersectX - p0.x) / (p1.x - p0.x),
        ry0 = (intersectY - p0.y) / (p1.y - p0.y),
        rx1 = (intersectX - p2.x) / (p3.x - p2.x),
        ry1 = (intersectY - p2.y) / (p3.y - p2.y);

    if (((rx0 >= 0 && rx0 <= 1) || (ry0 >= 0 && ry0 <= 1)) &&
        ((rx1 >= 0 && rx1 <= 1) || (ry1 >= 0 && ry1 <= 1))) {
        return {
            x: intersectX,
            y: intersectY
        };
    } else {
        return null;
    }
}

cmutils.segTouching = function(s0, s1) {
    if (s0.x0 == s1.x1 && s0.y0 == s1.y1 ||
        s0.x1 == s1.x0 && s0.y1 == s1.y0 ||
        s0.x0 == s1.x0 && s0.y0 == s1.y0 ||
        s0.x1 == s1.x1 && s0.y1 == s1.y1) {
        return true;
    }
    return false;
}

cmutils.segInters = function(s0, s1, allowTouching) {
    if (!allowTouching && segTouching(s0, s1)) {
        return null;
    }
    var A1 = s0.y1 - s0.y0,
        B1 = s0.x0 - s0.x1,
        C1 = A1 * s0.x0 + B1 * s0.y0,
        A2 = s1.y1 - s1.y0,
        B2 = s1.x0 - s1.x1,
        C2 = A2 * s1.x0 + B2 * s1.y0,
        denominator = A1 * B2 - A2 * B1;

    var A1 = s0.y1 - s0.y0,
        B1 = s0.x0 - s0.x1,
        C1 = A1 * s0.x0 + B1 * s0.y0,
        A2 = s1.y1 - s1.y0,
        B2 = s1.x0 - s1.x1,
        C2 = A2 * s1.x0 + B2 * s1.y0,
        denominator = A1 * B2 - A2 * B1;

    if (denominator === 0) {
        return null;
    }

    var intersectX = (B2 * C1 - B1 * C2) / denominator,
        intersectY = (A1 * C2 - A2 * C1) / denominator,
        rx0 = (intersectX - s0.x0) / (s0.x1 - s0.x0),
        ry0 = (intersectY - s0.y0) / (s0.y1 - s0.y0),
        rx1 = (intersectX - s1.x0) / (s1.x1 - s1.x0),
        ry1 = (intersectY - s1.y0) / (s1.y1 - s1.y0);

    if (((rx0 >= 0 && rx0 <= 1) || (ry0 >= 0 && ry0 <= 1)) &&
        ((rx1 >= 0 && rx1 <= 1) || (ry1 >= 0 && ry1 <= 1))) {
        return {
            x: intersectX,
            y: intersectY
        };
    } else {
        return null;
    }
}

module.exports = cmutils;
},{}]},{},[5]);
