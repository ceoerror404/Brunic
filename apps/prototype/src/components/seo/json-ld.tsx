/** JSON-escape voor `<` (backslash + "u003c"), opgebouwd met charCode 92 zodat er geen escape in de bron staat. */
const LT = `${String.fromCharCode(92)}u003c`;

/** Schrijft structured data in de pagina (schema.org). `<` wordt ge-escaped tegen </script>-injectie via producttitels. */
export function JsonLd({ data }: { data: object }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replaceAll("<", LT) }} />;
}
