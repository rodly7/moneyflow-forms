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
    name: "Sénégal",
    code: "+221",
    cities: [
      { name: "Dakar" },
      { name: "Thiès" },
      { name: "Rufisque" },
      { name: "Saint-Louis" },
      { name: "Mbour" }
    ],
    paymentMethods: ["Wave", "Orange Money"]
  },
  {
    name: "Gabon",
    code: "+241",
    cities: [
      { name: "Libreville" },
      { name: "Port-Gentil" },
      { name: "Franceville" },
      { name: "Oyem" },
      { name: "Moanda" }
    ],
    paymentMethods: ["Airtel Money"]
  }
];