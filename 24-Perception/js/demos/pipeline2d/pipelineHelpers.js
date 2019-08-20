// Pipeline 2d helper functions

/**
 * Change input method
 * @param {string} input - Input method identifier
 */
function pipelineChangeInput(input) {
    if (input == 'webcam' && !this.state.isRecording) {
        this.img = document.getElementById(`${this.imageId}-webcam`);

        // Turn on webcam
        if (navigator.mediaDevices.getUserMedia) {
            let video = document.getElementById(`${this.imageId}-webcam`);

            navigator.mediaDevices.getUserMedia({ video: true })
                .then((stream) => {
                    video.srcObject = stream;
                })
                .then(() => {

                    this.setState({ isRecording: true });

                    let update = () => {
                        if (video.srcObject) {
                            this.process();
                            requestAnimationFrame(update);
                        }
                    }
                    requestAnimationFrame(update);
                })
                .catch((err) => {
                    console.log(err);
                });
        }
    }
    else {

        this.img = document.getElementById(`${this.imageId}-img`);

        // Shut off webcam
        let video = document.getElementById(`${this.imageId}-webcam`);
        let stream = video.srcObject;
        if (stream) {
            let tracks = stream.getTracks();

            for (let i = 0; i < tracks.length; i++) {
                let track = tracks[i];
                track.stop();
            }

            video.srcObject = null;
            this.process();

            this.setState({ isRecording: false });
        }
    }
}

/**
 * Render paired pipeline
 */
function pipelinePairRender() {
    return e('div', { className: 'demo-container' },

        e(PixelMagnifier, {
            imageId: `${this.imageId}-in`,
            isRecording: this.state.isRecording,
        }, null),
        e(PixelMagnifier, {
            imageId: `${this.imageId}-out`,
            isRecording: this.state.isRecording,
        }, null),

        e('div', { style: { display: 'flex', flexDirection: 'row' } },
            e(ImageUploader, {
                imageId: this.imageId,
                defaultImage: './images/test.png',
                processHandler: () => this.process(),
                changeHandler: () => this.changeInput('image'),
            }, null),
            e(WebcamCapture, {
                imageId: this.imageId,
                isRecording: this.state.isRecording,
                processHandler: () => this.process(),
                changeHandler: () => this.changeInput('webcam'),
            }, null),
        ),

        e('br', null, null),
        e('canvas', {
            id: `${this.imageId}-in-canvas`,
            width: this.canvasWidth,
            height: this.canvasHeight,
            style: {
                width: '50%',
            }
        }, null),
        e('canvas', {
            id: `${this.imageId}-out-canvas`,
            width: this.canvasWidth,
            height: this.canvasHeight,
            style: {
                width: '50%',
            }
        }, null),
    );
}

/**
 * Set image on mount
 */
function pipelineComponentDidMount() {
    this.img = document.getElementById(`${this.imageId}-img`);
}