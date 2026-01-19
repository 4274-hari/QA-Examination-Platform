export const formatMathText = (text = "") => {
  return text
    // superscripts
    .replace(/\^2/g, "²")
    .replace(/\^3/g, "³")

    // units
    .replace(/CM\^2/g, "cm²")
    .replace(/CM\^3/g, "cm³")

    // line breaks
    .split("\n")
    .map((line, i) => <div key={i}>{line}</div>);
};