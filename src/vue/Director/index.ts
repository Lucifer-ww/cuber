import Vue from "vue";
import { Component, Provide, Watch } from "vue-property-decorator";
import Cuber from "../../cuber/cuber";
import Option from "../../common/option";
import { COLORS, FACE, download } from "../../common/define";
import Cubelet from "../../cuber/cubelet";
import GIF from "../../common/gif";
import Base64 from "../../common/base64";
import * as THREE from "three";
import { TwistAction, TwistNode } from "../../cuber/twister";
import Tune from "../Tune";

@Component({
  template: require("./index.html"),
  components: {
    tune: Tune
  }
})
export default class Director extends Vue {
  @Provide("cuber")
  cuber: Cuber;

  @Provide("option")
  option: Option;

  menu: boolean = false;
  tune: boolean = false;
  quality: boolean = false;
  width: number = 0;
  height: number = 0;
  size: number = 0;
  snaper: THREE.WebGLRenderer;
  filmer: THREE.WebGLRenderer;
  gif: GIF;
  pixel: number = 512;
  @Watch("pixel")
  onPixelChange() {
    window.localStorage.setItem("director.pixel", String(this.pixel));
  }
  delay: number = 2;
  @Watch("delay")
  onDelayChange() {
    window.localStorage.setItem("director.delay", String(this.delay));
  }

  set duration(value: number) {
    this.cuber.cube.duration = value;
    window.localStorage.setItem("director.duration", String(value));
  }

  get duration() {
    return this.cuber.cube.duration;
  }

