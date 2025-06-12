
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
  // Afrique Centrale (XAF)
  {
    name: "Cameroun",
    code: "+237",
    cities: [
      { name: "Douala" },
      { name: "Yaoundé" },
      { name: "Bafoussam" },
      { name: "Garoua" },
      { name: "Bamenda" }
    ],
    paymentMethods: ["Orange Money", "MTN Mobile Money", "Express Union"]
  },
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
    name: "Tchad",
    code: "+235",
    cities: [
      { name: "N'Djamena" },
      { name: "Moundou" },
      { name: "Sarh" },
      { name: "Abéché" }
    ],
    paymentMethods: ["Airtel Money", "Tigo Cash"]
  },
  {
    name: "République Centrafricaine",
    code: "+236",
    cities: [
      { name: "Bangui" },
      { name: "Berbérati" },
      { name: "Carnot" },
      { name: "Bambari" }
    ],
    paymentMethods: ["Orange Money", "Moov Money"]
  },
  {
    name: "Guinée Équatoriale",
    code: "+240",
    cities: [
      { name: "Malabo" },
      { name: "Bata" },
      { name: "Ebebiyin" },
      { name: "Aconibe" }
    ],
    paymentMethods: ["Orange Money"]
  },

  // Afrique de l'Ouest (XOF)
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
    name: "Mali",
    code: "+223",
    cities: [
      { name: "Bamako" },
      { name: "Sikasso" },
      { name: "Mopti" },
      { name: "Koutiala" }
    ],
    paymentMethods: ["Orange Money", "Moov Money"]
  },
  {
    name: "Burkina Faso",
    code: "+226",
    cities: [
      { name: "Ouagadougou" },
      { name: "Bobo-Dioulasso" },
      { name: "Koudougou" },
      { name: "Banfora" }
    ],
    paymentMethods: ["Orange Money", "Moov Money"]
  },
  {
    name: "Niger",
    code: "+227",
    cities: [
      { name: "Niamey" },
      { name: "Zinder" },
      { name: "Maradi" },
      { name: "Agadez" }
    ],
    paymentMethods: ["Orange Money", "Moov Money"]
  },
  {
    name: "Bénin",
    code: "+229",
    cities: [
      { name: "Cotonou" },
      { name: "Porto-Novo" },
      { name: "Parakou" },
      { name: "Djougou" }
    ],
    paymentMethods: ["MTN Money", "Moov Money"]
  },
  {
    name: "Togo",
    code: "+228",
    cities: [
      { name: "Lomé" },
      { name: "Sokodé" },
      { name: "Kara" },
      { name: "Atakpamé" }
    ],
    paymentMethods: ["T-Money", "Moov Money"]
  },

  // République Démocratique du Congo (utilisera XAF pour simplifier)
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

  // Europe (EUR)
  {
    name: "France",
    code: "+33",
    cities: [
      { name: "Paris" },
      { name: "Marseille" },
      { name: "Lyon" },
      { name: "Toulouse" },
      { name: "Nice" },
      { name: "Nantes" },
      { name: "Strasbourg" },
      { name: "Montpellier" }
    ],
    paymentMethods: ["Virement bancaire", "PayPal", "Carte bancaire"]
  },
  {
    name: "Allemagne",
    code: "+49",
    cities: [
      { name: "Berlin" },
      { name: "Munich" },
      { name: "Hambourg" },
      { name: "Cologne" }
    ],
    paymentMethods: ["Virement bancaire", "PayPal"]
  },
  {
    name: "Italie",
    code: "+39",
    cities: [
      { name: "Rome" },
      { name: "Milan" },
      { name: "Naples" },
      { name: "Turin" }
    ],
    paymentMethods: ["Virement bancaire", "PostePay"]
  },
  {
    name: "Espagne",
    code: "+34",
    cities: [
      { name: "Madrid" },
      { name: "Barcelone" },
      { name: "Valence" },
      { name: "Séville" }
    ],
    paymentMethods: ["Virement bancaire", "Bizum"]
  },
  {
    name: "Belgique",
    code: "+32",
    cities: [
      { name: "Bruxelles" },
      { name: "Anvers" },
      { name: "Gand" },
      { name: "Charleroi" }
    ],
    paymentMethods: ["Virement bancaire", "Bancontact"]
  },

  // Canada (CAD)
  {
    name: "Canada",
    code: "+1",
    cities: [
      { name: "Toronto" },
      { name: "Montréal" },
      { name: "Vancouver" },
      { name: "Ottawa" },
      { name: "Calgary" },
      { name: "Edmonton" },
      { name: "Winnipeg" },
      { name: "Québec" }
    ],
    paymentMethods: ["Interac", "Virement bancaire", "PayPal"]
  }
];
