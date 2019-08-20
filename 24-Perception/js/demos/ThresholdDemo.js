/**
 * Double threshold top-level demo
 */
export default class ThresholdDemo extends React.Component {

    constructor(props) {
        super(props);

        this.imageId = 'threshold';

        this.suppressed = null;

        this.state = {
            hiThreshold: 125,
            loThreshold: 50,
        }

        $(window).resize(() => this.resize());
    }

    componentDidMount() {
        this.canvas = document.getElementById(`${this.imageId}-canvas`);

        $("#slider-range").slider({
            range: true,
            min: 0,
            max: 255,
            values: [this.state.loThreshold, this.state.hiThreshold],
            slide: (event, ui) => {
                this.setState({
                    loThreshold: ui.values[0],
                    hiThreshold: ui.values[1],
                });
            }
        });

        this.resize();
    }

    resize() {
        if (innerWidth > 700) {
            this.canvas.style.width = (innerWidth / 2 - 200) + 'px';
        }
        else {
            this.canvas.style.width = (innerWidth - 100) + 'px';
        }
    }

    /**
     * Process image on upload
     */
    process() {

        if (this.canvas == null) {
            return;
        }

        const context = this.canvas.getContext('2d');
        const img = document.getElementById(`${this.imageId}-img`);

        // Clear canvas
        context.clearRect(0, 0, this.canvas.width, this.canvas.height);

        context.drawImage(img, 0, 0, 200, 200);
        let imgData = context.getImageData(0, 0, 200, 200);
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
        this.suppressed = nonMaxSuppress(magGrid, angleGrid);

        // Do threshold
        this.updateThreshold();
    }

    /**
     * Updates image on threshold value change
     */
    updateThreshold() {

        if (this.suppressed == null) {
            return;
        }

        // Do double threshold
        const context = this.canvas.getContext('2d');
        let imgData = context.getImageData(0, 0, 200, 200);

        let temp = new Array2D([...this.suppressed.data], this.suppressed.width, this.suppressed.height, this.suppressed.channels);

        doubleThreshold(temp, this.state.hiThreshold, this.state.loThreshold);
        fillArray(imgData.data, temp.data, imgData.data.length);
        context.putImageData(imgData, 0, 0);
    }

    render() {

        this.updateThreshold();

        return e('div', { className: 'demo-container' },
            e(ImageUploader, {
                imageId: this.imageId,
                defaultImage: '../images/test.png',
                processHandler: () => this.process(),
            }, null),
            e('br', null, null),
            e('div', { id: 'slider-range' }, null),
            e('br', null, null),
            e('canvas', {
                id: `${this.imageId}-canvas`,
                className: 'center',
                width: 200,
                height: 200,
            }, null),
        );
    }
}