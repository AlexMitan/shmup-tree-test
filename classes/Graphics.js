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
