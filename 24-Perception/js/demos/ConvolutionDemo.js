// Convolution demo UI

/**
 * Top-level convolution demo
 */
class ConvolutionDemo extends React.Component {

    constructor(props) {
        super(props);

        this.source = new Array2D(
            Array.from({ length: 4 * 20 * 10 }, () => 0),
            20, 10, 4
        );

        createVerticalLine(this.source);
        this.convolveResult = new Array2D([...this.source.data], this.source.width, this.source.height, 4);
        this.filter = sobelX;
        convolve(this.convolveResult, this.filter);
        stretchColorRange(this.convolveResult, -1020, 1020, 0, 1);

        this.state = {
            filterType: 'sobelX',
            filterLocation: { row: 1, col: 1 },
            filterColor: new Array2D([
                '#0078ff', '#0078ff', '#0078ff',
                '#0078ff', '#fd6600', '#0078ff',
                '#0078ff', '#0078ff', '#0078ff',
            ], 3, 3),
            magnifyVisible: false,
        };
    }

    /**
     * Switches between sobel x and y
     * @param {string} filterType - Filter type
     */
    switchDemo(filterType) {

        if (filterType == 'sobelX') {
            createVerticalLine(this.source);
            this.filter = sobelX;

        }
        else if (filterType == 'sobelY') {
            createHorizontalLine(this.source);
            this.filter = sobelY;
        }

        this.convolveResult = new Array2D([...this.source.data], this.source.width, this.source.height, 4);
        convolve(this.convolveResult, this.filter);
        stretchColorRange(this.convolveResult, -1020, 1020, 0, 1);

        this.setState({ filterType: filterType });
    }

    /**
     * Sets row and column filter location
     * @param {*} r 
     * @param {*} c 
     */
    setFilterLocation(r, c) {
        if (r < 0 || r >= this.source.height || c < 0 || c >= this.source.width) {
            return;
        }
        this.setState({ filterLocation: { row: r, col: c } })
    }

    render() {
        const resValue = this.convolveResult.getValue(this.state.filterLocation.row, this.state.filterLocation.col);

        // Get local source at filter
        let localSourceData = [];
        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                for (let chan = 0; chan < this.source.channels; chan++) {

                    let value = null;
                    if (this.state.filterLocation.row + i >= 0 && this.state.filterLocation.row + i < this.source.height &&
                        this.state.filterLocation.col + j >= 0 && this.state.filterLocation.col + j < this.source.width) {
                        value = this.source.getValue(this.state.filterLocation.row + i, this.state.filterLocation.col + j);
                    }

                    localSourceData.push(value);
                }
            }
        }
        let localSource = new Array2D(localSourceData, this.filter.width, this.filter.height, this.source.channels);

        return e('div', { className: 'demo-container' },
            e('div', null,
                e(ConvolutionMagnifier, { filterType: this.state.filterType },
                    e('div', {
                        className: 'demo-container', style: {
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            visibility: this.state.magnifyVisible ? 'visible' : 'hidden',
                        }
                    },
                        e(ConvolutionLocalTopologyDisplay, {
                            imageId: 'convolution-local-topology-' + this.state.filterType,
                            grid: localSource,
                            filterColor: this.state.filterColor,
                            filterType: this.state.filterType,
                            currGradValue: resValue,
                        }, null),
                        e(ConvolutionChangeLabel, {
                            grid: localSource,
                            value: resValue,
                        }, null),
                    ),
                ),

                e('div', { style: { display: 'flex', flexDirection: 'row' } },
                    e('h4', null, this.state.filterType == 'sobelX' ? "Sobel X" : "Sobel Y"),
                    e('div', { style: { display: 'flex', flex: 1 } }, null),
                    e('div', { className: 'dropdown' },
                        e('a', {
                            className: 'btn btn-info dropdown-toggle',
                            'data-toggle': 'dropdown',
                        }, 'Filters ', e('b', { className: 'caret' }, null)),
                        e('ul', { className: 'dropdown-menu dropdown-menu-right' },
                            e('li', null,
                                e('a', {
                                    href: "#",
                                    onClick: (e) => {
                                        e.preventDefault();
                                        this.switchDemo('sobelX');
                                    }
                                }, 'Sobel X')
                            ),
                            e('li', null,
                                e('a', {
                                    href: "#",
                                    onClick: (e) => {
                                        e.preventDefault();
                                        this.switchDemo('sobelY');
                                    }
                                }, 'Sobel Y')
                            )
                        ),
                    ),
                ),
                e('br', null, null),
                e('div', { className: 'flex-container', style: { alignItems: 'baseline' } },
                    e('div', null,
                        e(ConvolutionInputGrid, {
                            idBase: `convolution-input-${this.state.filterType}`,
                            filter: this.filter,
                            filterColor: this.state.filterColor,
                            filterLocation: this.state.filterLocation,
                            filterType: this.state.filterType,
                            source: this.source,
                            convolveResult: this.convolveResult,
                            handleMouseOver: (r, c) => this.setFilterLocation(r, c),
                            setMagnifyVisible: (v) => this.setState({ magnifyVisible: v }),
                        }, null)
                    ),
                ),
            )
        );
    }
}

