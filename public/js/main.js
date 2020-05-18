let video;
let cv;

let pages = [{
        state: true,
        setup: function () {
            setUpSketch()
        },
        draw: function () {}
    },
    {
        state: false,
        setup: function () {},
        draw: function () {
            drawWebcam();
        }
    }
]

function centerCanvas() {
    const x = (windowWidth - width) / 2
    const y = (windowHeight - height) / 2
    cv.position(x, y)
}

function globalSetup() {
    cv = createCanvas(windowWidth / 2, windowHeight / 2);
    background(255);
    video = createCapture(VIDEO);
    video.size(width, height);
    video.hide();
    centerCanvas();

}

function showPage(index) {
    pages.forEach(el => el.state = false);
    pages[index].state = true;
    socket.on('userlist', userlist);
}

function draw() {
    for (i = 0; i < pages.length; i++) {
        if (pages[i].state == true) {
            pages[i].draw();
        }
    }
}

function setup() {
    for (i = 0; i < pages.length; i++) {
        if (pages[i].state == true) {
            globalSetup();
            pages[i].setup();
        }
    }
}