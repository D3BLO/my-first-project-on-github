import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

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
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            this.destNode = this.ctx.createMediaStreamDestination();
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
        // تآلفات أوركسترالية فضائية حماسية (Hans Zimmer / Interstellar Vibe)
        const chords = [
            [110.00, 164.81, 220.00, 261.63], // Am
            [87.31, 130.81, 174.61, 220.00],  // Fmaj7
            [130.81, 196.00, 261.63, 329.63], // C
            [98.00, 146.83, 196.00, 246.94]   // G
        ];
        const playPulse = () => {
            if (!this.musicPlaying || !this.enabled) return;
            const now = this.ctx.currentTime;
            const chord = chords[Math.floor(this.step / 8) % chords.length];

            // نبضة البيس العميقة (Deep Sub-Bass Pulse)
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

            // نغمة الأوركسترا الصاعدة (Arpeggio & Pad)
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
// 2. إعداد المشهد والكاميرا والريندر 60 FPS
// ==========================================
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x010206, 0.00065);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.05, 3500);
camera.position.set(0, 110, 205);

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance", preserveDrawingBuffer: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.18;
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.maxDistance = 750;
controls.minDistance = 0.7;

// ==========================================
// 3. مسجل الفيديو المباشر (Canvas + Audio Recorder)
// ==========================================
let mediaRecorder = null;
let recordedChunks = [];
let isRecording = false;
const btnRecord = document.getElementById('btnRecord');

