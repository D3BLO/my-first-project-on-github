
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// تنبيه مرئي لو حصل أي خطأ في كود الموبايل
window.addEventListener('error', (e) => {
    const errDiv = document.createElement('div');
    errDiv.style.cssText = 'position:fixed;top:70px;left:10px;right:10px;background:#991b1b;color:#fff;padding:10px;z-index:9999;font-family:monospace;font-size:12px;border-radius:8px;direction:ltr;';
    errDiv.textContent = 'RUNTIME ERROR: ' + e.message;
    document.body.appendChild(errDiv);
});

// ==========================================
// 1. محرك الموسيقى الحماسية والمؤثرات + البث الصوتي للتسجيل
// ==========================================
class EpicSpaceAudio {
    constructor() {
        this.ctx = null;
        this.enabled = false;
        this.musicPlaying = false;
        this.musicTimer = null;
        this.destNode = null;
        this.step = 0;
    }
    init() {
        if (!this.ctx) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioCtx();
            if (this.ctx.createMediaStreamDestination) {
                this.destNode = this.ctx.createMediaStreamDestination();
            }
        }
        if (this.ctx.state === 'suspended') this.ctx.resume();
    }
    toggle(forceOn = null) {
        this.init();
        this.enabled = forceOn !== null ? forceOn : !this.enabled;
        if (this.enabled) {
            this.startEpicMusic();
            this.playPing(580, 0.14);
        } else {
            this.stopEpicMusic();
        }
        return this.enabled;
    }
    connectOutput(node) {
        node.connect(this.ctx.destination);
        if (this.destNode) node.connect(this.destNode);
    }
    startEpicMusic() {
        if (this.musicPlaying || !this.enabled) return;
        this.musicPlaying = true;
        const chords = [
            [110.00, 164.81, 220.00, 261.63],
            [87.31, 130.81, 174.61, 220.00],
            [130.81, 196.00, 261.63, 329.63],
            [98.00, 146.83, 196.00, 246.94]
        ];
        const playPulse = () => {
            if (!this.musicPlaying || !this.enabled) return;
            const now = this.ctx.currentTime;
            const chord = chords[Math.floor(this.step / 8) % chords.length];

            const bassOsc = this.ctx.createOscillator();
            const bassGain = this.ctx.createGain();
            bassOsc.type = 'sawtooth';
            bassOsc.frequency.setValueAtTime(chord[0] * 0.5, now);

            const filter = this.ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(180 + (this.step % 8) * 35, now);

            bassGain.gain.setValueAtTime(0.001, now);
            bassGain.gain.linearRampToValueAtTime(0.11, now + 0.05);
            bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.42);

            bassOsc.connect(filter);
            filter.connect(bassGain);
            this.connectOutput(bassGain);
            bassOsc.start(now);
            bassOsc.stop(now + 0.44);

            const noteFreq = chord[this.step % chord.length] * (this.step % 4 === 3 ? 2 : 1);
            const leadOsc = this.ctx.createOscillator();
            const leadGain = this.ctx.createGain();
            leadOsc.type = 'triangle';
            leadOsc.frequency.setValueAtTime(noteFreq, now);

            leadGain.gain.setValueAtTime(0.001, now);
            leadGain.gain.linearRampToValueAtTime(0.055, now + 0.08);
            leadGain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

            leadOsc.connect(leadGain);
            this.connectOutput(leadGain);
            leadOsc.start(now);
            leadOsc.stop(now + 0.68);

            this.step++;
            this.musicTimer = setTimeout(playPulse, 360);
        };
        playPulse();
    }
    stopEpicMusic() {
        this.musicPlaying = false;
        if (this.musicTimer) clearTimeout(this.musicTimer);
    }
    playPing(freq = 660, dur = 0.12) {
        if (!this.enabled || !this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.35, this.ctx.currentTime + dur);
        gain.gain.setValueAtTime(0.07, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + dur);
        osc.connect(gain);
        this.connectOutput(gain);
        osc.start();
        osc.stop(this.ctx.currentTime + dur);
    }
    playSwoosh() {
        if (!this.enabled || !this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(160, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(48, this.ctx.currentTime + 0.55);
        gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.55);
        osc.connect(gain);
        this.connectOutput(gain);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.55);
    }
}
const audio = new EpicSpaceAudio();

// ==========================================
// 2. إعداد المشهد والكاميرا والريندر المتوافق مع الموبايل
// ==========================================
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x010206);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 3000);
camera.position.set(0, 110, 205);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.maxDistance = 750;
controls.minDistance = 0.7;

// ==========================================
// 3. مسجل الفيديو المباشر
// ==========================================
let mediaRecorder = null;
let recordedChunks = [];
let isRecording = false;
const btnRecord = document.getElementById('btnRecord');

