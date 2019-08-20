// Image processing

/**
 * 2x2 grid with channels
 */
class Array2D {

    constructor(data, width, height, channels = 1) {
        this.data = data;
        this.width = width;
        this.height = height;
        this.channels = channels;
    }

    /**
     * Gets center row index
     */
    get centerRow() {
        return Math.floor(this.height / 2);
    }

    /**
     * Gets center column index
     */
    get centerCol() {
        return Math.floor(this.width / 2);
    }

    /**
     * Gets value at (row, col, chan)
     * @param {integer} row 
     * @param {integer} col 
     * @param {integer} chan 
     */
    getValue(row, col, chan = 0) {
        return this.data[this.channels * (this.width * row + col) + chan];
    }

    /**
     * Sets value  at (row, col, chan)
     * @param {*} value 
     * @param {integer} row 
     * @param {integer} col 
     * @param {integer} chan 
     */
    setValue(value, row, col, chan = 0) {
        this.data[this.channels * (this.width * row + col) + chan] = value;
    }
}

/**
 * Gaussian filter rough approximation
 */
class GaussianFilter extends Array2D {

    constructor(size, sigma = 1) {
        super([], size, size);

        // Calculate values
        let total = 0;
        for (let i = 0; i < size; i++) {
            for (let j = 0; j < size; j++) {
                let x = (j - this.centerCol) / this.centerCol * sigma;
                let y = (this.centerRow - i) / this.centerRow * sigma;

                let value = gaussian(x, y, sigma)
                total += value;
                this.data.push(value);
            }
        }

        // Normalize
        for (let i = 0; i < size * size; i++) {
            this.data[i] /= total;
        }
    }
}

/**
 * Expands rgb into linear colorspace
 * @param {number} c - R, G, or B value as percentage 
 */
function gammaExpand(c) {
    return c <= 0.04045 ? c / 12.96 : Math.pow((c + 0.055 / 1.055), 2.4);
}

/**
 * Converts image to greyscale
 * 
 * @param {Array2D} source - RGBA source
 */
function grayscale(source) {
    for (let i = 0; i < source.height; i++) {
        for (let j = 0; j < source.width; j++) {
            let index = 4 * (source.width * i + j);

            const rlin = gammaExpand(source.data[index + 0] / 255);
            const glin = gammaExpand(source.data[index + 1] / 255);
            const blin = gammaExpand(source.data[index + 2] / 255);
            const ylin = 0.2126 * rlin + 0.7152 * glin + 0.0722 * blin;
            const y = ylin <= 0.0031308 ? 12.92 * ylin : 1.055 * Math.pow(ylin, 1 / 2.4);

            source.data[index + 0] = Math.floor(255 * y);
            source.data[index + 1] = Math.floor(255 * y);
            source.data[index + 2] = Math.floor(255 * y);
        }
    }
}

/**
 * Isolates color channel in RGB image
 * 
 * @param {Array2D} source - RGBA source
 * @param {integer} channel - channel to isolate
 */
function isolateColor(source, channel) {
    if (channel == 0) {
        filterColor(source, true, false, false);
    }
    else if (channel == 1) {
        filterColor(source, false, true, false);
    }
    else if (channel == 2) {
        filterColor(source, false, false, true);
    }
}

/**
 * Filter color based on RGB channels
 * 
 * @param {Array2D} source 
 * @param {boolean} showR 
 * @param {boolean} showG 
 * @param {boolean} showB 
 */
function filterColor(source, showR, showG, showB) {
    for (let i = 0; i < source.height; i++) {
        for (let j = 0; j < source.width; j++) {
            source.setValue(showR ? source.getValue(i, j, 0) : 0, i, j, 0);
            source.setValue(showG ? source.getValue(i, j, 1) : 0, i, j, 1);
            source.setValue(showB ? source.getValue(i, j, 2) : 0, i, j, 2);
        }
    }
}

/**
 * Adds grayscale noise
 * @param {Array2D} source - Grayscale image
 */
function noisify(source) {
    for (let i = 0; i < source.height; i++) {
        for (let j = 0; j < source.width; j++) {
            if (Math.random() > 0.9) {
                const value = source.getValue(i, j) + Math.floor(200 * Math.random() - 100);
                source.setValue(value, i, j, 0);
                source.setValue(value, i, j, 1);
                source.setValue(value, i, j, 2);
            }
        }
    }
}