function toggleRecording() {
    if (!isRecording) {
        audio.init();
        const canvasStream = renderer.domElement.captureStream(60);
        const tracks = [...canvasStream.getVideoTracks()];
        if (audio.destNode) {
            tracks.push(...audio.destNode.stream.getAudioTracks());
        }
        const combinedStream = new MediaStream(tracks);
        recordedChunks = [];

        const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
            ? 'video/webm;codecs=vp9'
            : 'video/webm';

        mediaRecorder = new MediaRecorder(combinedStream, { mimeType, videoBitsPerSecond: 8000000 });
        mediaRecorder.ondataavailable = e => { if (e.data.size > 0) recordedChunks.push(e.data); };
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
// 4. مولد الخامات عالية الدقة + أضواء المدن الليلية
// ==========================================
function buildTexture(mode, c1, c2, c3) {
    const canvas = document.createElement('canvas');
    canvas.width = 1024; canvas.height = 512;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = c1;
    ctx.fillRect(0, 0, 1024, 512);

    if (mode === 'gas') {
        for (let y = 0; y < 512; y += 3) {
            const wave = Math.sin(y * 0.08) * 0.5 + 0.5;
            ctx.fillStyle = wave > 0.5 ? c2 : c3;
            ctx.globalAlpha = 0.25 + Math.random() * 0.25;
            ctx.fillRect(0, y, 1024, 2 + Math.random() * 4);
        }
        for (let i = 0; i < 16; i++) {
            ctx.fillStyle = c3;
            ctx.globalAlpha = 0.35;
            ctx.beginPath();
            ctx.ellipse(Math.random() * 1024, Math.random() * 512, 18 + Math.random() * 25, 7 + Math.random() * 10, 0, 0, Math.PI * 2);
            ctx.fill();
        }
    } else if (mode === 'earth') {
        ctx.fillStyle = '#15803d';
        ctx.globalAlpha = 0.92;
        for (let i = 0; i < 65; i++) {
            ctx.beginPath();
            ctx.arc(Math.random() * 1024, 60 + Math.random() * 390, 18 + Math.random() * 45, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.fillStyle = '#a16207';
        ctx.globalAlpha = 0.45;
        for (let i = 0; i < 38; i++) {
            ctx.beginPath();
            ctx.arc(Math.random() * 1024, 100 + Math.random() * 310, 10 + Math.random() * 25, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.fillStyle = '#f8fafc';
        ctx.globalAlpha = 0.95;
        ctx.fillRect(0, 0, 1024, 24);
        ctx.fillRect(0, 488, 1024, 24);
    } else if (mode === 'night') {
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, 1024, 512);
        for (let c = 0; c < 45; c++) {
            const cx = Math.random() * 1024;
            const cy = 80 + Math.random() * 350;
            for (let p = 0; p < 35; p++) {
                ctx.fillStyle = Math.random() > 0.3 ? '#fbbf24' : '#fef08a';
                ctx.globalAlpha = 0.4 + Math.random() * 0.6;
                ctx.fillRect(cx + (Math.random() - 0.5) * 45, cy + (Math.random() - 0.5) * 28, 1.8, 1.8);
            }
        }
    } else if (mode === 'clouds') {
        ctx.clearRect(0, 0, 1024, 512);
        ctx.fillStyle = '#ffffff';
        for (let i = 0; i < 140; i++) {
            ctx.globalAlpha = 0.14 + Math.random() * 0.22;
            ctx.beginPath();
            ctx.ellipse(Math.random() * 1024, Math.random() * 512, 35 + Math.random() * 80, 6 + Math.random() * 12, 0.1, 0, Math.PI * 2);
            ctx.fill();
        }
    } else if (mode === 'mars') {
        for (let i = 0; i < 220; i++) {
            ctx.fillStyle = i % 2 === 0 ? c2 : c3;
            ctx.globalAlpha = 0.22;
            ctx.beginPath();
            ctx.arc(Math.random() * 1024, Math.random() * 512, 4 + Math.random() * 26, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.fillStyle = '#f1f5f9';
        ctx.globalAlpha = 0.9;
        ctx.fillRect(0, 0, 1024, 22);
        ctx.fillRect(0, 490, 1024, 22);
    } else {
        for (let i = 0; i < 300; i++) {
            ctx.fillStyle = i % 2 === 0 ? c2 : c3;
            ctx.globalAlpha = 0.2;
            ctx.beginPath();
            ctx.arc(Math.random() * 1024, Math.random() * 512, 3 + Math.random() * 18, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.anisotropy = 4;
    return tex;
}

// ==========================================
// 5. البيئة الفضائية والسدم والمجرة الخلفية
// ==========================================
const polarGrid = new THREE.PolarGridHelper(290, 24, 18, 64, 0x0ea5e9, 0x0f172a);
polarGrid.position.y = -4;
scene.add(polarGrid);

const nebulaGeo = new THREE.SphereGeometry(1400, 32, 32);
const nebulaMat = new THREE.MeshBasicMaterial({
    map: buildTexture('gas', '#02040c', '#0f172a', '#1e1b4b'),
    side: THREE.BackSide,
    transparent: true,
    opacity: 0.55
});
scene.add(new THREE.Mesh(nebulaGeo, nebulaMat));

const starGeo = new THREE.BufferGeometry();
const starCount = 7500;
const starPos = new Float32Array(starCount * 3);
const starCol = new Float32Array(starCount * 3);
for (let i = 0; i < starCount; i++) {
    starPos[i * 3] = (Math.random() - 0.5) * 2200;
    starPos[i * 3 + 1] = (Math.random() - 0.5) * 2200;
    starPos[i * 3 + 2] = (Math.random() - 0.5) * 2200;
    const c = new THREE.Color().setHSL(0.55 + Math.random() * 0.18, 0.65, 0.75 + Math.random() * 0.25);
    starCol[i * 3] = c.r; starCol[i * 3 + 1] = c.g; starCol[i * 3 + 2] = c.b;
}
starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
starGeo.setAttribute('color', new THREE.BufferAttribute(starCol, 3));
scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({ size: 1.2, vertexColors: true })));

scene.add(new THREE.AmbientLight(0x1e293b, 1.1));
const sunLight = new THREE.PointLight(0xfffbeb, 4.8, 1100, 0.32);
scene.add(sunLight);

// ==========================================
// 6. بناء الأجسام الفضائية والتلسكوبات والطبقات الداخلية
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
    new THREE.SphereGeometry(11, 64, 64),
    new THREE.MeshBasicMaterial({ map: buildTexture('gas', '#f59e0b', '#fef08a', '#ea580c') })
);
const sunGlow = new THREE.Mesh(
    new THREE.SphereGeometry(12.4, 32, 32),
    new THREE.MeshBasicMaterial({ color: 0xfb923c, transparent: true, opacity: 0.22, side: THREE.BackSide })
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
            new THREE.SphereGeometry(l.r, 32, 32, 0, Math.PI * 1.5),
            new THREE.MeshStandardMaterial({ color: l.color, roughness: 0.4, side: THREE.DoubleSide })
        );
        group.add(sphere);
    });
    const planeMat = new THREE.MeshBasicMaterial({ color: 0xf97316, side: THREE.DoubleSide });
    const cut1 = new THREE.Mesh(new THREE.CircleGeometry(radius * 0.96, 32), planeMat);
    cut1.rotation.y = Math.PI / 2;
    const cut2 = new THREE.Mesh(new THREE.CircleGeometry(radius * 0.96, 32), planeMat);
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
            { label: 'طول السنة', val: '84 Years' }, { label: 'ميل المحور'
