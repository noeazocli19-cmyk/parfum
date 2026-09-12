#!/bin/bash
# Génération des visuels E.T.P.S BELLE ODEUR (images temporaires, remplaçables via dashboard)
cd /home/z/my-project
mkdir -p public/images/produits

gen() {
  local prompt="$1"; local out="$2"; local size="$3"
  if [ -f "$out" ]; then echo "SKIP $out"; return; fi
  for i in 1 2 3; do
    echo ">>> $out (tentative $i)"
    z-ai image -p "$prompt" -o "$out" -s "$size" && [ -s "$out" ] && echo "OK $out" && return
    sleep 2
  done
  echo "FAIL $out"
}

gen "Luxury perfume editorial photography, elegant tall glass perfume bottle with gold cap standing on dark emerald green silk fabric, soft golden light rays, deep forest green background, subtle cream orchid flowers, high-end fragrance advertisement, minimalist premium composition, no text, no letters" "public/images/hero.jpg" "864x1152"

gen "Masculine luxury perfume bottle, dark smoked glass flacon with matte black and brushed gold cap, standing on dark stone, deep green leaves shadows on forest green background, moody premium product photography, cinematic lighting, no text, no letters" "public/images/categorie-homme.jpg" "864x1152"

gen "Feminine luxury perfume bottle, blush pink glass flacon with golden cap and delicate details, cream silk fabric background with soft golden bokeh, elegant premium product photography, soft studio light, no text, no letters" "public/images/categorie-femme.jpg" "864x1152"

gen "Unisex luxury perfume bottle, clear glass flacon filled with deep green liquid, gold cap, on beige stone pedestal, cream background, minimalist premium product photography, soft natural light, no text, no letters" "public/images/categorie-mixte.jpg" "864x1152"

gen "Luxury masculine perfume bottle, amber glass flacon with dark wooden cap, on dark emerald green silk, dramatic golden side light, premium product photography, deep green background, no text, no letters" "public/images/produits/homme-01.jpg" "1024x1024"

gen "Tall matte black luxury perfume bottle with gold band detail, dark green marble surface, cedar wood pieces, forest green background, premium moody product photography, no text, no letters" "public/images/produits/homme-02.jpg" "1024x1024"

gen "Dark green glass perfume bottle with antique gold cap, surrounded by fresh vetiver grass and green leaves, stone surface, natural premium product photography, deep green tones, no text, no letters" "public/images/produits/homme-03.jpg" "1024x1024"

gen "Elegant rose gold perfume bottle with crystal cap, fresh rose petals on ivory silk, soft golden light, luxury feminine product photography, cream and gold tones, no text, no letters" "public/images/produits/femme-01.jpg" "1024x1024"

gen "White frosted glass perfume bottle with gold cap, white jasmine flowers scattered on champagne silk fabric, soft dreamy light, luxury product photography, warm ivory tones, no text, no letters" "public/images/produits/femme-02.jpg" "1024x1024"

gen "Blush pink rounded perfume bottle with pearl cap, peony flowers on pale gold satin, luxury feminine product photography, soft cream background, no text, no letters" "public/images/produits/femme-03.jpg" "1024x1024"

gen "Clear glass luxury perfume bottle with pale orange liquid and gold cap, orange blossom flowers on white stone, minimalist premium product photography, bright cream background, no text, no letters" "public/images/produits/mixte-01.jpg" "1024x1024"

gen "Interior of an elegant luxury perfume boutique, dark green walls with gold accents, wooden shelves displaying rows of perfume bottles, warm golden lighting, marble counter, sophisticated atmosphere, editorial interior photography, no text, no letters" "public/images/a-propos.jpg" "1344x768"

gen "Minimalist luxury logo emblem for a perfume house, thin gold line art of an elegant perfume flacon bottle with a laurel branch, centered on plain white background, flat vector style, refined golden lines only, no text, no letters" "public/images/logo-embleme.png" "1024x1024"

gen "Minimalist luxury logo emblem for a perfume house, thin golden line art of an elegant perfume flacon bottle with laurel branch, centered on solid deep emerald green background, flat vector style, refined gold lines, no text, no letters" "public/images/logo-embleme-fonce.png" "1024x1024"

echo "=== TERMINÉ ==="
ls -la public/images public/images/produits
