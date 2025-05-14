import * as THREE from 'https://esm.sh/three@0.154.0';
import { GLTFLoader } from 'https://esm.sh/three@0.154.0/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'https://esm.sh/three@0.154.0/examples/jsm/controls/OrbitControls.js';

const MODEL_CONFIGS = {
    coke: {
        openingModel: 'models/coke can opening.glb',
        crushModel: 'models/coke can crush.glb',
        staticOnly: false
    },
    drpepper: {
        openingModel: 'models/drpepper can opening.glb',
        crushModel: 'models/drpepper can crush.glb',
        staticOnly: false
    },
    bottle: {
        openingModel: 'models/bottle.glb',
        crushModel: null,
        staticOnly: true
    }
};

let currentModelKey = 'coke';

function createThreeViewerMain({ openingModel, crushModel, staticOnly }) {
    const container = document.getElementById('canvas-container-main');
    if (!container) return;

    //remove previous viewer if present to allow reinitialization
    while (container.firstChild) {
        container.removeChild(container.firstChild);
    }
    container.dataset.threeInitialized = "";

    const loaderDiv = document.createElement('div');
    loaderDiv.id = 'three-loader';
    loaderDiv.style.cssText = 'width:100%;height:100%;display:flex;align-items:center;justify-content:center;position:absolute;top:0;left:0;';
    loaderDiv.innerHTML = `<div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div>`;

    const uiDiv = document.createElement('div');
    uiDiv.id = 'three-ui';
    uiDiv.style.cssText = 'display:none;position:absolute;top:10px;left:10px;z-index:2;min-width:220px;';

    let controlsHtml = '';
    if (!staticOnly) {
        controlsHtml += `
            <button id="playPauseBtn" class="btn btn-sm btn-primary me-2 mb-2">Pause</button>
            <button id="crushBtn" class="btn btn-sm btn-danger me-2 mb-2">Crush</button>
        `;
    }
    controlsHtml += `
        <button id="rotateBtn" class="btn btn-sm btn-secondary me-2 mb-2">Rotate</button>
        <div class="accordion" id="controlsAccordion">
            <div class="accordion-item">
                <h2 class="accordion-header" id="controlsHeading">
                    <button class="accordion-button collapsed p-2" type="button" data-bs-toggle="collapse" data-bs-target="#controlsCollapse-main" aria-expanded="false" aria-controls="controlsCollapse-main" style="font-size:1rem;">
                        Controls
                    </button>
                </h2>
                <div id="controlsCollapse-main" class="accordion-collapse collapse" aria-labelledby="controlsHeading" data-bs-parent="#controlsAccordion">
                    <div class="accordion-body p-2">
                        <div class="mb-2">
                            <div class="form-check form-switch d-inline-block ms-2">
                                <input class="form-check-input" type="checkbox" id="wireframeSwitch">
                                <label class="form-check-label" for="wireframeSwitch">Wireframe Toggle</label>
                            </div>
                        </div>
                        <div class="mb-2">
                            <label class="form-label mb-1">Backdrop Image:</label>
                            <input id="backdropInput" type="file" accept="image/*" class="form-control form-control-sm">
                        </div>
                        <div class="mb-2">
                            <label class="form-label mb-1">Light Type:</label>
                            <select id="lightType" class="form-select form-select-sm">
                                <option value="directional">Directional</option>
                                <option value="hemisphere">Hemisphere</option>
                            </select>
                        </div>
                        <div class="mb-2">
                            <label class="form-label mb-1">Intensity:</label>
                            <input id="lightSlider" type="range" min="0" max="2" step="0.01" value="1" class="form-range">
                        </div>
                        <div class="mb-2">
                            <label class="form-label mb-1">Color:</label>
                            <input id="lightColor" type="color" value="#ffffff" class="form-control form-control-color" style="width: 2.5rem; padding: 0;">
                        </div>
                        <div class="mb-2">
                            <label class="form-label mb-1">Position:</label>
                            <div class="d-flex align-items-center mb-1">
                                <span class="me-1">X</span>
                                <input id="lightPosX" type="range" min="-10" max="10" step="0.1" value="3" class="form-range flex-fill">
                            </div>
                            <div class="d-flex align-items-center mb-1">
                                <span class="me-1">Y</span>
                                <input id="lightPosY" type="range" min="0" max="20" step="0.1" value="10" class="form-range flex-fill">
                            </div>
                            <div class="d-flex align-items-center">
                                <span class="me-1">Z</span>
                                <input id="lightPosZ" type="range" min="-10" max="10" step="0.1" value="10" class="form-range flex-fill">
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    uiDiv.innerHTML = controlsHtml;

    container.style.position = 'relative';
    container.appendChild(loaderDiv);
    container.appendChild(uiDiv);

    //add name input for bottle
    let nameInputDiv = null;
    let nameInput = null;
    let bottleNameMaterial = null;

    if (staticOnly && openingModel.includes('bottle')) {
        nameInputDiv = document.createElement('div');
        nameInputDiv.style.cssText = 'position:absolute;bottom:16px;right:16px;z-index:10;display:flex;align-items:center;gap:0.5rem;';
        nameInputDiv.innerHTML = `
            <label for="bottleNameInput" class="form-label mb-0" style="color:#fff;background:#23272b;padding:0.25rem 0.5rem;border-radius:0.25rem;">Name:</label>
            <input id="bottleNameInput" type="text" class="form-control form-control-sm" style="width:120px;" maxlength="7">
        `;
        container.appendChild(nameInputDiv);
        nameInput = nameInputDiv.querySelector('#bottleNameInput');
    }

    const width = container.clientWidth;
    const height = container.clientHeight;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    if (staticOnly && openingModel.includes('bottle')) {
        camera.position.set(10, 4, 1); 
    } else {
        camera.position.set(10, 5, 10);
    }

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0);
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.domElement.style.position = 'absolute';
    renderer.domElement.style.top = '0';
    renderer.domElement.style.left = '0';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    container.appendChild(renderer.domElement);

    let hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1);
    hemiLight.position.set(0, 20, 0);
    scene.add(hemiLight);

    let dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(3, 10, 10);
    scene.add(dirLight);

    let currentLight = dirLight;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    let mixer, clock = new THREE.Clock(), animating = true;
    let isCrushState = false;
    let crushMixer = null;
    let crushAnimationActions = [];
    let rotating = false;
    const ROTATE_SPEED = 0.02;
    let loadedModel = null;

    //audio
    const openAudio = new Audio('audio/can open.mp3');
    openAudio.loop = false;
    const crushAudio = new Audio('audio/can crush.mp3');
    crushAudio.loop = false;

    function removeCurrentModel() {
        if (loadedModel && loadedModel.parent) {
            loadedModel.parent.remove(loadedModel);
        }
        loadedModel = null;
        mixer = null;
    }

    function loadGLBModel(url, clampAtEnd = false, onLoaded) {
        const loader = new GLTFLoader();
        loader.load(url, function(gltf) {
            removeCurrentModel();
            scene.add(gltf.scene);
            loadedModel = gltf.scene;
            let localMixer = null;
            let actions = [];
            // find and store bottle name material if present
            if (staticOnly && openingModel.includes('bottle')) {
                bottleNameMaterial = null;
                loadedModel.traverse(obj => {
                    if (obj.isMesh && obj.material && obj.name && obj.name.toLowerCase().includes('name')) {
                        bottleNameMaterial = obj.material;
                    }
                });
                // fallback: try by material name
                if (!bottleNameMaterial) {
                    loadedModel.traverse(obj => {
                        if (obj.isMesh && obj.material && obj.material.name && obj.material.name.toLowerCase().includes('name')) {
                            bottleNameMaterial = obj.material;
                        }
                    });
                }
            }
            if (gltf.animations && gltf.animations.length) {
                localMixer = new THREE.AnimationMixer(gltf.scene);
                actions = gltf.animations.map(anim => {
                    const action = localMixer.clipAction(anim);
                    action.play();
                    if (clampAtEnd) {
                        action.clampWhenFinished = true;
                        action.loop = THREE.LoopOnce;
                    }
                    return action;
                });
            }


            const box = new THREE.Box3().setFromObject(loadedModel);
            const center = new THREE.Vector3();
            box.getCenter(center);
            camera.lookAt(center);
            controls.target.copy(center);

            if (onLoaded) onLoaded(localMixer, actions);
            loaderDiv.style.display = 'none';
            uiDiv.style.display = 'block';
            container.dataset.threeInitialized = "true";
        }, undefined, function(error) {
            container.innerHTML = `<div class="text-danger">Failed to load model.</div>`;
        });
    }

    // name input function
    function updateBottleNameTexture(name) {
        if (!bottleNameMaterial) return;
        // creating canvas for name text
        const canvas = document.createElement('canvas');
        canvas.width = 300;
        canvas.height = 100;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#f02414';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // padding to make text fit, need to fix label mesh properly at some point
        const paddingX = 20;
        const paddingY = 10;
        let fontSize = 24;
        const minFontSize = 16;
        const maxWidth = Math.floor((canvas.width - 2 * paddingX) * 0.2);
        const maxHeight = canvas.height - 2 * paddingY;
        let text = name || 'Name';
        ctx.font = `italic bold ${fontSize}px "Times New Roman", Times, serif`;
        let metrics = ctx.measureText(text);
        while ((metrics.width > maxWidth || fontSize > maxHeight) && fontSize > minFontSize) {
            fontSize -= 2;
            ctx.font = `italic bold ${fontSize}px "Times New Roman", Times, serif`;
            metrics = ctx.measureText(text);
        }

  
        ctx.fillStyle = 'rgb(0, 0, 0)';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, canvas.width / 2 + paddingX, canvas.height / 2 + paddingY);

        // canvas appears upside down initially because of mesh issues? invert to fix
        const flipped = document.createElement('canvas');
        flipped.width = canvas.width;
        flipped.height = canvas.height;
        const fctx = flipped.getContext('2d');
        fctx.translate(0, canvas.height);
        fctx.scale(1, -1);
        fctx.drawImage(canvas, 0, 0);

        //create and assign new texture
        const texture = new THREE.CanvasTexture(flipped);
        texture.needsUpdate = true;
        bottleNameMaterial.map = texture;
        bottleNameMaterial.needsUpdate = true;
    }

    if (nameInput) {
        nameInput.addEventListener('input', (e) => {
            updateBottleNameTexture(e.target.value);
        });
    }

    // after bottle loads, set initial texture
    if (staticOnly && openingModel.includes('bottle')) {
        // wait a bit for model to load and material to be found
        setTimeout(() => {
            if (nameInput) updateBottleNameTexture(nameInput.value);
        }, 500);
    }

    // initial load
    if (!staticOnly) {
        loadGLBModel(openingModel, false, (m, actions) => {
            mixer = m;
            isCrushState = false;
            uiDiv.querySelector('#playPauseBtn').textContent = 'Pause';
        });
    } else {
        loadGLBModel(openingModel, false, () => {});
    }

    // UI controls
    if (!staticOnly) {
        uiDiv.querySelector('#playPauseBtn').onclick = function() {
            if (isCrushState) {
                loadGLBModel(openingModel, false, (m, actions) => {
                    mixer = m;
                    isCrushState = false;
                    this.textContent = 'Pause';
                    animating = true;
                    openAudio.currentTime = 0;
                    openAudio.play();
                });
            } else {
                animating = !animating;
                this.textContent = animating ? 'Pause' : 'Play';
            }
        };

        uiDiv.querySelector('#crushBtn').onclick = function() {
            loadGLBModel(crushModel, true, (m, actions) => {
                crushMixer = m;
                crushAnimationActions = actions;
                isCrushState = true;
                uiDiv.querySelector('#playPauseBtn').textContent = 'Open';
                animating = true;
                crushAudio.currentTime = 0;
                crushAudio.play();
            });
        };
    }

    const rotateBtn = uiDiv.querySelector('#rotateBtn');
    rotateBtn.onclick = function() {
        rotating = !rotating;
        rotateBtn.textContent = rotating ? 'Stop Rotate' : 'Rotate';
    };

    const backdropInput = uiDiv.querySelector('#backdropInput');
    backdropInput.addEventListener('change', function() {
        const file = this.files && this.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = new Image();
            img.onload = function() {
                const texture = new THREE.Texture(img);
                texture.needsUpdate = true;
                scene.background = texture;
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });

    const lightType = uiDiv.querySelector('#lightType');
    const lightSlider = uiDiv.querySelector('#lightSlider');
    const lightColor = uiDiv.querySelector('#lightColor');
    const lightPosX = uiDiv.querySelector('#lightPosX');
    const lightPosY = uiDiv.querySelector('#lightPosY');
    const lightPosZ = uiDiv.querySelector('#lightPosZ');

    function updateLightType() {
        if (lightType.value === 'directional') {
            hemiLight.visible = false;
            dirLight.visible = true;
            currentLight = dirLight;
        } else {
            hemiLight.visible = true;
            dirLight.visible = false;
            currentLight = hemiLight;
        }
        lightSlider.value = currentLight.intensity;
        lightColor.value = '#' + currentLight.color.getHexString();
        lightPosX.value = currentLight.position.x;
        lightPosY.value = currentLight.position.y;
        lightPosZ.value = currentLight.position.z;
    }

    lightType.onchange = updateLightType;

    lightSlider.oninput = function() {
        currentLight.intensity = parseFloat(this.value);
    };
    lightColor.oninput = function() {
        currentLight.color.set(this.value);
    };
    lightPosX.oninput = function() {
        currentLight.position.x = parseFloat(this.value);
    };
    lightPosY.oninput = function() {
        currentLight.position.y = parseFloat(this.value);
    };
    lightPosZ.oninput = function() {
        currentLight.position.z = parseFloat(this.value);
    };

    uiDiv.querySelector('#wireframeSwitch').addEventListener('change', function() {
        const wireframe = this.checked;
        if (!loadedModel) return;
        loadedModel.traverse(obj => {
            if (obj.isMesh && obj.material) {
                const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
                mats.forEach(mat => {
                    if ('wireframe' in mat) {
                        mat.wireframe = wireframe;
                        if (wireframe) {
                            if (mat.map) {
                                mat._originalMap = mat.map;
                                mat.map = null;
                                mat.needsUpdate = true;
                            }
                        } else {
                            if (mat._originalMap) {
                                mat.map = mat._originalMap;
                                mat._originalMap = undefined;
                                mat.needsUpdate = true;
                            }
                        }
                    }
                });
            }
        });
    });

    updateLightType();

    window.addEventListener('resize', () => {
        const w = container.clientWidth, h = container.clientHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
    });

    function animate() {
        requestAnimationFrame(animate);
        controls.update();
        if (!staticOnly && animating) {
            if (isCrushState && crushMixer) {
                crushMixer.update(clock.getDelta());
            } else if (mixer) {
                mixer.update(clock.getDelta());
            }
        }
        if (rotating && loadedModel) {
            loadedModel.rotation.y += ROTATE_SPEED;
        }
        renderer.render(scene, camera);
    }
    animate();
}

// logic to switch models on load from 'learn more' on homepage
document.addEventListener('DOMContentLoaded', () => {
    
    let modelKey = 'coke';
    const params = new URLSearchParams(window.location.search);
    const paramModel = params.get('model');
    if (paramModel && MODEL_CONFIGS[paramModel]) {
        modelKey = paramModel;
    }
    createThreeViewerMain(MODEL_CONFIGS[modelKey]);
    currentModelKey = modelKey;

    // selection logic
    document.querySelectorAll('.accordion-horizontal-header').forEach((btn) => {
        btn.addEventListener('click', () => {
            const modelKey = btn.getAttribute('data-model');
            if (modelKey && MODEL_CONFIGS[modelKey] && modelKey !== currentModelKey) {
                createThreeViewerMain(MODEL_CONFIGS[modelKey]);
                currentModelKey = modelKey;
            }
        });
    });
});
