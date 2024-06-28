<template>
  <TableWidget ref="TableWidget"></TableWidget>
</template>

<script>
import TableWidget from "../components/table-widget";

export default {
  components: { TableWidget },
  methods: {
    async init(id = "", formCode) {
      this.$refs.TableWidget.init(id, formCode);
    }
  }
};
</script>