function toggleRecording() {
    if (!isRecording) {
        if (!renderer.domElement.captureStream || typeof MediaRecorder === 'undefined') {
            alert('متصفحك لا يدعم تسجيل الفيديو المباشر، استخدم مسجل شاشة الموبايل.');
            return;
        }
        audio.init();
        const canvasStream = renderer.domElement.captureStream(30);
        const tracks = [...canvasStream.getVideoTracks()];
        if (audio.destNode) {
            tracks.push(...audio.destNode.stream.getAudioTracks());
        }
        const combinedStream = new MediaStream(tracks);
        recordedChunks = [];

        const options = MediaRecorder.isTypeSupported('video/webm') ? { mimeType: 'video/webm' } : {};
        mediaRecorder = new MediaRecorder(combinedStream, options);
        mediaRecorder.ondataavailable = e => { if (e.data && e.data.size > 0) recordedChunks.push(e.data); };
        mediaRecorder.onstop = () => {
            const blob = new Blob(recordedChunks, { type: 'video/webm' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `DeepSpaceCAD_AdelGamal_${Date.now()}.webm`;
            a.click();
            URL.revokeObjectURL(url);
        };

        mediaRecorder.start();
        isRecording = true;
        btnRecord.classList.add('recording');
        btnRecord.textContent = '⏹ STOP REC';
    } else {
        stopRecordingIfActive();
    }
}

function stopRecordingIfActive() {
    if (isRecording && mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
    }
    isRecording = false;
    btnRecord.classList.remove('recording');
    btnRecord.textContent = '⏺ REC';
}

btnRecord.addEventListener('click', toggleRecording);

// ==========================================
// 4. مولد الخامات الخفيف والسريع للموبايل
// ==========================================
function buildTexture(mode, c1, c2, c3) {
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 256;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = c1;
    ctx.fillRect(0, 0, 512, 256);

    if (mode === 'gas') {
        for (let y = 0; y < 256; y += 3) {
            const wave = Math.sin(y * 0.12) * 0.5 + 0.5;
            ctx.fillStyle = wave > 0.5 ? c2 : c3;
            ctx.globalAlpha = 0.28;
            ctx.fillRect(0, y, 512, 3);
        }
    } else if (mode === 'earth') {
        ctx.fillStyle = '#15803d';
        ctx.globalAlpha = 0.92;
        for (let i = 0; i < 45; i++) {
            ctx.beginPath();
            ctx.arc(Math.random() * 512, 30 + Math.random() * 195, 10 + Math.random() * 24, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(0, 0, 512, 14);
        ctx.fillRect(0, 242, 512, 14);
    } else if (mode === 'night') {
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, 512, 256);
        for (let c = 0; c < 35; c++) {
            const cx = Math.random() * 512;
            const cy = 40 + Math.random() * 175;
            for (let p = 0; p < 25; p++) {
                ctx.fillStyle = '#fbbf24';
                ctx.globalAlpha = 0.7;
                ctx.fillRect(cx + (Math.random() - 0.5) * 24, cy + (Math.random() - 0.5) * 16, 1.5, 1.5);
            }
        }
    } else if (mode === 'clouds') {
        ctx.clearRect(0, 0, 512, 256);
        ctx.fillStyle = '#ffffff';
        for (let i = 0; i < 80; i++) {
            ctx.globalAlpha = 0.22;
            ctx.beginPath();
            ctx.ellipse(Math.random() * 512, Math.random() * 256, 20 + Math.random() * 40, 4 + Math.random() * 7, 0.1, 0, Math.PI * 2);
            ctx.fill();
        }
    } else {
        for (let i = 0; i < 150; i++) {
            ctx.fillStyle = i % 2 === 0 ? c2 : c3;
            ctx.globalAlpha = 0.25;
            ctx.beginPath();
            ctx.arc(Math.random() * 512, Math.random() * 256, 2 + Math.random() * 12, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    return new THREE.CanvasTexture(canvas);
}

// ==========================================
// 5. البيئة الفضائية والنجوم
// ==========================================
const polarGrid = new THREE.PolarGridHelper(290, 24, 18, 64, 0x0ea5e9, 0x0f172a);
polarGrid.position.y = -4;
scene.add(polarGrid);

const starGeo = new THREE.BufferGeometry();
const starCount = 4500;
const starPos = new Float32Array(starCount * 3);
for (let i = 0; i < starCount * 3; i++) {
    starPos[i] = (Math.random() - 0.5) * 2000;
}
starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xe0f2fe, size: 1.3 })));

scene.add(new THREE.AmbientLight(0x334155, 1.4));
const sunLight = new THREE.PointLight(0xfffbeb, 3.8, 1200, 0.25);
scene.add(sunLight);

// ==========================================
// 6. بناء الأجسام الفضائية والتلسكوبات
// ==========================================
const registry = {};
const interactiveMeshes = [];
const orbitLines = [];
const wireframeMats = [];

function registerObject(id, obj3D, info) {
    registry[id] = { obj3D, info };
    obj3D.traverse(child => {
        if (child.isMesh) {
            child.userData.targetId = id;
            interactiveMeshes.push(child);
        }
    });
}

// الشمس
const sunGroup = new THREE.Group();
const sunCore = new THREE.Mesh(
    new THREE.SphereGeometry(11, 48, 48),
    new THREE.MeshBasicMaterial({ map: buildTexture('gas', '#f59e0b', '#fef08a', '#ea580c') })
);
const sunGlow = new THREE.Mesh(
    new THREE.SphereGeometry(12.4, 32, 32),
    new THREE.MeshBasicMaterial({ color: 0xfb923c, transparent: true, opacity: 0.25, side: THREE.BackSide })
);
const sunCadRing = new THREE.Mesh(
    new THREE.RingGeometry(13.8, 14.1, 64),
    new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide, transparent: true, opacity: 0.45 })
);
sunCadRing.rotation.x = Math.PI / 2;
sunGroup.add(sunCore, sunGlow, sunCadRing);
scene.add(sunGroup);

registerObject('sun', sunGroup, {
    name: 'الشمس (The Sun)',
    category: 'G2V MAIN-SEQUENCE STAR',
    desc: 'النجم المركزي للمجموعة الشمسية، يشكل 99.86% من إجمالي كتلة النظام الشمسي ويولد طاقته عبر الاندماج النووي المستمر.',
    radiusView: 11, gravFactor: 27.9, hasCutaway: false,
    specs: [
        { label: 'القطر الفعلي', val: '1,392,700 km' }, { label: 'حرارة السطح', val: '5,500 °C' },
        { label: 'حرارة النواة', val: '15.7M °C' }, { label: 'العمر', val: '4.6B Years' },
        { label: 'الجاذبية', val: '274 m/s²' }, { label: 'الدوران', val: '25.4 Days' }
    ]
});

function createPlanetCutaway(radius) {
    const group = new THREE.Group();
    const layers = [
        { r: radius * 0.98, color: 0x64748b },
        { r: radius * 0.82, color: 0xdc2626 },
        { r: radius * 0.52, color: 0xf97316 },
        { r: radius * 0.28, color: 0xfef08a }
    ];
    layers.forEach(l => {
        const sphere = new THREE.Mesh(
            new THREE.SphereGeometry(l.r, 24, 24, 0, Math.PI * 1.5),
            new THREE.MeshStandardMaterial({ color: l.color, roughness: 0.4, side: THREE.DoubleSide })
        );
        group.add(sphere);
    });
    const planeMat = new THREE.MeshBasicMaterial({ color: 0xf97316, side: THREE.DoubleSide });
    const cut1 = new THREE.Mesh(new THREE.CircleGeometry(radius * 0.96, 24), planeMat);
    cut1.rotation.y = Math.PI / 2;
    const cut2 = new THREE.Mesh(new THREE.CircleGeometry(radius * 0.96, 24), planeMat);
    group.add(cut1, cut2);
    group.visible = false;
    return group;
}