  constructor() {
    super();
    let canvas = document.createElement("canvas");
    this.cuber = new Cuber(canvas);
    this.option = new Option(this.cuber);
    this.cuber.cube.twister.callbacks.push(() => {
      this.callback();
    });
    this.snaper = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true, alpha: true });
    this.snaper.setPixelRatio(1);
    this.snaper.setClearColor(COLORS.BACKGROUND, 0);
    this.filmer = new THREE.WebGLRenderer({ preserveDrawingBuffer: true, alpha: true });
    this.filmer.setPixelRatio(1);
    this.filmer.setClearColor(COLORS.BACKGROUND, 1);
  }

  resize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.size = Math.min(this.width / 8, this.height / 14);
    this.cuber.width = this.width;
    this.cuber.height = this.height - 210;
    this.cuber.resize();
    let cuber = this.$refs.cuber;
    if (cuber instanceof HTMLElement) {
      cuber.style.width = this.width + "px";
      cuber.style.height = this.height - 210 + "px";
    }
  }

  mounted() {
    let save = window.localStorage.getItem("director.action");
    this.action = save != null ? save : "RUR'U'-";
    save = window.localStorage.getItem("director.scene");
    this.scene = save != null ? save : "^";
    let search = window.location.search.toString().substr(1);
    if (search.length > 0) {
      try {
        let string = Base64.decode(search);
        let init = JSON.parse(string);
        this.scene = init.scene || "";
        this.action = init.action || "";
        this.stickers = init.stickers || [];
        history.replaceState({}, "Cuber", window.location.origin + window.location.pathname);
      } catch (error) {
        console.log(error);
      }
    }

    this.delay = Number(window.localStorage.getItem("director.delay") || 2);
    this.pixel = Number(window.localStorage.getItem("director.pixel") || 512);
    this.duration = Number(window.localStorage.getItem("director.duration") || 30);

    if (this.$refs.cuber instanceof Element) {
      let cuber = this.$refs.cuber;
      cuber.appendChild(this.cuber.canvas);
      this.$nextTick(this.resize);
    }
    this.cuber.controller.taps.push(this.tap);
    for (const face of [FACE.L, FACE.R, FACE.D, FACE.U, FACE.B, FACE.F]) {
      let stickers = this.stickers[FACE[face]];
      if (!stickers) {
        continue;
      }
      for (let index = 0; index < 9; index++) {
        let sticker = stickers[index];
        if (sticker) {
          this.cuber.cube.stick(face, index + 1, this.colors[sticker]);
        } else {
          this.cuber.cube.stick(face, index + 1, "");
        }
      }
    }
    this.init();
    this.loop();
  }

  init() {
    this.progress = 0;
    this.cuber.controller.disable = false;
    this.cuber.cube.twister.finish();
    this.cuber.cube.twister.twist("#");
    let scene = this.scene == "^" ? "(" + this.action + ")'" : this.scene;
    this.cuber.cube.twister.twist(scene, false, 1, true);
  }

  scene: string = "";
  @Watch("scene")
  onSceneChange() {
    window.localStorage.setItem("director.scene", this.scene);
    this.init();
  }

  progress: number = 0;
  @Watch("progress")
  onProgressChange() {
    this.cuber.controller.lock = this.progress > 0;
  }
  actions: TwistAction[] = [];
  action: string = "";
  @Watch("action")
  onActionChange() {
    window.localStorage.setItem("director.action", this.action);
    this.actions = new TwistNode(this.action).parse();
    this.init();
  }

  stickers: { [face: string]: number[] | undefined } = (() => {
    let save = window.localStorage.getItem("director.stickers");
    if (save) {
      try {
        let data = JSON.parse(save);
        let stickers: { [face: string]: number[] | undefined } = {};
        for (let face = 0; face < 6; face++) {
          stickers[FACE[face]] = data[FACE[face]];
        }
        return stickers;
      } catch (error) {
        console.log(error);
      }
    }
    return {};
  })();

  callback() {
    if (this.recording) {
      if (this.progress == this.actions.length) {
        this.finish();
        return;
      }
      let action = this.actions[this.progress];
      this.progress++;
      this.cuber.cube.twister.twist(action.exp, action.reverse, action.times, false);
    }
  }

  forward() {
    if (this.progress == this.actions.length) {
      return;
    }
    if (this.progress == 0) {
      this.init();
    }
    let action = this.actions[this.progress];
    this.progress++;
    this.cuber.cube.twister.twist(action.exp, action.reverse, action.times);
  }

  backward() {
    if (this.progress == 0) {
      return;
    }
    this.progress--;
    let action = this.actions[this.progress];
    this.cuber.cube.twister.twist(action.exp, !action.reverse, action.times);
  }

  recording: boolean = false;
  loop() {
    requestAnimationFrame(this.loop.bind(this));
    if (this.recording) {
      this.record();
    }
    this.cuber.render();
  }

  record() {
    this.cuber.camera.aspect = 1;
    this.cuber.camera.updateProjectionMatrix();
    this.filmer.clear();
    this.filmer.render(this.cuber.scene, this.cuber.camera);
    let content = this.filmer.getContext();
    let size = this.pixel;
    let pixels = new Uint8Array(size * size * 4);
    content.readPixels(0, 0, size, size, content.RGBA, content.UNSIGNED_BYTE, pixels);
    this.gif.add(pixels);
    this.cuber.resize();
  }

  finish() {
    this.recording = false;
    this.cuber.controller.disable = false;
    this.cuber.resize();
    this.gif.finish();
    this.init();
    let data = this.gif.out.getData();
    let blob = new Blob([data], { type: "image/gif" });
    download("cuber.gif", blob);
  }

  film() {
    if (this.recording) {
      this.recording = false;
      this.cuber.controller.disable = false;
      this.cuber.resize();
      this.gif.finish();
      this.init();
      return;
    }
    this.init();
    this.recording = true;
    this.cuber.controller.disable = true;
    let size = this.pixel;
    this.gif = new GIF(size, size, this.delay);
    this.filmer.setSize(size, size, true);
    this.gif.start();
    this.record();
    this.callback();
  }

  snap() {
    this.cuber.camera.aspect = 1;
    this.cuber.camera.updateProjectionMatrix();
    let size = this.pixel;
    this.snaper.setSize(size, size, true);
    this.snaper.clear();
    this.snaper.render(this.cuber.scene, this.cuber.camera);
    this.cuber.resize();
    let content = this.snaper.domElement.toDataURL("image/png");
    let parts = content.split(";base64,");
    let type = parts[0].split(":")[1];
    let raw = window.atob(parts[1]);
    let length = raw.length;
    let data = new Uint8Array(length);
    for (let i = 0; i < length; ++i) {
      data[i] = raw.charCodeAt(i);
    }
    let blob = new Blob([data], { type: type });
    download("cuber.png", blob);
  }

  colors = [
    COLORS.YELLOW,
    COLORS.WHITE,
    COLORS.BLUE,
    COLORS.GREEN,
    COLORS.RED,
    COLORS.ORANGE,
    COLORS.BLACK,
    COLORS.GRAY,
    COLORS.CYAN,
    COLORS.LIME,
    COLORS.PURPLE
  ];
  color = 7;
  colord = false;

  tap(index: number, face: number) {
    if (index < 0) {
      return;
    }
    let cubelet: Cubelet = this.cuber.cube.cubelets[index];
    face = cubelet.getColor(face);
    index = this.cuber.cube.groups[FACE[face]].indices.indexOf(cubelet.initial);
    let arr = this.stickers[FACE[face]];
    if (arr == undefined) {
      arr = [];
      this.stickers[FACE[face]] = arr;
    }
    if (arr[index] != this.color) {
      arr[index] = this.color;
      this.cuber.cube.stick(face, index + 1, this.colors[this.color]);
    } else {
      arr[index] = -1;
      this.cuber.cube.stick(face, index + 1, "");
    }
    window.localStorage.setItem("director.stickers", JSON.stringify(this.stickers));
  }

  clear() {
    this.colord = false;
    this.stickers = {};
    window.localStorage.setItem("director.stickers", JSON.stringify(this.stickers));
    this.cuber.cube.strip({});
  }
}
