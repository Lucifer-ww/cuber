import Vue from "vue";
import Vuetify, {
  VApp,
  VCard,
  VTabs,
  VTab,
  VBtn,
  VTabItem,
  VIcon,
  VDialog,
  VSlider,
  Resize,
  VCardTitle,
  VFlex,
  VLayout,
  VContainer,
  VTextField,
  VBottomSheet,
  VTabsItems,
  VCardActions
} from "vuetify/lib";
import App from "./vue/App";
import "./index.css";
import cuber from "./cuber";

Vue.use(Vuetify, {
  components: {
    VApp,
    VBtn,
    VIcon,
    VDialog,
    VBottomSheet,
    VContainer,
    VLayout,
    VFlex,
    VTextField,
    VCard,
    VCardTitle,
    VCardActions,
    VTabs,
    VTab,
    VTabItem,
    VTabsItems,
    VSlider
  },
  directives: {
    Resize
  }
});
const opts = {};
const vuetify = new Vuetify(opts);
Vue.prototype.cuber = cuber;

new Vue({
  vuetify,
  el: "#app",
  render: h => h(App)
});