const planetsConfig = [
    {
        id: 'mercury', name: 'عطارد (Mercury)', cat: 'TERRESTRIAL PLANET',
        desc: 'أصغر كواكب المجموعة الشمسية وأقربها للشمس. سطحه صخري مليء بالفوهات النيزكية ويمتلك نواة حديدية ضخمة.',
        mode: 'rock', c1: '#94a3b8', c2: '#64748b', c3: '#334155',
        r: 1.3, dist: 21, speed: 0.032, tilt: 0.03, grav: 0.38,
        specs: [
            { label: 'القطر', val: '4,879 km' }, { label: 'المسافة', val: '57.9M km' },
            { label: 'طول السنة', val: '88 Days' }, { label: 'السرعة', val: '47.4 km/s' },
            { label: 'الحرارة', val: '-180 to 430°C' }, { label: 'الأقمار', val: '0' }
        ]
    },
    {
        id: 'venus', name: 'الزهرة (Venus)', cat: 'TERRESTRIAL PLANET',
        desc: 'الكوكب الأكثر سخونة بسبب غلافه الجوي الكثيف من ثاني أكسيد الكربون، ويدور حول محوره في اتجاه معاكس لباقي الكواكب.',
        mode: 'gas', c1: '#eab308', c2: '#fef08a', c3: '#ca8a04',
        r: 1.9, dist: 30, speed: 0.015, tilt: 177.3, grav: 0.90,
        specs: [
            { label: 'القطر', val: '12,104 km' }, { label: 'المسافة', val: '108.2M km' },
            { label: 'طول السنة', val: '225 Days' }, { label: 'الضغط', val: '92 bar' },
            { label: 'الحرارة', val: '465 °C' }, { label: 'الأقمار', val: '0' }
        ]
    },
    {
        id: 'earth', name: 'الأرض (Earth)', cat: 'HABITABLE PLANET',
        desc: 'الكوكب الوحيد المعروف باحتضانه للحياة، يغطي الماء 71% من سطحه وتظهر أضواء مدنه الذهبية في الجانب الليلي المظلم.',
        mode: 'earth', c1: '#1d4ed8', c2: '#16a34a', c3: '#0284c7',
        r: 2.2, dist: 42, speed: 0.01, tilt: 23.4, grav: 1.00, isEarth: true, atmo: 0x38bdf8,
        specs: [
            { label: 'القطر', val: '12,742 km' }, { label: 'المسافة', val: '149.6M km' },
            { label: 'طول السنة', val: '365.25 Days' }, { label: 'السرعة', val: '29.78 km/s' },
            { label: 'ميل المحور', val: '23.44°' }, { label: 'الأقمار', val: '1 (القمر)' }
        ]
    },
    {
        id: 'mars', name: 'المريخ (Mars)', cat: 'TERRESTRIAL PLANET',
        desc: 'الكوكب الأحمر الغني بأكسيد الحديد، يضم أعلى بركان في المجموعة الشمسية (أوليمبوس مونس) وأودية عملاقة.',
        mode: 'mars', c1: '#dc2626', c2: '#991b1b', c3: '#7f1d1d',
        r: 1.6, dist: 56, speed: 0.0075, tilt: 25.2, grav: 0.38, atmo: 0xf87171,
        specs: [
            { label: 'القطر', val: '6,779 km' }, { label: 'المسافة', val: '227.9M km' },
            { label: 'طول السنة', val: '687 Days' }, { label: 'الجاذبية', val: '3.72 m/s²' },
            { label: 'الحرارة', val: '-65 °C' }, { label: 'الأقمار', val: '2' }
        ]
    },
    {
        id: 'jupiter', name: 'المشتري (Jupiter)', cat: 'GAS GIANT',
        desc: 'عملاق الكواكب الغازية، كتلته تفوق كتلة جميع الكواكب الأخرى مجتمعة بمرتين ونصف، ويشتهر بعاصفة البقعة الحمراء العظيمة.',
        mode: 'gas', c1: '#d97706', c2: '#fef3c7', c3: '#9a3412',
        r: 5.2, dist: 82, speed: 0.004, tilt: 3.1, grav: 2.53,
        specs: [
            { label: 'القطر', val: '139,820 km' }, { label: 'المسافة', val: '778.5M km' },
            { label: 'طول السنة', val: '11.86 Years' }, { label: 'طول اليوم', val: '9.9 Hours' },
            { label: 'الأقمار', val: '95 قمر' }, { label: 'الجاذبية', val: '24.79 m/s²' }
        ]
    },
    {
        id: 'saturn', name: 'زحل (Saturn)', cat: 'GAS GIANT // RINGED',
        desc: 'جوهرة النظام الشمسي بنظام حلقاته الجليدية والصخرية العملاق الممتد لمئات الآلاف من الكيلومترات.',
        mode: 'gas', c1: '#eab308', c2: '#fef9c3', c3: '#a16207',
        r: 4.3, dist: 112, speed: 0.0022, tilt: 26.7, grav: 1.06, hasRings: true,
        specs: [
            { label: 'القطر', val: '116,460 km' }, { label: 'المسافة', val: '1.43B km' },
            { label: 'طول السنة', val: '29.45 Years' }, { label: 'الحلقات', val: '282,000 km' },
            { label: 'الأقمار', val: '146 (تيتان)' }, { label: 'الكثافة', val: '0.687 g/cm³' }
        ]
    },
    {
        id: 'uranus', name: 'أورانوس (Uranus)', cat: 'ICE GIANT',
        desc: 'عملاق جليدي يميل محور دورانه بزاوية 98 درجة تقريباً مما يجعله يتدحرج في مداره حول الشمس.',
        mode: 'gas', c1: '#06b6d4', c2: '#cffafe', c3: '#0891b2',
        r: 2.9, dist: 140, speed: 0.0012, tilt: 97.8, grav: 0.89,
        specs: [
            { label: 'القطر', val: '50,724 km' }, { label: 'المسافة', val: '2.87B km' },
            { label: 'طول السنة', val: '84 Years' }, { label: 'ميل المحور', val: '97.77°' },
            { label: 'الحرارة', val: '-224 °C' }, { label: 'الأقمار', val: '28 قمر' }
        ]
    },
    {
        id: 'neptune', name: 'نبتون (Neptune)', cat: 'ICE GIANT',
        desc: 'أبعد كواكب المجموعة الشمسية، يتميز بأعنف رياح في النظام الشمسي تتجاوز سرعتها 2,100 كم/ساعة.',
        mode: 'gas', c1: '#2563eb', c2: '#93c5fd', c3: '#1e3a8a',
        r: 2.8, dist: 165, speed: 0.0009, tilt: 28.3, grav: 1.14,
        specs: [
            { label: 'القطر', val: '49,244 km' }, { label: 'المسافة', val: '4.50B km' },
            { label: 'طول السنة', val: '164.8 Years' }, { label: 'الرياح', val: '2,100 km/h' },
            { label: 'الحرارة', val: '-214 °C' }, { label: 'الأقمار', val: '16' }
        ]
    }
];

const planetNodes = {};

