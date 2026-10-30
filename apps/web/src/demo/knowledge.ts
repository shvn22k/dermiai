/**
 * DEMO BRANCH ONLY. A tiny stand-in for the RAG index. The real system retrieves chunks from the
 * dermatology corpus; these short notes were written for the showcase (no copyrighted text).
 */
import type { Source } from "@/demo/types";

type Note = { id: string; title: string; tags: string[]; text: string };

export const NOTES: Note[] = [
  {
    id: "contact-dermatitis",
    title: "Contact dermatitis basics",
    tags: ["contact", "dermatitis", "rash", "itchy", "lotion", "soap", "allergic", "irritant", "red"],
    text: "Contact dermatitis is a red, itchy rash where something touched the skin. Allergic types appear a day or two after contact; irritant types come from repeated exposure to soaps or chemicals. Avoiding the trigger usually lets it settle within 2–4 weeks.",
  },
  {
    id: "fragrance",
    title: "Fragrance allergy",
    tags: ["fragrance", "parfum", "perfume", "linalool", "limonene", "allergy", "lotion"],
    text: "Fragrance is one of the most common causes of allergic contact dermatitis. Labels may list it as parfum or fragrance, plus allergens such as linalool and limonene. 'Unscented' can still contain masking fragrance; 'fragrance-free' is the safer choice.",
  },
  {
    id: "mi",
    title: "Methylisothiazolinone (MI)",
    tags: ["methylisothiazolinone", "preservative", "allergy", "lotion", "wipes"],
    text: "Methylisothiazolinone is a preservative that became a frequent contact allergen, especially in leave-on products. People who react to it are usually advised to avoid it entirely.",
  },
  {
    id: "acne",
    title: "Acne: what helps",
    tags: ["acne", "pimple", "breakout", "hormonal", "jaw", "chin", "blackhead", "oily", "spots"],
    text: "Acne forms when pores clog with oil and dead skin and become inflamed. Gentle twice-daily cleansing, non-comedogenic products and not picking all help. Over-the-counter benzoyl peroxide or adapalene work for many people; results take 8–12 weeks.",
  },
  {
    id: "eczema",
    title: "Eczema and emollients",
    tags: ["eczema", "dry", "flaky", "itchy", "atopic", "emollient", "moisturiser", "shower"],
    text: "Eczema-prone skin loses water easily. Thick, fragrance-free emollients applied twice a day — especially right after bathing — are the foundation of care. Short lukewarm showers and soft fabrics reduce flares.",
  },
  {
    id: "abcde",
    title: "Checking moles: ABCDE",
    tags: ["mole", "spot", "melanoma", "abcde", "dark", "changing", "pigment"],
    text: "Use ABCDE to check moles: Asymmetry, irregular Border, more than one Colour, Diameter over 6 mm, and Evolving (changing). Any mole that changes, bleeds or looks different from your others should be seen by a dermatologist.",
  },
  {
    id: "sunscreen",
    title: "Sunscreen basics",
    tags: ["sunscreen", "spf", "sun", "outdoors", "pigmentation", "mole", "dark"],
    text: "Use a broad-spectrum SPF 30–50 every morning and reapply about every two hours outdoors. Sunscreen also helps dark marks fade and protects moles.",
  },
  {
    id: "infection",
    title: "When a rash needs a doctor",
    tags: ["fever", "spreading", "hot", "warm", "infection", "cellulitis", "pus", "doctor"],
    text: "A rash that spreads quickly, feels hot or swollen, or comes with fever can be a skin infection that needs prompt treatment. Swelling of the face or lips or trouble breathing needs emergency care.",
  },
  {
    id: "patch-test",
    title: "Patch testing",
    tags: ["patch", "test", "allergy", "allergic", "product", "new"],
    text: "Before using a new product, apply a little to the inner arm for a few days. A dermatologist can also do formal patch testing to find out exactly which ingredients you react to.",
  },
  {
    id: "itch",
    title: "Easing itch",
    tags: ["itch", "itchy", "scratch", "night", "sleep", "compress"],
    text: "Cool compresses, keeping nails short and moisturising regularly ease itch. Itch is often worse at night; cotton gloves or a pharmacist-recommended antihistamine can help some people sleep.",
  },
];

function tokens(text: string): string[] {
  return text.toLowerCase().match(/[a-z]+/g) ?? [];
}

/** Keyword retrieval: tag hits count double. Returns the top k with their scores. */
export function retrieve(query: string, k = 2): Source[] {
  const q = new Set(tokens(query).filter((t) => t.length > 2));
  return NOTES.map((n) => {
    const tagHits = n.tags.filter((t) => [...q].some((w) => w.startsWith(t) || t.startsWith(w)));
    const textHits = tokens(n.text).filter((t) => q.has(t)).length;
    return { note: n, score: tagHits.length * 2 + Math.min(textHits, 4) };
  })
    .filter((r) => r.score >= 2)
    .sort((a, b) => b.score - a.score)
    .slice(0, k)
    .map(({ note, score }) => ({ id: note.id, title: note.title, snippet: note.text, score }));
}
