import { catalog } from "@/lib/catalog/repository";
import { categoryImage } from "@/lib/catalog/imagery";
import { routes } from "@/lib/routes";
import { getHome, type Tegel } from "@/lib/inhoud/home";
import { CategoryTile } from "@/components/catalog/category-tile";

/**
 * "Welkom in onze afdelingen": één grote tegel per zichtbare hoofdcategorie (enkel die
 * met producten) + kleine tegels naar diensten en lijsten (homepage en lege winkelmand).
 * De kleine tegels komen uit "Pagina | Home" in Shopify; de homepage geeft ze mee.
 */
export async function DepartmentTiles({ small }: { small?: Tegel[] } = {}) {
  const tree = await catalog.getTree();
  const large = await Promise.all(tree.roots.filter((r) => !r.hidden).map(async (node) => ({ href: routes.category(node), title: node.name, image: await categoryImage(node) })));
  const tegels = small ?? (await getHome()).afdelingen.tegels;
  const largeCols = large.length >= 4 ? "lg:grid-cols-4" : large.length === 3 ? "lg:grid-cols-3" : "lg:grid-cols-2";

  return (
    <>
      <div className={`grid grid-cols-1 gap-1 sm:grid-cols-2 ${largeCols}`}>
        {large.map((t, i) => (
          <CategoryTile key={t.href} {...t} tone={i} sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw" className="aspect-[4/3] sm:aspect-[4/5] lg:aspect-[333/416]" />
        ))}
      </div>
      {tegels.length > 0 && (
        <div className="mt-1 grid grid-cols-2 gap-1 md:grid-cols-4">
          {tegels.map((t, i) => (
            <CategoryTile key={t.href + t.title} href={t.href} title={t.title} image={t.image} tone={i + 1} size="sm" className="aspect-[4/5] md:aspect-[4/3]" />
          ))}
        </div>
      )}
    </>
  );
}