planetsConfig.forEach(p => {
    const pivot = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({
        map: buildTexture(p.mode, p.c1, p.c2, p.c3),
        roughness: 0.55, metalness: 0.1
    });
    wireframeMats.push(mat);

    const mesh = new THREE.Mesh(new THREE.SphereGeometry(p.r, 48, 48), mat);
    mesh.rotation.z = THREE.MathUtils.degToRad(p.tilt);
    pivot.add(mesh);

    const cutaway = createPlanetCutaway(p.r);
    cutaway.rotation.z = THREE.MathUtils.degToRad(p.tilt);
    pivot.add(cutaway);

    if (p.isEarth) {
        const cloudMesh = new THREE.Mesh(
            new THREE.SphereGeometry(p.r * 1.025, 36, 36),
            new THREE.MeshStandardMaterial({
                map: buildTexture('clouds', '#fff', '#fff', '#fff'),
                transparent: true, opacity: 0.85, depthWrite: false
            })
        );
        mesh.add(cloudMesh);
        pivot.userData.clouds = cloudMesh;
    }

    if (p.atmo) {
        const atmo = new THREE.Mesh(
            new THREE.SphereGeometry(p.r * 1.09, 24, 24),
            new THREE.MeshBasicMaterial({ color: p.atmo, transparent: true, opacity: 0.24, side: THREE.BackSide })
        );
        mesh.add(atmo);
    }

    if (p.hasRings) {
        const r1 = new THREE.Mesh(
            new THREE.RingGeometry(p.r * 1.35, p.r * 1.85, 64),
            new THREE.MeshStandardMaterial({ color: 0xfde047, side: THREE.DoubleSide, transparent: true, opacity: 0.82 })
        );
        const r2 = new THREE.Mesh(
            new THREE.RingGeometry(p.r * 1.92, p.r * 2.45, 64),
            new THREE.MeshStandardMaterial({ color: 0xd97706, side: THREE.DoubleSide, transparent: true, opacity: 0.65 })
        );
        r1.rotation.x = r2.rotation.x = Math.PI / 2.25;
        mesh.add(r1, r2);
    }

    const axisLine = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, -p.r * 1.8, 0), new THREE.Vector3(0, p.r * 1.8, 0)]),
        new THREE.LineBasicMaterial({ color: 0xf43f5e, transparent: true, opacity: 0.75 })
    );
    mesh.add(axisLine);
    orbitLines.push(axisLine);

    const pts = new THREE.EllipseCurve(0, 0, p.dist, p.dist, 0, 2 * Math.PI).getPoints(120);
    const oLine = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(pts),
        new THREE.LineBasicMaterial({ color: 0x0ea5e9, transparent: true, opacity: 0.32 })
    );
    oLine.rotation.x = Math.PI / 2;
    scene.add(oLine);
    orbitLines.push(oLine);

    scene.add(pivot);
    planetNodes[p.id] = { pivot, mesh, cutaway, mat, config: p, angle: Math.random() * Math.PI * 2 };

    registerObject(p.id, pivot, {
        name: p.name, category: p.cat, desc: p.desc,
        radiusView: p.r, gravFactor: p.grav, hasCutaway: true, specs: p.specs
    });
});

// الأقمار
const moonMesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.55, 24, 24),
    new THREE.MeshStandardMaterial({ map: buildTexture('rock', '#cbd5e1', '#64748b', '#334155') })
);
planetNodes['earth'].pivot.add(moonMesh);
registerObject('moon', moonMesh, {
    name: 'القمر (The Moon)', category: 'EARTH NATURAL SATELLITE',
    desc: 'التابع الطبيعي الوحيد للأرض وأول جرم سماوي تطأه قدم الإنسان عام 1969، ويسبب ظاهرة المد والجزر في محيطات الأرض.',
    radiusView: 0.6, gravFactor: 0.165, hasCutaway: false,
    specs: [
        { label: 'القطر', val: '3,474 km' }, { label: 'البعد عن الأرض', val: '384,400 km' },
        { label: 'الجاذبية', val: '1.62 m/s²' }, { label: 'الدورة', val: '27.3 Days' }
    ]
});

const europaMesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.65, 24, 24),
    new THREE.MeshStandardMaterial({ map: buildTexture('rock', '#f8fafc', '#bae6fd', '#94a3b8') })
);
planetNodes['jupiter'].pivot.add(europaMesh);
registerObject('europa', europaMesh, {
    name: 'قمر أوروبا (Europa)', category: 'JOVIAN GALILEAN MOON',
    desc: 'أحد أكبر أقمار المشتري، يغطيه محيط مائي سائل ضخم تحت قشرة جليدية سميكة، ويُعد من أهم المرشحين لوجود حياة ميكروبية.',
    radiusView: 0.7, gravFactor: 0.134, hasCutaway: false,
    specs: [
        { label: 'القطر', val: '3,121 km' }, { label: 'الكوكب الأم', val: 'المشتري' },
        { label: 'السطح', val: 'قشرة جليدية' }, { label: 'الدورة', val: '3.55 Days' }
    ]
});

const titanMesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.75, 24, 24),
    new THREE.MeshStandardMaterial({ map: buildTexture('gas', '#f59e0b', '#d97706', '#b45309') })
);
planetNodes['saturn'].pivot.add(titanMesh);
registerObject('titan', titanMesh, {
    name: 'قمر تيتان (Titan)', category: 'SATURN LARGEST MOON',
    desc: 'أكبر أقمار زحل والقمر الوحيد في المجموعة الشمسية الذي يمتلك غلافاً جوياً كثيفاً وبحيرات سائلة من الميثان والإيثان على سطحه.',
    radiusView: 0.8, gravFactor: 0.14, hasCutaway: false,
    specs: [
        { label: 'القطر', val: '5,149 km' }, { label: 'الكوكب الأم', val: 'زحل' },
        { label: 'الغلاف الجوي', val: 'نيتروجين 95%' }, { label: 'الحرارة', val: '-179 °C' }
    ]
});

// المركبات والتلسكوبات
const goldMat = new THREE.MeshStandardMaterial({ color: 0xfbbf24, metalness: 0.85, roughness: 0.2 });
const silverMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.8, roughness: 0.25 });
const solarMat = new THREE.MeshStandardMaterial({ color: 0x1d4ed8, metalness: 0.6, roughness: 0.2, emissive: 0x1e3a8a, emissiveIntensity: 0.4 });
const darkMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.5, roughness: 0.5 });

function addBeaconRing(group, radius) {
    const ring = new THREE.Mesh(
        new THREE.RingGeometry(radius, radius * 1.12, 24),
        new THREE.MeshBasicMaterial({ color: 0x10b981, side: THREE.DoubleSide, transparent: true, opacity: 0.7 })
    );
    ring.rotation.x = Math.PI / 2;
    group.add(ring);
    orbitLines.push(ring);
}

