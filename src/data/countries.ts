
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
    name: "RDC Congo",
    code: "+243",
    cities: [
      { name: "Kinshasa" },
      { name: "Lubumbashi" },
      { name: "Mbuji-Mayi" },
      { name: "Kisangani" },
      { name: "Goma" }
    ],
    paymentMethods: ["Orange Money", "Airtel Money", "M-Pesa"]
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
    name: "Cameroun",
    code: "+237",
    cities: [
      { name: "Yaoundé" },
      { name: "Douala" },
      { name: "Bamenda" },
      { name: "Bafoussam" },
      { name: "Garoua" }
    ],
    paymentMethods: ["Orange Money", "MTN Mobile Money"]
  },
  {
    name: "Sénégal",
    code: "+221",
    cities: [
      { name: "Dakar" },
      { name: "Thiès" },
      { name: "Rufisque" },
      { name: "Saint-Louis" },
      { name: "Kaolack" }
    ],
    paymentMethods: ["Orange Money", "Wave", "Free Money"]
  },
  {
    name: "Côte d'Ivoire",
    code: "+225",
    cities: [
      { name: "Abidjan" },
      { name: "Yamoussoukro" },
      { name: "Bouaké" },
      { name: "Daloa" },
      { name: "San-Pédro" }
    ],
    paymentMethods: ["Orange Money", "MTN Mobile Money", "Moov Money"]
  },
  {
    name: "Guinée",
    code: "+224",
    cities: [
      { name: "Conakry" },
      { name: "Nzérékoré" },
      { name: "Kankan" },
      { name: "Kindia" },
      { name: "Labé" }
    ],
    paymentMethods: ["Orange Money", "MTN Mobile Money"]
  },
  {
    name: "Togo",
    code: "+228",
    cities: [
      { name: "Lomé" },
      { name: "Sokodé" },
      { name: "Kara" },
      { name: "Palimé" },
      { name: "Atakpamé" }
    ],
    paymentMethods: ["Moov Money", "T-Money"]
  },
  {
    name: "Niger",
    code: "+227",
    cities: [
      { name: "Niamey" },
      { name: "Zinder" },
      { name: "Maradi" },
      { name: "Agadez" },
      { name: "Tahoua" }
    ],
    paymentMethods: ["Orange Money", "Moov Money"]
  },
  {
    name: "Centrafrique",
    code: "+236",
    cities: [
      { name: "Bangui" },
      { name: "Bimbo" },
      { name: "Mbaïki" },
      { name: "Carnot" },
      { name: "Bambari" }
    ],
    paymentMethods: ["Orange Money", "Moov Money"]
  },
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
      { name: "Bordeaux" },
      { name: "Lille" },
      { name: "Rennes" }
    ],
    paymentMethods: ["Carte Bancaire", "PayPal", "Virement", "Lydia"]
  },
  {
    name: "Canada",
    code: "+1",
    cities: [
      { name: "Toronto" },
      { name: "Montreal" },
      { name: "Vancouver" },
      { name: "Calgary" },
      { name: "Ottawa" },
      { name: "Edmonton" },
      { name: "Winnipeg" },
      { name: "Quebec" },
      { name: "Hamilton" },
      { name: "Kitchener" }
    ],
    paymentMethods: ["Interac e-Transfer", "PayPal", "Virement", "Paymi"]
  }
];
