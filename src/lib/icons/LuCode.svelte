<!-- Geometry extracted verbatim from react-icons (lu/LuCode). -->
<script lang="ts">
  let {
    class: klass = "",
    size = "1em",
    ...rest
  }: {
    class?: string;
    size?: string | number;
    [k: string]: unknown;
  } = $props();
</script>

<svg
  xmlns="http://www.w3.org/2000/svg"
  stroke="currentColor"
  fill="none"
  stroke-width="2"
  viewBox="0 0 24 24"
  stroke-linecap="round"
  stroke-linejoin="round"
  width={size}
  height={size}
  class={klass}
  {...rest}
  ><polyline points="16 18 22 12 16 6" /><polyline
    points="8 6 2 12 8 18"
  /></svg
>