/**
 * Label with magnitude of change at indicated location
 */
class ConvolutionChangeLabel extends React.Component {
    render() {

        const right = this.props.grid.getValue(1, 2);
        const left = this.props.grid.getValue(1, 0);
        const up = this.props.grid.getValue(0, 1);
        const down = this.props.grid.getValue(2, 1);

        // Update text
        let outStr = 'No Change';
        if (right == null || left == null || up == null || down == null) {
            outStr = 'Out of Bounds';
        }
        else if (Math.abs(Math.abs(this.props.value) - 0.5) > 0.0001) {
            const signLabel = this.props.value > 0.5 ? 'Positive ' : 'Negative ';
            const magLabel = Math.abs(this.props.value - 0.5) > 0.2 ? 'Large ' : 'Small ';
            outStr = `${magLabel} ${signLabel} Change`;
        }

        return e('p', { align: 'center' }, outStr);
    }
}

/**
 * Convolution demo grid with filter applied
 */
class ConvolutionInputGrid extends React.Component {
    constructor(props) {
        super(props);
        this.canvas = null;
    }

    componentDidMount() {
        this.canvas = document.getElementById(`convolution-filter-grid-${this.props.filterType}`);

        this.process();

        let currRow = -1;
        let currCol = -1;
        const moveFilter = (e) => {

            const a = this.canvas.getBoundingClientRect();
            const cursorRatioX = (e.pageX - a.left - window.pageXOffset) / a.width;
            const cursorRatioY = (e.pageY - a.top - window.pageYOffset) / a.height;
            const col = Math.floor(this.props.source.width * cursorRatioX);
            const row = Math.floor(this.props.source.height * cursorRatioY);

            if (row != currRow || col != currCol) {
                currRow = row;
                currCol = col;
                this.props.handleMouseOver(currRow, currCol);
            }

            this.props.setMagnifyVisible(true);
        }

        this.canvas.addEventListener('mousemove', (e) => moveFilter(e));
        this.canvas.addEventListener('mouseleave', (e) => {
            this.props.setMagnifyVisible(false);
        });

        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            moveFilter(e.touches[0])
        });
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.props.setMagnifyVisible(false);
        });

        $(window).resize(() => {
            this.props.setMagnifyVisible(false);
        });
    }

    process() {
        if (!this.canvas) {
            return;
        }

        const context = this.canvas.getContext('2d');
        const pixelDelta = this.canvas.width / this.props.source.width;

        for (let i = 0; i < this.props.source.height; i++) {
            for (let j = 0; j < this.props.source.width; j++) {
                const value = this.props.source.getValue(i, j);

                // Draw cell
                context.fillStyle = `rgb(${value}, ${value}, ${value})`;
                context.fillRect(j * pixelDelta, i * pixelDelta, pixelDelta, pixelDelta);
                context.strokeStyle = 'grey';
                context.strokeRect(j * pixelDelta, i * pixelDelta, pixelDelta, pixelDelta);

                // Draw arrows
                context.save();
                context.beginPath();
                const arrowValue = this.props.convolveResult.getValue(i, j);
                const arrowX = j * pixelDelta + pixelDelta / 2;
                const arrowY = i * pixelDelta + pixelDelta / 2;
                if (i > 0 && i < this.props.convolveResult.height - 1 &&
                    j > 0 && j < this.props.convolveResult.width - 1 &&
                    Math.abs(arrowValue - 0.5) > 0.0001) {

                    const ratio = 2 * Math.abs(arrowValue - 0.5);
                    context.lineWidth = 5 * ratio + 1;
                    const lenWeight = 10 * ratio + 2;
                    const headLen = 5 * ratio + 2;
                    context.strokeStyle = 'blue';

                    // Graph sobel x or y
                    if (this.props.filterType == 'sobelX') {
                        canvas_arrow(
                            context, arrowX, arrowY,
                            arrowX + (arrowValue > 0.5 ? lenWeight : -lenWeight), arrowY, headLen
                        );
                    }
                    else if (this.props.filterType == 'sobelY') {
                        canvas_arrow(
                            context, arrowX, arrowY,
                            arrowX, arrowY + (arrowValue > 0.5 ? -lenWeight : lenWeight), headLen
                        );
                    }
                }
                else {
                    context.lineWidth = 2;
                    context.strokeStyle = 'pink';
                    context.globalAlpha = 0.5;
                    canvasCross(context, arrowX, arrowY, 5);
                }

                context.stroke();
                context.restore();
            }
        }

        // Draw highlight cell
        for (let i = 0; i < this.props.source.height; i++) {
            for (let j = 0; j < this.props.source.width; j++) {
                let isWithinFilter =
                    i >= this.props.filterLocation.row - this.props.filter.centerRow &&
                    i <= this.props.filterLocation.row + this.props.filter.centerRow &&
                    j >= this.props.filterLocation.col - this.props.filter.centerCol &&
                    j <= this.props.filterLocation.col + this.props.filter.centerCol;

                let filterRow = this.props.filter.height - (i - this.props.filterLocation.row + this.props.filter.centerRow) - 1;
                let filterCol = this.props.filter.width - (j - this.props.filterLocation.col + this.props.filter.centerCol) - 1;

                if (isWithinFilter) {
                    context.save();
                    context.lineWidth = 3;
                    context.strokeStyle = this.props.filterColor.getValue(filterRow, filterCol);
                    context.strokeRect(j * pixelDelta - 1, i * pixelDelta + 1, pixelDelta - 2, pixelDelta - 2);
                    context.restore();
                }
            }
        }
    }

    render() {

        this.process();

        return e('canvas', {
            id: `convolution-filter-grid-${this.props.filterType}`,
            width: 800,
            height: 400,
            style: {
                width: '100%',
                height: '50%',
            }
        }, null);
    }
}