/**
 * Convolves filter on RGBA source
 * 
 * @param {Array2D} source - RGBA source
 * @param {Array2D} filter - Convolving 1 channel filter 
 * @param {integer} defaultValue - Default out of bounds value 
 */
function convolve(source, filter, defaultValue = 255) {

    // Copy data to buffer for output
    let buffer = [...source.data];

    for (let i = 0; i < source.height; i++) {
        for (let j = 0; j < source.width; j++) {

            // Apply filter for RGB channels
            for (let chan = 0; chan < 3; chan++) {

                let value = 0;

                loop1:
                for (let filterRow = 0; filterRow < filter.height; filterRow++) {
                    loop2:
                    for (let filterCol = 0; filterCol < filter.width; filterCol++) {
                        let srcRow = i + filterRow - filter.centerRow;
                        let srcCol = j + filterCol - filter.centerCol;
                        let filterValue = filter.data[filter.height * (filter.height - filterRow - 1) + (filter.width - filterCol - 1)];

                        // Calculate if within source
                        if (srcRow >= 0 && srcRow < source.height && srcCol >= 0 && srcCol < source.width) {
                            value += source.getValue(srcRow, srcCol, chan) * filterValue;
                        }
                        // Use default value if out of bounds
                        else {
                            value += defaultValue * filterValue;
                            //break loop1;
                        }
                    }
                }

                buffer[source.channels * (source.width * i + j) + chan] = value;
            }
        }
    }

    // Copy buffer over
    fillArray(source.data, buffer, source.data.length);
}

/**
 * Computes magnitude and angles of gradients from X and Y components
 * 
 * @param {Array2D} sourceX 
 * @param {Array2D} sourceY 
 */
function computeGradients(sourceX, sourceY) {
    let mags = new Array2D(
        Array.from({ length: 4 * sourceX.width * sourceX.width }, () => 255),
        sourceX.width, sourceX.height, 4
    );
    let angles = new Array2D(
        Array.from({ length: 4 * sourceX.width * sourceX.width }, () => 255),
        sourceX.width, sourceX.height, 4
    );

    for (let i = 0; i < sourceX.height; i++) {
        for (let j = 0; j < sourceX.width; j++) {
            const xVal = sourceX.getValue(i, j);
            const yVal = sourceY.getValue(i, j);
            const mag = mag2d(xVal, yVal);
            let angle = Math.atan2(yVal, xVal);

            // Fix angle between 0 and PI
            if (angle < 0) {
                angle += 2 * Math.PI
            }
            if (angle > Math.PI) {
                angle -= Math.PI;
            }

            // Update grids
            mags.setValue(mag, i, j, 0);
            mags.setValue(mag, i, j, 1);
            mags.setValue(mag, i, j, 2);

            angles.setValue(angle, i, j, 0);
            angles.setValue(angle, i, j, 1);
            angles.setValue(angle, i, j, 2);
        }
    }

    return [mags, angles];
}

/**
 * Performs non-maximum suppression and returns suppressed Array2D
 * 
 * @param {Array2D} magGrid - Grid of magnitudes
 * @param {Array2D} angleGrid - Grid of angles
 */
function nonMaxSuppress(magGrid, angleGrid) {

    let res = new Array2D(
        [...magGrid.data],
        magGrid.width, magGrid.height, 4
    );

    for (let i = 1; i < magGrid.height - 1; i++) {
        for (let j = 1; j < magGrid.width - 1; j++) {

            const currMag = magGrid.getValue(i, j);
            const angle = angleGrid.getValue(i, j);

            // Get relevant neighbors
            let mags = [currMag];
            if (angle >= 0 && angle < Math.PI / 8) {
                mags.push(magGrid.getValue(i, j - 1));
                mags.push(magGrid.getValue(i, j + 1));
            }
            else if (angle >= Math.PI / 8 && angle < 3 * Math.PI / 8) {
                mags.push(magGrid.getValue(i - 1, j + 1));
                mags.push(magGrid.getValue(i + 1, j - 1));
            }
            else if (angle >= 3 * Math.PI / 8 && angle < 5 * Math.PI / 8) {
                mags.push(magGrid.getValue(i - 1, j));
                mags.push(magGrid.getValue(i + 1, j));
            }
            else if (angle >= 5 * Math.PI / 8 && angle < 7 * Math.PI / 8) {
                mags.push(magGrid.getValue(i - 1, j - 1));
                mags.push(magGrid.getValue(i + 1, j + 1));
            }
            else {
                mags.push(magGrid.getValue(i, j - 1));
                mags.push(magGrid.getValue(i, j + 1));
            }

            // Choose to suppress
            const value = Math.max(...mags) > currMag ? 0 : currMag;
            res.setValue(value, i, j, 0);
            res.setValue(value, i, j, 1);
            res.setValue(value, i, j, 2);
        }
    }

    return res;
}

