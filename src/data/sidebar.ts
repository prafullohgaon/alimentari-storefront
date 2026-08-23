// src/data/sidebar.ts
import { SidebarData } from "../types/sidebar";

export const sidebarData: SidebarData = {
  sidebar: {
    title: "Categories",
    departments: [
      {
        id: "alimentari",
        name: "Alimentari",
        handle: "alimentari",
        level: 0,
        count: 142,
        children: [
          {
            id: "pasta",
            name: "Pasta",
            handle: "pasta",
            level: 1,
            count: 35,
            children: [
              { id: "pasta-corta", name: "Pasta Corta", handle: "pasta-corta", level: 2, count: 12, children: [] },
              { id: "pasta-lunga", name: "Pasta Lunga", handle: "pasta-lunga", level: 2, count: 15, children: [] },
              { id: "pasta-all-uovo", name: "Pasta all'Uovo", handle: "pasta-all-uovo", level: 2, count: 8, children: [] }
            ]
          },
          {
            id: "biscotti-e-snack-dolci",
            name: "Biscotti e Snack Dolci",
            handle: "biscotti-e-snack-dolci",
            level: 1,
            count: 24,
            children: [
              { id: "biscotti", name: "Biscotti", handle: "biscotti", level: 2, count: 14, children: [] },
              { id: "merendine", name: "Merendine", handle: "merendine", level: 2, count: 10, children: [] }
            ]
          },
          {
            id: "sughi-condimenti-e-conserve",
            name: "Sughi, Condimenti e Conserve",
            handle: "sughi-condimenti-e-conserve",
            level: 1,
            count: 18,
            children: [
              { id: "passata-di-pomodoro", name: "Passata di Pomodoro", handle: "passata-di-pomodoro", level: 2, count: 8, children: [] },
              { id: "pesto-e-sughi-pronti", name: "Pesto e Sughi Pronti", handle: "pesto-e-sughi-pronti", level: 2, count: 10, children: [] }
            ]
          },
          {
            id: "infusi-te-e-tisane",
            name: "Infusi, Tè e Tisane",
            handle: "infusi-te-e-tisane",
            level: 1,
            count: 12,
            children: []
          },
          {
            id: "snack-salati",
            name: "Snack Salati",
            handle: "snack-salati",
            level: 1,
            count: 15,
            children: [
              { id: "taralli-e-grissini", name: "Taralli e Grissini", handle: "taralli-e-grissini", level: 2, count: 9, children: [] },
              { id: "patatine", name: "Patatine", handle: "patatine", level: 2, count: 6, children: [] }
            ]
          },
          {
            id: "farine-e-preparati",
            name: "Farine e Preparati",
            handle: "farine-e-preparati",
            level: 1,
            count: 10,
            children: []
          },
          {
            id: "cioccolato-e-caramelle",
            name: "Cioccolato e Caramelle",
            handle: "cioccolato-e-caramelle",
            level: 1,
            count: 16,
            children: []
          },
          {
            id: "infanzia-e-bambino",
            name: "Infanzia e Bambino",
            handle: "infanzia-e-bambino",
            level: 1,
            count: 5,
            children: []
          },
          {
            id: "salumi-e-formaggi",
            name: "Salumi e Formaggi",
            handle: "salumi-e-formaggi",
            level: 1,
            count: 22,
            children: [
              { id: "formaggi-freschi", name: "Formaggi Freschi", handle: "formaggi-freschi", level: 2, count: 8, children: [] },
              { id: "formaggi-stagionati", name: "Formaggi Stagionati", handle: "formaggi-stagionati", level: 2, count: 7, children: [] },
              { id: "salumi", name: "Salumi", handle: "salumi", level: 2, count: 7, children: [] }
            ]
          },
          {
            id: "creme-e-confetture",
            name: "Creme e Confetture",
            handle: "creme-e-confetture",
            level: 1,
            count: 9,
            children: []
          },
          {
            id: "olio-aceto-e-sale",
            name: "Olio, Aceto e Sale",
            handle: "olio-aceto-e-sale",
            level: 1,
            count: 14,
            children: []
          },
          {
            id: "caffe-solubili-e-zucchero",
            name: "Caffè, Solubili e Zucchero",
            handle: "caffe-solubili-e-zucchero",
            level: 1,
            count: 18,
            children: []
          }
        ]
      },
      {
        id: "bibite",
        name: "Bibite",
        handle: "bibite",
        level: 0,
        count: 56,
        children: [
          { id: "vini-rossi", name: "Vini Rossi", handle: "vini-rossi", level: 1, count: 18, children: [] },
          { id: "vini-bianchi-spumanti", name: "Vini Bianchi e Spumanti", handle: "vini-bianchi-spumanti", level: 1, count: 15, children: [] },
          { id: "birre-e-liquori", name: "Birre e Liquori", handle: "birre-e-liquori", level: 1, count: 13, children: [] },
          { id: "bevande-analcoliche", name: "Bevande Analcoliche", handle: "bevande-analcoliche", level: 1, count: 10, children: [] }
        ]
      },
      {
        id: "cura-della-casa",
        name: "Cura della Casa",
        handle: "cura-della-casa",
        level: 0,
        count: 34,
        children: [
          { id: "bucato", name: "Bucato", handle: "bucato", level: 1, count: 12, children: [] },
          { id: "superfici-e-pavimenti", name: "Superfici e Pavimenti", handle: "superfici-e-pavimenti", level: 1, count: 10, children: [] },
          { id: "cucina-e-stoviglie", name: "Cucina e Stoviglie", handle: "cucina-e-stoviglie", level: 1, count: 12, children: [] }
        ]
      },
      {
        id: "cura-del-corpo",
        name: "Cura del Corpo",
        handle: "cura-del-corpo",
        level: 0,
        count: 42,
        children: [
          { id: "bagnodoccia-e-creme", name: "Bagnodoccia e Creme", handle: "bagnodoccia-e-creme", level: 1, count: 15, children: [] },
          { id: "igiene-orale", name: "Igiene Orale", handle: "igiene-orale", level: 1, count: 12, children: [] },
          { id: "shampoo-e-balsamo", name: "Shampoo e Balsamo", handle: "shampoo-e-balsamo", level: 1, count: 15, children: [] }
        ]
      },
      {
        id: "pet-food",
        name: "Pet Food",
        handle: "pet-food",
        level: 0,
        count: 16,
        children: [
          { id: "cibo-per-cani", name: "Cibo per Cani", handle: "cibo-per-cani", level: 1, count: 8, children: [] },
          { id: "cibo-per-gatti", name: "Cibo per Gatti", handle: "cibo-per-gatti", level: 1, count: 8, children: [] }
        ]
      },
      {
        id: "gift-card",
        name: "Gift Card",
        handle: "gift-card",
        level: 0,
        count: 4,
        children: []
      },
      {
        id: "save-food",
        name: "Save Food",
        handle: "save-food",
        level: 0,
        count: 8,
        children: []
      }
    ],
    featured: [],
    brands: [],
    price: { enabled: true, min: 0, max: 100 },
    giftCard: { enabled: true },
    saveFood: { enabled: true }
  }
};