/**
 * Displays local topology of grid
 */
class ConvolutionLocalTopologyDisplay extends React.Component {
    constructor(props) {
        super(props);

        // Three js setup
        this.camera = new THREE.PerspectiveCamera(75, 1, 0.1, 10);
        this.camera.position.z = 5 * Math.cos(Math.PI / 4);
        this.camera.position.y = 5 * Math.sin(Math.PI / 4);
        this.camera.lookAt(new THREE.Vector3(0, 0, 0));
        this.scene = new THREE.Scene();

        this.clearColor = 'pink';
        this.objArr = new Array2D(
            new Array(this.props.grid.width * this.props.grid.height),
            this.props.grid.width, this.props.grid.height, 1
        );

        $(window).resize(() => this.resize());
    }

    componentDidMount() {
        // Set up 3d scene

        // Renderer
        const canvas = document.getElementById(`${this.props.imageId}-canvas3d`);
        this.renderer = new THREE.WebGLRenderer({ canvas });
        this.renderer.setClearColor(this.clearColor);

        // Create main container
        const container = new THREE.Object3D();
        container.position.x = -1.5;
        container.position.z = -1.5;

        // Create pillars
        for (let i = 0; i < this.props.grid.height; i++) {
            for (let j = 0; j < this.props.grid.width; j++) {
                // Pillar mesh
                const pillarGeo = new THREE.BoxBufferGeometry(1, 1, 1);
                const pillarMat = new THREE.MeshBasicMaterial({ color: 'red' });
                const pillar = new THREE.Mesh(pillarGeo, pillarMat);
                pillar.position.set(0.5, 0.5, 0.5);

                // Pillar edges
                const pillarEdgeGeo = new THREE.EdgesGeometry(pillarGeo);
                const pillarLines = new THREE.LineSegments(
                    pillarEdgeGeo,
                    new THREE.LineBasicMaterial({ color: this.props.filterColor.getValue(i, j) })
                );
                pillarLines.position.set(0.5, 0.5, 0.5);

                // Pillar container
                let pillarContainer = new THREE.Object3D();
                pillarContainer.add(pillar);
                pillarContainer.add(pillarLines);

                pillarContainer.position.x = 1.06 * j;
                pillarContainer.position.z = 1.06 * i;

                this.objArr.setValue({
                    obj: pillarContainer,
                    mat: pillarMat,
                }, i, j);
                container.add(pillarContainer);
            }
        }

        // Create tilt arrow
        this.planeContainer = new THREE.Object3D();
        this.planeMat = new THREE.MeshToonMaterial({ color: 'blue' });
        const arrowHead = new THREE.Mesh(
            new THREE.ConeGeometry(0.2, 1, 32),
            this.planeMat,
        );
        const arrowBody = new THREE.Mesh(
            new THREE.CylinderGeometry(0.1, 0.1, 1, 32),
            this.planeMat,
        );
        arrowHead.rotation.set(0, 0, Math.PI / 2);
        arrowBody.rotation.set(0, 0, Math.PI / 2);
        arrowHead.position.set(-0.5, 0, 0);
        arrowBody.position.set(0.5, 0, 0);
        this.planeContainer.add(arrowHead);
        this.planeContainer.add(arrowBody);
        this.planeContainer.position.set(0, 2, 0);

        // Create light
        let light = new THREE.PointLight('white', 1, 100);
        light.position.set(5, 5, 5);

        // Create scene
        this.scene.add(container);
        this.scene.add(this.planeContainer);
        this.scene.add(light);
        this.updateScene();
        this.resize();
    }

