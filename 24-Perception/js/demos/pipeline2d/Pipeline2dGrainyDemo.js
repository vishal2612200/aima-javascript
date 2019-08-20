/**
 * 2D pipeline top-level demo
 * Direct pipeline: grainy grayscale -> sobel
 */
class Pipeline2dGrainyDemo extends React.Component {

    constructor(props) {
        super(props);
        this.imageId = 'pipeline2d-griany-image';
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

        // Add noise
        noisify(source);
        fillArray(imgData.data, source.data, imgData.data.length);
        inContext.putImageData(imgData, 0, 0);

        // Apply Sobel operator horizontally
        let sobelXData = new Array2D([...source.data], source.width, source.height, 4);
        convolve(sobelXData, sobelX);

        // Apply Sobel operator vertically
        let sobelYData = new Array2D([...source.data], source.width, source.height, 4);
        convolve(sobelYData, sobelY);

        // Calculate magnitude of gradients
        const [magGrid, angleGrid] = computeGradients(sobelXData, sobelYData);
        stretchColor(magGrid);

        // Draw final
        fillArray(imgData.data, magGrid.data, imgData.data.length);
        outContext.putImageData(imgData, 0, 0);
    }
    
}