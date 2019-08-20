// Non-maximum suppression demo UI

/**
 * Top level non-maximum suppression demo
 */
export default class SuppressionDemo extends React.Component {

    constructor(props) {
        super(props);

        const size = 5;
        this.source = new Array2D(Array.from({ length: 4 * size * size }, () => 255), size, size, 4);
        this.highlightMask = new Array2D(Array.from({ length: size * size }, () => false), size, size, 1);
        this.magGrid = null;
        this.sobelXData = null;
        this.sobelYData = null;

        this.isSuppressed = false;
    }

    /**
     * Computes gradient, draws vector field, and highlights neighbors
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

        // Highlight and collect mags for interested cells
        this.highlightMask = new Array2D(
            Array.from({ length: this.source.width * this.source.height }, () => false),
            this.source.width, this.source.height, 1);

        this.highlightMask.setValue(true, this.source.centerRow, this.source.centerCol);

        const currMag = this.magGrid.getValue(this.source.centerRow, this.source.centerCol);
        let mags = [currMag];

        if (this.magGrid.getValue(this.source.centerRow, this.source.centerCol)) {
            const angle = this.angleGrid.getValue(this.source.centerRow, this.source.centerCol);

            if (angle >= 0 && angle < Math.PI / 8) {
                this.highlightMask.setValue(true, this.source.centerRow, this.source.centerCol - 1);
                this.highlightMask.setValue(true, this.source.centerRow, this.source.centerCol + 1);
                mags.push(magGrid.getValue(this.source.centerRow, this.source.centerCol - 1));
                mags.push(magGrid.getValue(this.source.centerRow, this.source.centerCol + 1));
            }
            else if (angle >= Math.PI / 8 && angle < 3 * Math.PI / 8) {
                this.highlightMask.setValue(true, this.source.centerRow - 1, this.source.centerCol + 1);
                this.highlightMask.setValue(true, this.source.centerRow + 1, this.source.centerCol - 1);
                mags.push(magGrid.getValue(this.source.centerRow - 1, this.source.centerCol + 1));
                mags.push(magGrid.getValue(this.source.centerRow + 1, this.source.centerCol - 1));
            }
            else if (angle >= 3 * Math.PI / 8 && angle < 5 * Math.PI / 8) {
                this.highlightMask.setValue(true, this.source.centerRow - 1, this.source.centerCol);
                this.highlightMask.setValue(true, this.source.centerRow + 1, this.source.centerCol);
                mags.push(magGrid.getValue(this.source.centerRow - 1, this.source.centerCol));
                mags.push(magGrid.getValue(this.source.centerRow + 1, this.source.centerCol));
            }
            else if (angle >= 5 * Math.PI / 8 && angle < 7 * Math.PI / 8) {
                this.highlightMask.setValue(true, this.source.centerRow - 1, this.source.centerCol - 1);
                this.highlightMask.setValue(true, this.source.centerRow + 1, this.source.centerCol + 1);
                mags.push(magGrid.getValue(this.source.centerRow - 1, this.source.centerCol - 1));
                mags.push(magGrid.getValue(this.source.centerRow + 1, this.source.centerCol + 1));
            }
            else {
                this.highlightMask.setValue(true, this.source.centerRow, this.source.centerCol - 1);
                this.highlightMask.setValue(true, this.source.centerRow, this.source.centerCol + 1);
                mags.push(magGrid.getValue(this.source.centerRow, this.source.centerCol - 1));
                mags.push(magGrid.getValue(this.source.centerRow, this.source.centerCol + 1));
            }
        }

        // Determine if suppressed
        this.isSuppressed = Math.abs(Math.max(...mags) - currMag) > 0.0001;
    }

    /**
     * Updates source when drawing with mouse
     * 
     * @param {integer} row 
     * @param {integer} col 
     */
    drawHandler(row, col) {
        let value = this.source.getValue(row, col) - 20;
        value = Math.max(0, Math.min(255, value));
        this.source.setValue(value, row, col);

        this.setState({
            grid: this.source,
        });
    }

    /**
     * Clears drawing
     */
    reset() {
        createClear(this.source);
        this.highlightMask = new Array2D(
            Array.from({ length: this.source.width * this.source.height }, () => false),
            this.source.width, this.source.height, 1);

        this.setState({
            grid: this.source,
        });
    }

    render() {
        this.process();

        return e('div', null,
            e('div', { className: 'demo-container' },

                e('div', { style: { display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'} },
                    e('div', { className: 'btn btn-danger', onClick: () => this.reset() },
                        e('i', { className: 'fas fa-eraser' }, null)
                    ),
                    e('h3', null, this.isSuppressed ? 'Suppress' : 'Keep'),
                    e('div', { className: 'btn-group mr-2', role: 'group' },
                        e('div', {
                            className: 'btn btn-info', onClick: () => {
                                createVerticalLineThick(this.source, 2);
                                this.setState({
                                    grid: this.source,
                                });
                            }
                        }, '✔'),
                        e('div', {
                            className: 'btn btn-info', onClick: () => {
                                createVerticalLineThick(this.source, 1);
                                this.setState({
                                    grid: this.source,
                                });
                            }
                        }, '✘'),
                    ),
                ),
                e('br', null, null),
                e(GradientGrid, {
                    idBase: 'suppression',
                    gridUnit: 6,
                    source: this.source,
                    magGrid: this.magGrid,
                    sobelX: this.sobelXData,
                    sobelY: this.sobelYData,
                    highlightMask: this.highlightMask,
                    drawHandler: (i, j) => this.drawHandler(i, j),
                }, null),
            )
        );
    }
}