    resize() {
        const canvas = document.getElementById(`${this.props.imageId}-canvas3d`);
        canvas.style.height = (innerHeight / 4) + 'px';
    }

    /**
     * Updates pillars and re-renders
     */
    updateScene() {
        // Calculate and update rotation and material
        const right = this.props.grid.getValue(1, 2);
        const left = this.props.grid.getValue(1, 0);
        const up = this.props.grid.getValue(0, 1);
        const down = this.props.grid.getValue(2, 1);

        // Update arrow
        if (right != null && left != null && up != null && down != null &&
            Math.abs(this.props.currGradValue - 0.5) > 0.0001) {

            // Switch for sobel type
            if (this.props.filterType == 'sobelX') {
                const diff = right / 255 - left / 255;
                this.planeContainer.rotation.set(
                    0,
                    this.props.currGradValue < 0.5 ? 0 : Math.PI,
                    (this.props.currGradValue < 0.5 ? 1 : -1) * Math.atan(diff),
                );
            }
            else if (this.props.filterType == 'sobelY') {
                const diff = up / 255 - down / 255;
                this.planeContainer.rotation.set(
                    Math.atan(diff),
                    this.props.currGradValue < 0.5 ? Math.PI / 2 : -Math.PI / 2,
                    0,
                );
            }

            this.planeContainer.position.set(0, 2, 0);

            const ratio = 4 * Math.abs(this.props.currGradValue - 0.5);
            this.planeContainer.scale.set(ratio, ratio, ratio);
        }
        else {
            // Hide arrow
            this.planeContainer.position.set(10, 10, 10);
        }

        // Update pillars
        for (let i = 0; i < this.props.grid.height; i++) {
            for (let j = 0; j < this.props.grid.width; j++) {

                let value = this.props.grid.getValue(i, j);
                let item = this.objArr.getValue(i, j);

                if (value != null) {
                    item.obj.scale.y = value / 255 + 0.1;
                    item.mat.color.set(`rgb(${value}, ${value}, ${value})`);
                }
                else {
                    item.obj.scale.y = 0.001;
                    item.mat.color.set(this.clearColor);
                }
            }
        }

        this.renderer.render(this.scene, this.camera);
    }

    render() {
        if (this.renderer) {
            this.updateScene();
        }

        return e('div', null,
            e('canvas', {
                id: `${this.props.imageId}-canvas3d`,
                width: 300,
                height: 300,
            }, null),
        );
    }
}

/**
 * Convolution demo magnifier
 */
class ConvolutionMagnifier extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            cursorX: 0,
            cursorY: 0,
            magnifyVisible: false,
        }
    }

    componentDidMount() {
        // Create magnifier
        const container = document.getElementById(`convolution-filter-grid-${this.props.filterType}`);
        const magnifier = document.getElementById(`convolution-magnifier-${this.props.filterType}`);
        const updateFunc = (e) => {

            const a = container.getBoundingClientRect();

            // Lock magnifier to image
            let cursorX = e.pageX - magnifier.offsetWidth / 2;
            let cursorY = e.pageY - magnifier.offsetHeight / 2;

            this.setState({
                cursorX: cursorX,
                cursorY: cursorY - 0.8 * magnifier.getBoundingClientRect().height,
                magnifyVisible: true,
            });
        }

        // Magnifier events
        container.addEventListener('mouseleave', (e) => {
            this.setState({ magnifyVisible: false, });
        });
        container.addEventListener('mousemove', updateFunc);
        container.addEventListener('touchmove', updateFunc);
    }

    render() {
        return e('div', {
            id: `convolution-magnifier-${this.props.filterType}`,
            style: {
                position: 'absolute',
                cursor: 'none',
                visibility: this.state.magnifyVisible ? 'visible' : 'hidden',
                zIndex: 100,

                width: '200px',
                left: this.state.cursorX,
                top: this.state.cursorY,

                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }
        },
            this.props.children
        );
    }
}