// src/lib/navigation.ts
export interface NavColumn {
  heading: string;
  links: string[];
}

export interface NavCategory {
  id: string;
  name: string;
  promoImageUrl: string;
  columns: NavColumn[];
}

/**
 * Mapping of the existing top‑level navigation tabs to stable IDs.
 * Each category now includes the exact submenu items extracted from the Vico screenshots.
 */
export const NAV_MENU: Record<string, NavCategory> = {
  dispensa: {
    id: "dispensa",
    name: "Dispensa",
    promoImageUrl: "/vico_newsletter_box.png",
    columns: [
      {
        heading: "Dispensa Base",
        links: [
          "Pasta",
          "Rice",
          "Flours and Preparations",
          "Sauces, Condiments and Preserves",
          "Oil, Vinegar and Salt"
        ]
      },
      {
        heading: "Colazione e Dolci",
        links: [
          "Biscuits and Sweet Snacks",
          "Chocolate and Candies",
          "Creams and Jams",
          "Coffee, Instant Drinks and Sugar",
          "Infusions, Teas and Herbal Teas"
        ]
      },
      {
        heading: "Altro",
        links: [
          "Savoury Snacks",
          "Childhood and Childhood",
          "Fruit and Vegetables",
          "Gluten Free",
          "Lactose Free",
          "Organic Products",
          "Whole Wheat",
          "Certifications",
          "Typical Italian Products"
        ]
      }
    ]
  },
  "latticini-salumi": {
    id: "latticini-salumi",
    name: "Formaggi & Salumi",
    promoImageUrl: "/vico_newsletter_box.png",
    columns: [
        {
          heading: "Formaggi Freschi",
          links: ["Mozzarella", "Burrata"]
        },
        {
          heading: "Formaggi Stagionati",
          links: ["Formaggi Stagionati", "Mortadella"]
        },
        {
          heading: "Salumi",
          links: ["Prosciutto", "Salame"]
        }
      ]
  },
  panetteria: {
    id: "panetteria",
    name: "Panetteria",
    promoImageUrl: "/vico_newsletter_box.png",
    columns: [
    {
      heading: "Pane",
      links: ["Pane Fresco", "Pane Integrale", "Pane Senza Glutine", "Focaccia", "Ciabatta"]
    },
    {
      heading: "Prodotti da Forno",
      links: ["Grissini", "Taralli", "Crackers", "Crostini", "Piadine"]
    },
    {
      heading: "Dolci da Forno",
      links: ["Cornetti", "Brioche", "Biscotti Artigianali", "Torte", "Snack Dolci"]
    }
  ]
  },
  enoteca: {
    id: "enoteca",
    name: "Enoteca",
    promoImageUrl: "/vico_newsletter_box.png",
    columns: [
    {
      heading: "Vini Rossi",
      links: ["Chianti", "Barolo", "Nero d'Avola", "Montepulciano", "Amarone"]
    },
    {
      heading: "Vini Bianchi & Spumanti",
      links: ["Pinot Grigio", "Vermentino", "Prosecco", "Franciacorta", "Moscato"]
    },
    {
      heading: "Birre & Liquori",
      links: ["Birre Artigianali", "Birre Italiane", "Amari", "Limoncello", "Grappa"]
    }
  ]
  },
  "frutta-verdura": {
    id: "frutta-verdura",
    name: "Frutta & Verdura",
    promoImageUrl: "/vico_newsletter_box.png",
    columns: [
    {
      heading: "Frutta Fresca",
      links: ["Mele", "Pere", "Banane", "Arance", "Uva"]
    },
    {
      heading: "Verdura Fresca",
      links: ["Pomodori", "Zucchine", "Melanzane", "Patate", "Cipolle"]
    },
    {
      heading: "Specialità",
      links: ["Agrumi", "Insalate", "Erbe Aromatiche", "Verdure Biologiche", "Frutta Secca"]
    }
  ]
  },
  "casa-persona": {
    id: "casa-persona",
    name: "Casa & Persona",
    promoImageUrl: "/vico_newsletter_box.png",
    columns: [
      {
        heading: "Home Care",
        links: [
          "Laundry",
          "Floors and Surfaces",
          "Home and Cleaning Accessories",
          "Bathroom Hygiene",
          "Air Freshener",
          "Kitchen and Dishes",
          "Playroom"
        ]
      },
      {
        heading: "Body Care",
        links: [
          "Shower Gel and Body Cream",
          "Intimate Hygiene",
          "Shampoo, Conditioner and Masks",
          "Oral Hygiene",
          "Deodorants",
          "Sanitary Napkins and Wipes",
          "Shaving and Hair Removal",
          "Perfumery",
          "Mosquito Repellent and After-Bite"
        ]
      }
    ]
  }
};
