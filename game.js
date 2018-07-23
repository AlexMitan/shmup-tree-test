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


