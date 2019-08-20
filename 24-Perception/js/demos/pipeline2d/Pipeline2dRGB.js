/**
 * 2D pipeline top-level demo
 * RGB pipeline color -> rgb -> grayscale
 */
class Pipeline2dRGB extends React.Component {

    constructor(props) {
        super(props);
        this.imageId = 'pipeline2d-rgb-image';
        this.canvasWidth = 1000;
        this.canvasHeight = 600;
        this.canvas = null;
        this.state = { isRecording: false };

        this.changeInput = pipelineChangeInput.bind(this);
        this.componentDidMount = pipelineComponentDidMount.bind(this);
    }

    /**
     * Do edge detection pipeline on inputted image
     */
    process() {

        const size = 190;
        this.canvas = document.getElementById(`${this.imageId}-canvas`);
        const context = this.canvas.getContext('2d');

        // Clear canvas
        context.clearRect(0, 0, this.canvas.width, this.canvas.height);

        context.drawImage(this.img, 0, 200, size, size);
        let imgData = context.getImageData(0, 200, size, size);
        let source = new Array2D([...imgData.data], imgData.width, imgData.height, 4);
        let rSource = new Array2D([...imgData.data], imgData.width, imgData.height, 4);
        let gSource = new Array2D([...imgData.data], imgData.width, imgData.height, 4);
        let bSource = new Array2D([...imgData.data], imgData.width, imgData.height, 4);

        filterColor(rSource, 1, 0, 0);
        fillArray(imgData.data, rSource.data, imgData.data.length);
        context.putImageData(imgData, 400, 0);

        filterColor(gSource, 0, 1, 0);
        fillArray(imgData.data, gSource.data, imgData.data.length);
        context.putImageData(imgData, 400, 200);

        filterColor(bSource, 0, 0, 1);
        fillArray(imgData.data, bSource.data, imgData.data.length);
        context.putImageData(imgData, 400, 400);

        grayscale(source);
        fillArray(imgData.data, source.data, imgData.data.length);
        context.putImageData(imgData, 800, 200);

        // Draw lines
        context.lineWidth = 2;
        context.beginPath();
        canvasArrowCurveX(context, 0 + size, 200 + size / 2, 400, 0 + size / 2);
        canvasArrowCurveX(context, 0 + size, 200 + size / 2, 400, 200 + size / 2);
        canvasArrowCurveX(context, 0 + size, 200 + size / 2, 400, 400 + size / 2);
        canvasArrowCurveX(context, 400 + size, 0 + size / 2, 800, 200 + size / 2);
        canvasArrowCurveX(context, 400 + size, 200 + size / 2, 800, 200 + size / 2);
        canvasArrowCurveX(context, 400 + size, 400 + size / 2, 800, 200 + size / 2);
        context.stroke();
    }

    render() {
        return e('div', { className: 'demo-container' },

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
                e('div', { style: { display: 'flex', flex: 1 } }, null),

                e('div', { className: 'dropdown' },
                    e('a', {
                        className: 'btn btn-info dropdown-toggle',
                        'data-toggle': 'dropdown',
                    }, 'Presets ', e('b', { className: 'caret' }, null)),
                    e('ul', { className: 'dropdown-menu dropdown-menu-right' },
                        e('li', null,
                            e('a', {
                                href: "#",
                                onClick: (e) => {
                                    e.preventDefault();
                                    this.changeInput('image');
                                    this.img.src = "../third-party/leds.jpg";
                                    this.process();
                                }
                            }, 'RGB')
                        ),
                        e('li', null,
                            e('a', {
                                href: "#",
                                onClick: (e) => {
                                    e.preventDefault();
                                    this.changeInput('image');
                                    this.img.src = "../third-party/piripiri.jpg";
                                    this.process();
                                }
                            }, 'Red-Green')
                        ),
                        e('li', null,
                            e('a', {
                                href: "#",
                                onClick: (e) => {
                                    e.preventDefault();
                                    this.changeInput('image');
                                    this.img.src = "./images/world.jpg";
                                    this.process();
                                }
                            }, 'Green-Blue')
                        ),
                    ),
                ),
            ),

            e('br', null, null),
            e('canvas', {
                id: `${this.imageId}-canvas`,
                width: this.canvasWidth,
                height: this.canvasHeight,
                style: {
                    width: '100%',
                }
            }, null),
        );
    }
}