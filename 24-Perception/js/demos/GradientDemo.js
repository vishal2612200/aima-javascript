// Gradient demo

/**
 * Top level gradient demo
 */
class GradientDemo extends React.Component {

    constructor(props) {
        super(props);

        // Generate source array2d
        const size = 20;

        this.source = new Array2D(Array.from({ length: 4 * size * size }, () => 255), size, size, 4);
        this.process();
    }

    loadStarter() {
        // Set starter image
        const img = new Image(20, 20);
        img.onload = () => {
            const canvas = document.getElementById('gradient-starter-canvas');
            const context = canvas.getContext('2d');
            context.drawImage(img, 0, 0, 20, 20);
            const imgData = context.getImageData(0, 0, 20, 20);
            this.source = new Array2D([...imgData.data], imgData.width, imgData.height, 4);

            this.setState({
                grid: this.source,
            });
        };
        img.src = "./images/starter.png";
    }

    componentDidMount() {
        this.loadStarter();
    }

    /**
     * Computes gradient and draws vector field
     */
    process() {

        // Apply Sobel operator horizontally
        this.sobelXData = new Array2D([...this.source.data], this.source.width, this.source.height, 4);
        convolve(this.sobelXData, sobelX);

        // Apply Sobel operator vertically
        this.sobelYData = new Array2D([...this.source.data], this.source.width, this.source.height, 4);
        convolve(this.sobelYData, sobelY);

        // Compute mag and angle
        let [magGrid, angleGrid] = computeGradients(this.sobelXData, this.sobelYData);
        this.magGrid = magGrid;
        this.angleGrid = angleGrid;
    }

    /**
     * Updates source when drawing with mouse
     * 
     * @param {integer} row 
     * @param {integer} col 
     */
    drawHandler(row, col) {
        for (let i = -2; i <= 2; i++) {
            for (let j = -2; j <= 2; j++) {
                // Stamp circle on drawing
                if (row + i >= 0 && row + i < this.source.height && col + j >= 0 && col + j < this.source.width) {
                    let value = Math.max(0, Math.min(255, 100 * mag2d(i, j), this.source.getValue(row + i, col + j)));
                    this.source.setValue(value, row + i, col + j);
                }
            }
        }

        this.setState({
            grid: this.source,
        });
    }

    /**
     * Clears drawing
     */
    reset() {
        createClear(this.source);

        this.setState({
            grid: this.source,
        });
    }

    render() {
        this.process();

        return e('div', null,
            e('canvas', {
                id: 'gradient-starter-canvas',
                width: '20',
                height: '20',
                hidden: true,
            }, null),
            e('div', { className: 'demo-container' },

                e('div', { style: { display: 'flex', flexDirection: 'row' } },
                    e('div', { className: 'btn-group' },
                        e('div', { className: 'btn btn-danger', onClick: () => this.reset() },
                            e('i', { className: 'fas fa-eraser' }, null),
                        ),
                        e('div', {
                            className: 'btn btn-info', onClick: () => {
                                this.loadStarter();
                            }
                        }, e('i', { className: 'fas fa-undo' }, null)),
                    ),
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
                                        createVerticalLine(this.source);
                                        this.setState({
                                            grid: this.source,
                                        });
                                    }
                                }, 'Vertical Line')
                            ),
                            e('li', null,
                                e('a', {
                                    href: "#",
                                    onClick: (e) => {
                                        e.preventDefault();
                                        createHorizontalLine(this.source);
                                        this.setState({
                                            grid: this.source,
                                        });
                                    }
                                }, 'Horizontal Line')
                            ),
                            e('li', null,
                                e('a', {
                                    href: "#",
                                    onClick: (e) => {
                                        e.preventDefault();
                                        createDiagonalLine(this.source);
                                        this.setState({
                                            grid: this.source,
                                        });
                                    }
                                }, 'Diagonal Line')
                            ),
                            e('li', null,
                                e('a', {
                                    href: "#",
                                    onClick: (e) => {
                                        e.preventDefault();
                                        createRadialGradient(this.source);
                                        this.setState({
                                            grid: this.source,
                                        });
                                    }
                                }, 'Radial Gradient')
                            ),
                            e('li', null,
                                e('a', {
                                    href: "#",
                                    onClick: (e) => {
                                        e.preventDefault();
                                        createLineGradient(this.source);
                                        this.setState({
                                            grid: this.source,
                                        });
                                    }
                                }, 'Horizontal Gradient')
                            ),
                        ),
                    ),
                ),
                e('br', null, null),
                e('div', { className: 'row' },
                    e('div', { className: 'col-xs-12' },
                        e(GradientGrid, {
                            idBase: 'gradient',
                            gridUnit: 2,
                            source: this.source,
                            magGrid: this.magGrid,
                            sobelX: this.sobelXData,
                            sobelY: this.sobelYData,
                            drawHandler: (i, j) => this.drawHandler(i, j),
                        }, null),
                    ),
                ),
            )
        );
    }
}