const jwstGroup = new THREE.Group();
const shield = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.55, 0.04, 5), silverMat);
shield.scale.set(1.4, 1, 0.9);
const mirror = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.05, 6), goldMat);
mirror.rotation.x = Math.PI / 2;
mirror.position.set(0, 0.22, 0.08);
const tripod = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.35, 3), darkMat);
tripod.rotation.x = Math.PI / 2;
tripod.position.set(0, 0.22, 0.28);
jwstGroup.add(shield, mirror, tripod);
addBeaconRing(jwstGroup, 0.75);
scene.add(jwstGroup);
registerObject('jwst', jwstGroup, {
    name: 'تلسكوب جيمس ويب (JWST)', category: 'SPACE TELESCOPE // L2 ORBIT',
    desc: 'أقوى تلسكوب فضائي تم إطلاقه على الإطلاق، يرصد الكون بالأشعة تحت الحمراء بمرآة ذهبية قطرها 6.5 متر ودرع حراري من 5 طبقات.',
    radiusView: 0.7, gravFactor: 0, hasCutaway: false,
    specs: [
        { label: 'الإطلاق', val: '25 Dec 2021' }, { label: 'الموقع', val: 'Sun-Earth L2' },
        { label: 'البعد', val: '1.5M km' }, { label: 'المرآة', val: '6.5 meters' }
    ]
});

const hubbleGroup = new THREE.Group();
const hBody = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.65, 16), silverMat);
hBody.rotation.z = Math.PI / 2;
const hPanel1 = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.02, 0.9), solarMat);
hubbleGroup.add(hBody, hPanel1);
addBeaconRing(hubbleGroup, 0.6);
scene.add(hubbleGroup);
registerObject('hubble', hubbleGroup, {
    name: 'تلسكوب هابل (Hubble)', category: 'OPTICAL SPACE TELESCOPE // LEO',
    desc: 'أحد أهم التلسكوبات في تاريخ الفلك، يدور في مدار أرضي منخفض والتقط أعمق الصور للمجرات السحيقة والسدم.',
    radiusView: 0.55, gravFactor: 0, hasCutaway: false,
    specs: [
        { label: 'الإطلاق', val: '24 Apr 1990' }, { label: 'الارتفاع', val: '540 km' },
        { label: 'السرعة', val: '27,300 km/h' }, { label: 'المرآة', val: '2.4 meters' }
    ]
});

const issGroup = new THREE.Group();
const truss = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.04, 0.04), silverMat);
const modules = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.45, 12), silverMat);
modules.rotation.x = Math.PI / 2;
const issSolar1 = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.01, 0.65), solarMat);
issSolar1.position.x = -0.35;
const issSolar2 = issSolar1.clone();
issSolar2.position.x = 0.35;
issGroup.add(truss, modules, issSolar1, issSolar2);
addBeaconRing(issGroup, 0.65);
scene.add(issGroup);
registerObject('iss', issGroup, {
    name: 'محطة الفضاء الدولية (ISS)', category: 'ORBITAL RESEARCH STATION',
    desc: 'أكبر جسم اصطناعي في مدار الأرض ومختبر أبحاث الجاذبية الصغرى المأهول باستمرار منذ عام 2000.',
    radiusView: 0.6, gravFactor: 0.89, hasCutaway: false,
    specs: [
        { label: 'التجميع', val: '1998' }, { label: 'الارتفاع', val: '408 km' },
        { label: 'السرعة', val: '7.66 km/s' }, { label: 'الكتلة', val: '420,000 kg' }
    ]
});

const curGroup = new THREE.Group();
const roverBody = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.14, 0.22), silverMat);
const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.22, 10), goldMat);
mast.position.set(0.08, 0.16, 0.05);
curGroup.add(roverBody, mast);
addBeaconRing(curGroup, 0.45);
scene.add(curGroup);
registerObject('curiosity', curGroup, {
    name: 'مسبار كيوريوسيتي (Curiosity)', category: 'MARS SCIENCE LABORATORY',
    desc: 'مركبة جوالة تعمل بالطاقة النووية تستكشف فوهة غيل على سطح المريخ لدراسة جيولوجيا الكوكب وصلاحيته للحياة.',
    radiusView: 0.45, gravFactor: 0.38, hasCutaway: false,
    specs: [
        { label: 'الهبوط', val: '6 Aug 2012' }, { label: 'الموقع', val: 'Gale Crater' },
        { label: 'الطاقة', val: 'MMRTG Nuclear' }, { label: 'الكتلة', val: '899 kg' }
    ]
});

const junoGroup = new THREE.Group();
const jCore = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.16, 6), goldMat);
for (let i = 0; i < 3; i++) {
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.015, 0.16), solarMat);
    const ang = (i * Math.PI * 2) / 3;
    arm.position.set(Math.cos(ang) * 0.42, 0, Math.sin(ang) * 0.42);
    arm.rotation.y = -ang;
    junoGroup.add(arm);
}
junoGroup.add(jCore);
addBeaconRing(junoGroup, 0.85);
scene.add(junoGroup);
registerObject('juno', junoGroup, {
    name: 'مسبار جونو (Juno Probe)', category: 'JOVIAN POLAR ORBITER',
    desc: 'مركبة فضائية تدور في مدار قطبي حول المشتري لدراسة تركيبه الداخلي ومجاله المغناطيسي الجبار وغلافه الجوي.',
    radiusView: 0.75, gravFactor: 0, hasCutaway: false,
    specs: [
        { label: 'الإطلاق', val: '5 Aug 2011' }, { label: 'الوصول', val: '4 Jul 2016' },
        { label: 'المدار', val: 'Polar Orbit' }, { label: 'السرعة', val: '265,000 km/h' }
    ]
});

const cassiniGroup = new THREE.Group();
const cDish = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.12, 16), silverMat);
cDish.rotation.x = Math.PI;
cDish.position.y = 0.22;
const cBody = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.35, 12), goldMat);
cassiniGroup.add(cDish, cBody);
addBeaconRing(cassiniGroup, 0.65);
scene.add(cassiniGroup);
registerObject('cassini', cassiniGroup, {
    name: 'مسبار كاسيني (Cassini)', category: 'SATURN SYSTEM ORBITER',
    desc: 'أمضى 13 عاماً في استكشاف زحل وحلقاته وأقماره وأطلق مسبار هويجنز للهبوط على قمر تيتان.',
    radiusView: 0.6, gravFactor: 0, hasCutaway: false,
    specs: [
        { label: 'الإطلاق', val: '15 Oct 1997' }, { label: 'الوصول', val: '1 Jul 2004' },
        { label: 'نهاية المهمة', val: '15 Sep 2017' }, { label: 'الوكالة', val: 'NASA / ESA' }
    ]
});

