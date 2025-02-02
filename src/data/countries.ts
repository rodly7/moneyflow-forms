export type City = {
  name: string;
  paymentMethods?: string[];
};

export type Country = {
  name: string;
  code: string;
  cities: City[];
  paymentMethods: string[];
};

export const countries: Country[] = [
  {
    name: "Congo Brazzaville",
    code: "+242",
    cities: [
      { name: "Brazzaville" },
      { name: "Pointe-Noire" },
      { name: "Dolisie" },
      { name: "Nkayi" },
      { name: "Ouesso" }
    ],
    paymentMethods: ["Airtel Money", "Mobile Money"]
  },
  {
    name: "Gabon",
    code: "+241",
    cities: [
      { name: "Libreville" },
      { name: "Port-Gentil" },
      { name: "Franceville" },
      { name: "Oyem" }
    ],
    paymentMethods: ["Airtel Money", "Moov Money"]
  },
  {
    name: "Sénégal",
    code: "+221",
    cities: [
      { name: "Dakar" },
      { name: "Thiès" },
      { name: "Rufisque" },
      { name: "Saint-Louis" }
    ],
    paymentMethods: ["Orange Money", "Wave"]
  },
  {
    name: "Côte d'Ivoire",
    code: "+225",
    cities: [
      { name: "Abidjan" },
      { name: "Bouaké" },
      { name: "Yamoussoukro" },
      { name: "Korhogo" }
    ],
    paymentMethods: ["Orange Money", "MTN Money"]
  },
  {
    name: "République Démocratique du Congo",
    code: "+243",
    cities: [
      { name: "Kinshasa" },
      { name: "Lubumbashi" },
      { name: "Goma" },
      { name: "Kisangani" }
    ],
    paymentMethods: ["M-Pesa", "Orange Money"]
  },
  {
    name: "France",
    code: "+33",
    cities: [
      { name: "Paris" },
      { name: "Marseille" },
      { name: "Lyon" },
      { name: "Toulouse" }
    ],
    paymentMethods: ["Virement bancaire", "PayPal"]
  },
  {
    name: "Canada",
    code: "+1",
    cities: [
      { name: "Toronto" },
      { name: "Montréal" },
      { name: "Vancouver" },
      { name: "Ottawa" }
    ],
    paymentMethods: ["Interac", "Virement bancaire"]
  }
];