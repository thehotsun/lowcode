export default {
  methods: {
    tabAttrsFormatter(options) {
      const { attrs = {}, showLableInfo = [] } = options;
      return {
        attrs,
        showLableInfo
      };
    }
  }
};