const voyagerGroup = new THREE.Group();
const vDish = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.14, 24), silverMat);
vDish.rotation.x = Math.PI;
const vBus = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.12, 10), goldMat);
vBus.position.y = -0.1;
const vBoom = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.9, 8), darkMat);
vBoom.rotation.z = Math.PI / 2;
vBoom.position.set(0.45, -0.1, 0);
voyagerGroup.add(vDish, vBus, vBoom);
addBeaconRing(voyagerGroup, 0.8);
voyagerGroup.position.set(195, 42, -155);
scene.add(voyagerGroup);
registerObject('voyager1', voyagerGroup, {
    name: 'مسبار فوييجر 1 (Voyager 1)', category: 'INTERSTELLAR SPACECRAFT',
    desc: 'أبعد جسم من صنع الإنسان في الكون! غادر الغلاف الشمسي ودخل الفضاء بين النجمي حاملاً الأسطوانة الذهبية.',
    radiusView: 0.75, gravFactor: 0, hasCutaway: false,
    specs: [
        { label: 'الإطلاق', val: '5 Sep 1977' }, { label: 'البعد', val: '> 24.8B km' },
        { label: 'السرعة', val: '17.0 km/s' }, { label: 'الإشارة', val: '22.5 Hours' }
    ]
});

const laserGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
const laserLine = new THREE.Line(
    laserGeo,
    new THREE.LineBasicMaterial({ color: 0x10b981, transparent: true, opacity: 0.9 })
);
laserLine.visible = false;
scene.add(laserLine);

// ==========================================
// 7. محرك الإخراج السينمائي + شاشة الختام
// ==========================================
let activeId = 'all';
let isInspecting = false;
let isCinematic = false;
let isCadMode = false;
let isCutaway = false;
let isLaserOn = false;
let timeSpeed = 1;
let cinemaTimer = 0;
let cinemaIdx = 0;

const movieScenes = [
    { id: 'sun', shot: 'CRANE_SWEEP', duration: 5.0, caption: 'CAM 01 [CRANE SWEEP] // THE SOLAR FURNACE — 15.7M °C' },
    { id: 'earth', shot: 'ECLIPSE_RIM', duration: 5.5, caption: 'CAM 02 [SOLAR ECLIPSE] // EARTH NIGHT-SIDE CITY LIGHTS' },
    { id: 'iss', shot: 'CHASE_CAM', duration: 5.0, caption: 'CAM 03 [CHASE CAM] // ISS ORBITAL FLYOVER ABOVE EARTH' },
    { id: 'jwst', shot: 'DOLLY_ZOOM', duration: 5.0, caption: 'CAM 04 [DOLLY ZOOM] // JAMES WEBB TELESCOPE AT L2' },
    { id: 'mars', shot: 'LOW_FLYBY', duration: 5.0, caption: 'CAM 05 [GRAZING FLYBY] // MARS RED PLANET HORIZON' },
    { id: 'jupiter', shot: 'DUTCH_TILT', duration: 5.5, caption: 'CAM 06 [DUTCH ROLL] // JUPITER & GREAT RED SPOT' },
    { id: 'saturn', shot: 'RING_SKIM', duration: 6.0, caption: 'CAM 07 [RING SKIMMER] // SATURN ICE RINGS & CASSINI' },
    { id: 'voyager1', shot: 'DEEP_DRIFT', duration: 5.5, caption: 'CAM 08 [DEEP DRIFT] // VOYAGER 1 IN INTERSTELLAR SPACE' }
];

const inspPanel = document.getElementById('inspectorPanel');
const reticle = document.getElementById('targetReticle');
const creditsOverlay = document.getElementById('creditsOverlay');
const btnCutaway = document.getElementById('btnCutaway');
const btnLaser = document.getElementById('btnLaser');
const layersLegend = document.getElementById('layersLegend');

function resetCutaways() {
    isCutaway = false;
    btnCutaway.classList.remove('active');
    layersLegend.classList.add('hidden');
    Object.values(planetNodes).forEach(n => {
        n.mesh.visible = true;
        n.cutaway.visible = false;
    });
}

function focusTarget(id, openPanel = true) {
    activeId = id;
    resetCutaways();
    audio.playSwoosh();

    document.querySelectorAll('.nav-btn[data-id]').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.id === id);
    });

    if (id === 'all') {
        isInspecting = false;
        inspPanel.classList.add('hidden');
        reticle.classList.add('hidden');
        laserLine.visible = false;
        return;
    }

    const entry = registry[id];
    if (!entry) return;

    if (openPanel) {
        isInspecting = true;
        inspPanel.classList.remove('hidden');
        reticle.classList.remove('hidden');
        document.getElementById('reticleTag').textContent = `LOCKED // ${id.toUpperCase()}`;

        document.getElementById('inspName').textContent = entry.info.name;
        document.getElementById('inspCategory').textContent = entry.info.category;
        document.getElementById('inspDesc').textContent = entry.info.desc;

        btnCutaway.disabled = !entry.info.hasCutaway;

        document.getElementById('specGrid').innerHTML = entry.info.specs.map(s => `
            <div class="spec-card">
                <span class="spec-label">${s.label}</span>
                <span class="spec-val">${s.val}</span>
            </div>
        `).join('');

        const w = (100 * entry.info.gravFactor).toFixed(1);
        document.getElementById('gravWeight').textContent = entry.info.gravFactor === 0 ? '0.0 kg (Micro-G)' : `${w} kg`;
        document.getElementById('gravBar').style.width = `${Math.min(entry.info.gravFactor * 35, 100)}%`;
    }
}

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let downPos = { x: 0, y: 0 };

renderer.domElement.addEventListener('pointerdown', e => { downPos = { x: e.clientX, y: e.clientY }; });
renderer.domElement.addEventListener('pointerup', e => {
    if (Math.hypot(e.clientX - downPos.x, e.clientY - downPos.y) > 6) return;
    pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);

    const hits = raycaster.intersectObjects(interactiveMeshes, false);
    if (hits.length > 0 && hits[0].object.userData.targetId) {
        stopMovieMode();
        focusTarget(hits[0].object.userData.targetId, true);
    }
});

function startMovieMode() {
    creditsOverlay.classList.add('hidden');
    isCinematic = true;
    document.body.classList.add('movie-mode');
    document.getElementById('btnCinema').textContent = '⏹ إيقاف التصوير';
    cinemaIdx = 0;
    cinemaTimer = 0;

    const audioOn = audio.toggle(true);
    const btnAud = document.getElementById('btnAudio');
    btnAud.classList.toggle('active', audioOn);
    btnAud.textContent = '🔊 الصوت';

    document.getElementById('cinemaCaption').textContent = movieScenes[0].caption;
    focusTarget(movieScenes[0].id, true);
}

