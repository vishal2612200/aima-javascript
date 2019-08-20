/**
 * 2D pipeline top-level demo
 * Long pipeline: color-> gray-> blur-> grads-> nonmax-> dubthresh-> hystersis
 */
class Pipeline2dLongDemo extends React.Component {

    constructor(props) {
        super(props);
        this.imageId = 'pipeline2d-long-image';
        this.canvasWidth = 850;
        this.canvasHeight = 440;
        this.state = { isRecording: false };

        this.changeInput = pipelineChangeInput.bind(this);
        this.componentDidMount = pipelineComponentDidMount.bind(this);

        this.canvas = null;
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

        context.drawImage(this.img, 0, 0, size, size);
        let imgData = context.getImageData(0, 0, size, size);
        let source = new Array2D([...imgData.data], imgData.width, imgData.height, 4);

        // Convert to grayscale
        grayscale(source);

        fillArray(imgData.data, source.data, imgData.data.length);
        context.putImageData(imgData, 200, 0);

        // Do gaussian blur with 5x5 filter
        convolve(source, gaussianBlur5);

        fillArray(imgData.data, source.data, imgData.data.length);
        context.putImageData(imgData, 400, 0);

        // Apply Sobel operator horizontally
        let sobelXData = new Array2D([...source.data], source.width, source.height, 4);
        convolve(sobelXData, sobelX);

        // Apply Sobel operator vertically
        let sobelYData = new Array2D([...source.data], source.width, source.height, 4);
        convolve(sobelYData, sobelY);

        // Calculate magnitude of gradients
        const [magGrid, angleGrid] = computeGradients(sobelXData, sobelYData);
        stretchColor(magGrid);

        fillArray(imgData.data, magGrid.data, imgData.data.length);
        context.putImageData(imgData, 600, 0);

        // Do non maximum suppression
        let suppressed = nonMaxSuppress(magGrid, angleGrid);
        fillArray(imgData.data, suppressed.data, imgData.data.length);
        context.putImageData(imgData, 200, 230);

        // Do double threshold
        doubleThreshold(suppressed, 50, 25);
        fillArray(imgData.data, suppressed.data, imgData.data.length);
        context.putImageData(imgData, 400, 230);

        // Do edge tracking
        edgeConnect(suppressed);
        fillArray(imgData.data, suppressed.data, imgData.data.length);
        context.putImageData(imgData, 600, 230);

        // Draw labels
        context.font = "11px Arial";
        context.fillText("Color", 0, 200);
        context.fillText("Grayscale", 200, 200);
        context.fillText("Gaussian Blur", 400, 200);
        context.fillText("Gradients", 600, 200);
        context.fillText("Non-Maximum Suppression", 200, 430);
        context.fillText("Double Thresholding", 400, 430);
        context.fillText("Edge Tracking by Hysteresis", 600, 430);
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