// Image intensity topology demo

/**
 * Top level topology demo
 */
class TopologyDemo extends React.Component {

    constructor(props) {
        super(props);
        this.imageId = 'topology-image';
        this.size = 400;
        this.graphInterval = 8;
    }

    /**
     * Process image and build topology
     */
    process() {

        this.canvas = document.getElementById(`${this.imageId}-canvas`);
        const context = this.canvas.getContext('2d');
        const img = document.getElementById(`${this.imageId}-img`);

        // Clear canvas
        context.clearRect(0, 0, this.canvas.width, this.canvas.height);

        context.drawImage(img, 0, 0, this.size, this.size);
        let imgData = context.getImageData(0, 0, this.size, this.size);
        let source = new Array2D([...imgData.data], imgData.width, imgData.height, 4);

        // Convert to grayscale
        grayscale(source);
        fillArray(imgData.data, source.data, imgData.data.length);
        context.putImageData(imgData, 0, 0);

        // Generate topological data
        let topoData = [];
        for (let i = 0; i < source.height; i++) {
            for (let j = 0; j < source.width; j++) {
                if (i % this.graphInterval == 0 && j % this.graphInterval == 0) {
                    let value = source.getValue(i, j);
                    topoData.push({ x: j, y: -i, z: value, style: `rgb(${value}, ${value}, ${value})` });
                }
            }
        }

        // Draw topology map
        let options = {
            width: '100%',
            style: 'surface',
            xBarWidth: this.graphInterval,
            yBarWidth: this.graphInterval,
            zMin: 0,
            showPerspective: true,
            showGrid: false,
            showXAxis: false,
            showYAxis: false,
            showZAxis: false,
            showShadow: false,
            keepAspectRatio: true,
            verticalRatio: 0.5,
        };

        const graphContainer = document.getElementById(`${this.imageId}-topology`);
        const graph = new vis.Graph3d(graphContainer, topoData, options);
        graph.setCameraPosition({ horizontal: 0, vertical: Math.PI / 2, distance: 1.5 });
    }

    render() {

        return e('div', { className: 'demo-container' },
            e(ImageUploader, {
                imageId: this.imageId,
                defaultImage: './images/test.png',
                processHandler: () => this.process(),
            }, null),
            e('div', { className: 'row row-eq-height' },
                e('div', { className: 'col-xs-6'},

                    e('div', null,
                        e('canvas', {
                            id: `${this.imageId}-canvas`,
                            width: this.size,
                            height: this.size,
                            className: 'center',
                            style: {
                                width: '100%',
                            }
                        }, null),
                    ),

                ),
                e('div', { className: 'col-xs-6' },
                    e('div', {
                        id: `${this.imageId}-topology`,
                    }, null),
                ),
            ),
        );
    }
}