function stopMovieMode(showEndCredits = false) {
    isCinematic = false;
    camera.fov = 45;
    camera.updateProjectionMatrix();
    camera.up.set(0, 1, 0);
    document.body.classList.remove('movie-mode');
    document.getElementById('btnCinema').textContent = '🎬 إخراج سينمائي (Movie Mode)';

    if (showEndCredits) {
        isInspecting = false;
        inspPanel.classList.add('hidden');
        reticle.classList.add('hidden');
        activeId = 'all';
        creditsOverlay.classList.remove('hidden');
        stopRecordingIfActive();
    }
}

document.getElementById('btnCloseInsp').addEventListener('click', () => {
    isInspecting = false;
    inspPanel.classList.add('hidden');
    reticle.classList.add('hidden');
    resetCutaways();
});

document.querySelectorAll('.nav-btn[data-id]').forEach(btn => {
    btn.addEventListener('click', () => {
        stopMovieMode(false);
        focusTarget(btn.dataset.id, true);
    });
});

document.getElementById('btnCinema').addEventListener('click', () => {
    if (!isCinematic) {
        startMovieMode();
    } else {
        stopMovieMode(false);
    }
});

document.getElementById('btnReplayCinema').addEventListener('click', () => {
    startMovieMode();
});

document.getElementById('btnExitCredits').addEventListener('click', () => {
    creditsOverlay.classList.add('hidden');
});

btnCutaway.addEventListener('click', () => {
    if (!planetNodes[activeId]) return;
    isCutaway = !isCutaway;
    btnCutaway.classList.toggle('active', isCutaway);
    layersLegend.classList.toggle('hidden', !isCutaway);
    planetNodes[activeId].mesh.visible = !isCutaway;
    planetNodes[activeId].cutaway.visible = isCutaway;
    audio.playPing(780, 0.15);
});

btnLaser.addEventListener('click', () => {
    isLaserOn = !isLaserOn;
    btnLaser.classList.toggle('active', isLaserOn);
    laserLine.visible = isLaserOn && activeId !== 'all' && activeId !== 'earth';
    audio.playPing(880, 0.12);
});

document.getElementById('btnAudio').addEventListener('click', e => {
    const on = audio.toggle();
    e.target.classList.toggle('active', on);
    e.target.textContent = on ? '🔊 الصوت' : '🔇 الصوت';
});

document.getElementById('btnCad').addEventListener('click', e => {
    isCadMode = !isCadMode;
    e.target.classList.toggle('active');
    wireframeMats.forEach(m => {
        m.wireframe = isCadMode;
        m.emissive = new THREE.Color(isCadMode ? 0x0284c7 : 0x000000);
        m.emissiveIntensity = isCadMode ? 0.55 : 0;
    });
});

document.getElementById('btnOrbits').addEventListener('click', e => {
    e.target.classList.toggle('active');
    const v = e.target.classList.contains('active');
    orbitLines.forEach(l => l.visible = v);
});

document.getElementById('btnGrid').addEventListener('click', e => {
    polarGrid.visible = !polarGrid.visible;
    e.target.classList.toggle('active');
});

const speeds = [1, 3, 6, 0];
let sIdx = 0;
document.getElementById('btnSpeed').addEventListener('click', e => {
    sIdx = (sIdx + 1) % speeds.length;
    timeSpeed = speeds[sIdx];
    e.target.textContent = timeSpeed === 0 ? '⏸ متوقف' : `⏩ السرعة: ${timeSpeed}x`;
});

// ==========================================
// 8. حلقة التشغيل الرئيسية (60 FPS)
// ==========================================
const clock = new THREE.Clock();
let frames = 0, lastFpsTime = performance.now();

