/**
 * 2D pipeline top-level demo
 * Direct pipeline: color-> final
 */
class Pipeline2dDirectDemo extends React.Component {

    constructor(props) {
        super(props);
        this.imageId = 'pipeline2d-direct-image';
        this.canvasWidth = 200;
        this.canvasHeight = 200;
        this.state = { isRecording: false };

        this.changeInput = pipelineChangeInput.bind(this);
        this.render = pipelinePairRender.bind(this);
        this.componentDidMount = pipelineComponentDidMount.bind(this);
    }

    /**
     * Do edge detection pipeline on inputted image
     */
    process() {

        const size = 200;
        const inCanvas = document.getElementById(`${this.imageId}-in-canvas`);
        const inContext = inCanvas.getContext('2d');
        const outCanvas = document.getElementById(`${this.imageId}-out-canvas`);
        const outContext = outCanvas.getContext('2d');

        // Clear canvas
        inContext.clearRect(0, 0, inCanvas.width, inCanvas.height);
        outContext.clearRect(0, 0, outCanvas.width, outCanvas.height);

        inContext.drawImage(this.img, 0, 0, size, size);
        let imgData = inContext.getImageData(0, 0, size, size);
        let source = new Array2D([...imgData.data], imgData.width, imgData.height, 4);

        // Convert to grayscale
        grayscale(source);

        // Do gaussian blur with 5x5 filter
        convolve(source, gaussianBlur5);

        // Apply Sobel operator horizontally
        let sobelXData = new Array2D([...source.data], source.width, source.height, 4);
        convolve(sobelXData, sobelX);

        // Apply Sobel operator vertically
        let sobelYData = new Array2D([...source.data], source.width, source.height, 4);
        convolve(sobelYData, sobelY);

        // Calculate magnitude of gradients
        const [magGrid, angleGrid] = computeGradients(sobelXData, sobelYData);
        stretchColor(magGrid);

        // Do non maximum suppression
        let suppressed = nonMaxSuppress(magGrid, angleGrid);

        // Do double threshold
        doubleThreshold(suppressed, 50, 25);

        // Do edge tracking
        edgeConnect(suppressed);

        // Draw final
        fillArray(imgData.data, suppressed.data, imgData.data.length);
        outContext.putImageData(imgData, 0, 0);
    }
}