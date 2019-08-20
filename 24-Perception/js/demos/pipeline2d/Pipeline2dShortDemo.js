/**
 * 2D pipeline top-level demo
 * Short pipeline: color-> gray-> sobelx+y-> grads
 */
class Pipeline2dShortDemo extends React.Component {

    constructor(props) {
        super(props);
        this.imageId = 'pipeline2d-short-image';
        this.canvasWidth = 850;
        this.canvasHeight = 420;
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

        context.drawImage(this.img, 0, 100, size, size);
        let imgData = context.getImageData(0, 100, size, size);
        let source = new Array2D([...imgData.data], imgData.width, imgData.height, 4);

        // Convert to grayscale
        grayscale(source);

        fillArray(imgData.data, source.data, imgData.data.length);
        context.putImageData(imgData, 220, 100);

        // Apply Sobel operator horizontally
        let sobelXData = new Array2D([...source.data], source.width, source.height, 4);
        convolve(sobelXData, sobelX);

        // Apply Sobel operator vertically
        let sobelYData = new Array2D([...source.data], source.width, source.height, 4);
        convolve(sobelYData, sobelY);

        // Calculate magnitude of gradients
        const [magGrid, angleGrid] = computeGradients(sobelXData, sobelYData);


        // Display sobels with red-green
        stretchColorRange(sobelXData, -1020, 1020, 0, 1);
        for (let i = 0; i < sobelXData.height; i++) {
            for (let j = 0; j < sobelXData.width; j++) {
                const colorVal = Math.floor(255 * sobelXData.getValue(i, j));
                sobelXData.setValue(colorVal, i, j, 0);
                sobelXData.setValue(colorVal, i, j, 1);
                sobelXData.setValue(colorVal, i, j, 2);
            }
        }
        fillArray(imgData.data, sobelXData.data, imgData.data.length);
        context.putImageData(imgData, 440, 0);

        stretchColorRange(sobelYData, -1020, 1020, 0, 1);
        for (let i = 0; i < sobelYData.height; i++) {
            for (let j = 0; j < sobelYData.width; j++) {
                const colorVal = Math.floor(255 * sobelYData.getValue(i, j));
                sobelYData.setValue(colorVal, i, j, 0);
                sobelYData.setValue(colorVal, i, j, 1);
                sobelYData.setValue(colorVal, i, j, 2);
            }
        }
        fillArray(imgData.data, sobelYData.data, imgData.data.length);
        context.putImageData(imgData, 440, 210);

        stretchColor(magGrid, 0, 255);
        fillArray(imgData.data, magGrid.data, imgData.data.length);
        context.putImageData(imgData, 660, 100);

        // Draw labels
        context.font = "11px Arial";
        context.fillText("Color", 0, 300);
        context.fillText("Grayscale", 220, 300);
        context.fillText("Sobel X", 440, 200);
        context.fillText("Sobel Y", 440, 410);
        context.fillText("Gradients", 660, 300);

        // Draw lines
        context.lineWidth = 2;
        context.beginPath();
        canvasArrowCurveX(context, 0 + size, 100 + size / 2, 220, 100 + size / 2);
        canvasArrowCurveX(context, 220 + size, 100 + size / 2, 440, 0 + size / 2);
        canvasArrowCurveX(context, 220 + size, 100 + size / 2, 440, 210 + size / 2);
        canvasArrowCurveX(context, 440 + size, 0 + size / 2, 660, 100 + size / 2);
        canvasArrowCurveX(context, 440 + size, 210 + size / 2, 660, 100 + size / 2);
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
                                    this.img.src = "./images/vertLines.png";
                                    this.process();
                                }
                            }, 'Vertical Lines')
                        ),
                        e('li', null,
                            e('a', {
                                href: "#",
                                onClick: (e) => {
                                    e.preventDefault();
                                    this.changeInput('image');
                                    this.img.src = "./images/horiLines.png";
                                    this.process();
                                }
                            }, 'Horizontal Lines')
                        ),
                        e('li', null,
                            e('a', {
                                href: "#",
                                onClick: (e) => {
                                    e.preventDefault();
                                    this.changeInput('image');
                                    this.img.src = "./images/gridLines.png";
                                    this.process();
                                }
                            }, 'Crosshatch')
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