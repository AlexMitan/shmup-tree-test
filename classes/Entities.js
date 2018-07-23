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