/**
 * Performs double threshold
 * 127 is a weak edge and 255 is a strong edge for display
 * 
 * @param {Array2D} source - Grid of magnitudes
 * @param {Number} hi - High threshold
 * @param {Number} lo - Low threshold
 */
function doubleThreshold(source, hi, lo) {
    for (let i = 0; i < source.height; i++) {
        for (let j = 0; j < source.width; j++) {

            const value = source.getValue(i, j);
            let res = 0;

            if (value > hi) {
                res = 255;
            }
            else if (value > lo) {
                res = 127;
            }

            source.setValue(res, i, j, 0);
            source.setValue(res, i, j, 1);
            source.setValue(res, i, j, 2);
        }
    }
}

/**
 * Performs edge tracking by hysteresis on a grid that has
 * had its edge strength determined
 * 
 * @param {Array2D} source - Grid with edge strength detected
 */
function edgeConnect(source) {
    for (let i = 1; i < source.height - 1; i++) {
        for (let j = 1; j < source.width - 1; j++) {

            const value = source.getValue(i, j)
            let strongDetected = false;

            // If weak edge, check neighborhood
            if (value == 127) {
                for (let rowOffset = -1; rowOffset <= 1; rowOffset++) {
                    for (let colOffset = -1; colOffset <= 1; colOffset++) {
                        // Detect strong edge
                        if (source.getValue(i + rowOffset, j + colOffset) == 255) {
                            strongDetected = true;
                        }
                    }
                }

                let res = strongDetected ? 255 : 0;
                source.setValue(res, i, j, 0);
                source.setValue(res, i, j, 1);
                source.setValue(res, i, j, 2);
            }
        }
    }
}

/**
 * Stretches color of source with local max and min
 * 
 * @param {Array2D} source - RGBA source
 */
function stretchColor(source, targetMin = 0, targetMax = 255) {

    let max = source.data.reduce(function (a, b) {
        return Math.max(a, b);
    });
    let min = source.data.reduce(function (a, b) {
        return Math.min(a, b);
    });

    stretchColorRange(source, min, max, targetMin, targetMax);
}

/**
 * Stretches color of source with inputted max and min
 * 
 * @param {Array2D} source - RGBA source
 */
function stretchColorRange(source, min, max, targetMin = 0, targetMax = 255) {

    for (let i = 0; i < source.height; i++) {
        for (let j = 0; j < source.width; j++) {
            for (let k = 0; k < 3; k++) {
                let value = source.getValue(i, j, k);
                value = (value - min) / (max - min) * (targetMax - targetMin) + targetMin;

                source.setValue(value, i, j, k);
            }
        }
    }
}

/**
 * Copies length values from source to target
 * 
 * @param {Array} targetData - RGBA target pixel data
 * @param {Array} sourceData - RGBA source pixel data
 * @param {integer} length - Amount of data to copy
 */
function fillArray(targetData, sourceData, length) {
    for (let i = 0; i < length; i++) {
        targetData[i] = sourceData[i];
    }
}

// === FILTERS ===

const gaussianBlur5 = new Array2D([
    1 / 273, 4 / 273, 7 / 273, 4 / 273, 1 / 273,
    4 / 273, 16 / 273, 26 / 273, 16 / 273, 4 / 273,
    7 / 273, 26 / 273, 41 / 273, 26 / 273, 7 / 273,
    4 / 273, 16 / 273, 26 / 273, 16 / 273, 4 / 273,
    1 / 273, 4 / 273, 7 / 273, 4 / 273, 1 / 273
], 5, 5);

const sobelX = new Array2D([
    -1, 0, 1,
    -2, 0, 2,
    -1, 0, 1
], 3, 3);

const sobelY = new Array2D([
    1, 2, 1,
    0, 0, 0,
    -1, -2, -1
], 3, 3);