function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();

    frames++;
    const now = performance.now();
    if (now - lastFpsTime >= 1000) {
        document.getElementById('fps').textContent = `${frames} FPS`;
        frames = 0; lastFpsTime = now;
    }

    sunCore.rotation.y += 0.0025 * timeSpeed;

    Object.values(planetNodes).forEach(node => {
        node.angle += node.config.speed * timeSpeed * 0.45;
        node.pivot.position.set(
            Math.cos(node.angle) * node.config.dist,
            0,
            Math.sin(node.angle) * node.config.dist
        );
        node.mesh.rotation.y += 0.012 * timeSpeed;
        node.cutaway.rotation.y += 0.012 * timeSpeed;

        if (node.config.isEarth && node.pivot.userData.clouds) {
            node.pivot.userData.clouds.rotation.y += 0.004 * timeSpeed;
        }
    });

    const earthPos = planetNodes['earth'].pivot.position;
    const marsPos = planetNodes['mars'].pivot.position;
    const jupPos = planetNodes['jupiter'].pivot.position;
    const satPos = planetNodes['saturn'].pivot.position;
    const t = performance.now() * 0.001;

    moonMesh.position.set(Math.cos(t * 0.8) * 4.5, 0, Math.sin(t * 0.8) * 4.5);
    europaMesh.position.set(Math.cos(t * 1.1) * 7.8, 0.2, Math.sin(t * 1.1) * 7.8);
    titanMesh.position.set(Math.cos(t * 0.6) * 11.5, -0.3, Math.sin(t * 0.6) * 11.5);

    const earthDir = earthPos.clone().normalize();
    jwstGroup.position.copy(earthPos).addScaledVector(earthDir, 3.8);
    jwstGroup.lookAt(earthPos);
    jwstGroup.rotation.z += 0.008;

    hubbleGroup.position.set(earthPos.x + Math.cos(t * 1.4) * 3.1, 0.6, earthPos.z + Math.sin(t * 1.4) * 3.1);
    hubbleGroup.rotation.y += 0.015;

    issGroup.position.set(earthPos.x + Math.cos(-t * 1.7) * 2.8, -0.5, earthPos.z + Math.sin(-t * 1.7) * 2.8);
    issGroup.rotation.y -= 0.015;

    curGroup.position.set(marsPos.x + Math.cos(t) * 2.4, 0.3, marsPos.z + Math.sin(t) * 2.4);
    curGroup.rotation.y += 0.012;

    junoGroup.position.set(jupPos.x + Math.cos(t * 0.9) * 7.4, Math.sin(t * 0.9) * 6.5, jupPos.z);
    junoGroup.rotation.y += 0.02;

    cassiniGroup.position.set(satPos.x + Math.cos(t * 0.7) * 12.2, 1.5, satPos.z + Math.sin(t * 0.7) * 12.2);
    cassiniGroup.rotation.y += 0.012;

    voyagerGroup.rotation.y += 0.01;

    if (isCinematic) {
        cinemaTimer += delta;
        const currentScene = movieScenes[cinemaIdx];
        if (cinemaTimer >= currentScene.duration) {
            cinemaTimer = 0;
            cinemaIdx++;
            if (cinemaIdx >= movieScenes.length) {
                stopMovieMode(true);
            } else {
                const nextScene = movieScenes[cinemaIdx];
                document.getElementById('cinemaCaption').textContent = nextScene.caption;
                focusTarget(nextScene.id, true);
            }
        }
    }

    if (activeId !== 'all' && registry[activeId]) {
        const targetObj = registry[activeId].obj3D;
        const worldPos = new THREE.Vector3();
        targetObj.getWorldPosition(worldPos);
        const r = registry[activeId].info.radiusView;

        let desiredCamPos = new THREE.Vector3();
        let targetFov = 45;
        let rollAngle = 0;

        if (isCinematic && movieScenes[cinemaIdx]) {
            const sceneInfo = movieScenes[cinemaIdx];
            const progress = cinemaTimer / sceneInfo.duration;

            switch (sceneInfo.shot) {
                case 'CRANE_SWEEP': {
                    const ang = progress * 1.4;
                    const dist = r * 3.4;
                    desiredCamPos.set(
                        worldPos.x + Math.cos(ang) * dist,
                        worldPos.y + (1 - progress * 0.75) * dist * 0.9,
                        worldPos.z + Math.sin(ang) * dist
                    );
                    targetFov = 42;
                    break;
                }
                case 'ECLIPSE_RIM': {
                    const awayFromSun = worldPos.clone().normalize();
                    const sideVec = new THREE.Vector3(-awayFromSun.z, 0, awayFromSun.x);
                    const sweep = (progress - 0.5) * 1.1;
                    desiredCamPos.copy(worldPos)
                        .addScaledVector(awayFromSun, r * 3.8)
                        .addScaledVector(sideVec, Math.sin(sweep) * r * 2.8)
                        .add(new THREE.Vector3(0, r * 0.7, 0));
                    targetFov = 40;
                    break;
                }
                case 'CHASE_CAM': {
                    const toEarth = new THREE.Vector3().subVectors(earthPos, worldPos).normalize();
                    const perp = new THREE.Vector3(-toEarth.z, 0, toEarth.x);
                    desiredCamPos.copy(worldPos)
                        .addScaledVector(toEarth, -(r * 3.6 + 1.2))
                        .addScaledVector(perp, Math.sin(progress * Math.PI) * 1.4)
                        .add(new THREE.Vector3(0, 0.85, 0));
                    targetFov = 48;
                    rollAngle = Math.sin(progress * Math.PI) * 0.12;
                    break;
                }
                case 'DOLLY_ZOOM': {
                    const dist = r * (6.5 - progress * 3.2) + 1.2;
                    const ang = 0.5 + progress * 0.5;
                    desiredCamPos.set(
                        worldPos.x + Math.cos(ang) * dist,
                        worldPos.y + dist * 0.25,
                        worldPos.z + Math.sin(ang) * dist
                    );
                    targetFov = 35 + progress * 18;
                    break;
                }
                case 'LOW_FLYBY': {
                    const ang = -0.6 + progress * 1.5;
                    const dist = r * 2.7;
                    desiredCamPos.set(
                        worldPos.x + Math.cos(ang) * dist,
                        worldPos.y - r * 0.35 + progress * r * 0.6,
                        worldPos.z + Math.sin(ang) * dist
                    );
                    targetFov = 50;
                    rollAngle = -0.14;
                    break;
                }
                case 'DUTCH_TILT': {
                    const ang = progress * 1.1;
                    const dist = r * 3.3;
                    desiredCamPos.set(
                        worldPos.x + Math.cos(ang) * dist,
                        worldPos.y + r * 1.1,
                        worldPos.z + Math.sin(ang) * dist
                    );
                    rollAngle = 0.18;
                    targetFov = 44;
                    break;
                }
                case 'RING_SKIM': {
                    const ang = progress * 1.3;
                    const dist = r * 4.2;
                    desiredCamPos.set(
                        worldPos.x + Math.cos(ang) * dist,
                        worldPos.y + r * 0.45,
                        worldPos.z + Math.sin(ang) * dist
                    );
                    rollAngle = 0.1;
                    targetFov = 42;
                    break;
                }
                default: {
                    const ang = progress * 0.9;
                    const dist = r * 3.8 + 1.4;
                    desiredCamPos.set(
                        worldPos.x + Math.cos(ang) * dist,
                        worldPos.y + dist * 0.35,
                        worldPos.z + Math.sin(ang) * dist
                    );
                    break;
                }
            }
        } else {
            const viewDist = r * 3.6 + 1.4;
            desiredCamPos.set(
                worldPos.x + Math.cos(0.45) * viewDist,
                worldPos.y + viewDist * 0.32,
                worldPos.z + Math.sin(0.45) * viewDist
            );
        }

        camera.fov = THREE.MathUtils.lerp(camera.fov, targetFov, 0.05);
        camera.updateProjectionMatrix();

        const targetUp = new THREE.Vector3(Math.sin(rollAngle), Math.cos(rollAngle), 0).normalize();
        camera.up.lerp(targetUp, 0.05);

        const viewDistNow = desiredCamPos.distanceTo(worldPos);
        const rightVec = new THREE.Vector3().subVectors(desiredCamPos, worldPos).cross(new THREE.Vector3(0, 1, 0)).normalize();
        const framedTarget = worldPos.clone().addScaledVector(rightVec, isInspecting ? viewDistNow * 0.25 : 0);

        controls.target.lerp(framedTarget, 0.08);
        camera.position.lerp(desiredCamPos, 0.055);

        const distUnits = worldPos.distanceTo(earthPos);
        const millionKm = (distUnits * 3.56).toFixed(1);
        const lightSec = ((distUnits * 3.56 * 1e6) / 299792.458).toFixed(1);

        document.getElementById('telCoords').textContent = `POS: X:${worldPos.x.toFixed(1)} Y:${worldPos.y.toFixed(1)} Z:${worldPos.z.toFixed(1)}`;
        document.getElementById('telEarthDist').textContent = activeId === 'earth'
            ? 'EARTH LINK: 0.0 km (HOME BASE)'
            : `EARTH LINK: ${millionKm}M km (${lightSec}s LIGHT)`;

        if (isLaserOn && activeId !== 'earth') {
            laserLine.visible = true;
            laserLine.geometry.setFromPoints([earthPos, worldPos]);
        } else {
            laserLine.visible = false;
        }
    } else {
        camera.fov = THREE.MathUtils.lerp(camera.fov, 45, 0.05);
        camera.updateProjectionMatrix();
        camera.up.lerp(new THREE.Vector3(0, 1, 0), 0.05);
        controls.target.lerp(new THREE.Vector3(0, 0, 0), 0.06);
        laserLine.visible = false;
    }

    controls.update();
    renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();
