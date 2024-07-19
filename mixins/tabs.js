export default {
  methods: {
    tabAttrsFormatter(options) {
      let { attrs = {}, showLableInfo = "" } = options;
      showLableInfo = showLableInfo.split(",");
      return {
        attrs,
        showLableInfo
      };
    }
  }
};
