let positions;

function drawWebcam() {
    image(prevFrame, 0, 0);

    loadPixels();
    video.loadPixels();
    prevFrame.loadPixels();

    // Begin loop to walk through every pixel
    for (var x = 0; x < video.width; x++) {
        for (var y = 0; y < video.height; y++) {

            // Step 1, what is the location into the array
            var loc = (x + y * video.width) * 4;

            // Step 2, what is the previous color
            var r1 = prevFrame.pixels[loc];
            var g1 = prevFrame.pixels[loc + 1];
            var b1 = prevFrame.pixels[loc + 2];

            // Step 3, what is the current color
            var r2 = video.pixels[loc];
            var g2 = video.pixels[loc + 1];
            var b2 = video.pixels[loc + 2];

            // Step 4, compare colors (previous vs. current)
            var diff = dist(r1, g1, b1, r2, g2, b2);

            // Step 5, How different are the colors?
            // If the color at that pixel has changed, then there is motion at that pixel.
            if (diff > threshold) {
                // If motion, display red
                pixels[loc] = 255;
                pixels[loc + 1] = 0;
                pixels[loc + 2] = 0;
                //  pixels[loc + 3] = 255;
            }
            /*else {
                           // If not, display white
                           pixels[loc] = 250;
                           pixels[loc + 1] = 250;
                           pixels[loc + 2] = 250;
                           pixels[loc + 3] = 250;
                       }*/
        }
    }
    updatePixels();

    // Save frame for the next cycle
    //if (video.canvas) {
    prevFrame.copy(video, 0, 0, video.width, video.height, 0, 0, video.width, video.height); // Before we read the new frame, we always save the previous frame for comparison!
    //}
}